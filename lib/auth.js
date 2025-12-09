import { getServerSession } from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "./db";
import { compare } from "bcrypt";
import UserModel from "@/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        
        try {
          const user = await UserModel.findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error("No user found with this email");
          }
          
          const passwordMatch = await compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            organization: user.organization?.toString(),
          };
        } catch (error) {
          throw new Error(error.message);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.organization = user.organization;
      }
      
      // Always fetch fresh data from database when update is triggered
      if (trigger === "update") {
        try {
          await dbConnect();
          const dbUser = await UserModel.findById(token.id).select('-password');
          if (dbUser) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.organization = dbUser.organization?.toString();
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.organization = token.organization;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    console.log('getAuthSession - Session:', session ? 'Found' : 'Not Found', 
                session ? `User: ${session.user.email}` : '');
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
} 