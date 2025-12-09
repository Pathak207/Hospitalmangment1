import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { getToken } from 'next-auth/jwt';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Get the current JWT token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.id) {
      return NextResponse.json({ 
        error: 'Unauthorized - No valid token' 
      }, { status: 401 });
    }

    // Fetch the latest user data from the database
    const user = await UserModel.findById(token.id).select('-password');
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Return the updated user data that the client can use to force a session update
    return NextResponse.json({
      success: true,
      requiresSignOut: true, // Signal that user needs to sign out and back in
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 