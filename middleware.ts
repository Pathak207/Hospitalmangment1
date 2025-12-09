import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This middleware protects all routes and handles multi-tenancy
export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Define paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/landing', // Allow access to dedicated landing page
    '/api/auth',
    '/api/webhooks',
    '/api/subscription-plans', // Allow access to view plans for signup
    '/api/settings/landing', // Allow public access to landing page content
    '/api/settings/payment-gateway', // Allow public access to Stripe settings (when ?public=true)
    '/api/global-currency', // Allow public access to global currency settings
    '/api/check-availability', // Allow public access to check email/organization availability
    '/subscription/payment',
    '/subscription/expired',
    '/subscription/organization-deactivated', // Allow access to organization deactivated page
    '/api/subscription-status', // Add this to prevent middleware loops
  ];

  // Define super admin only paths
  const superAdminPaths = [
    '/super-admin',
    '/api/organizations',
    '/api/subscriptions',
    '/api/super-admin',
  ];

  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Check if path requires super admin
  const isSuperAdminPath = superAdminPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Redirect unauthenticated users from protected routes to login page
  if (!isPublicPath && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle authenticated users
  if (isAuthenticated && token) {
    const userRole = token.role as string;
    const userOrganization = token.organization as string;

    // Check super admin access
    if (isSuperAdminPath && userRole !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Handle super admin routing
    if (userRole === 'super_admin') {
      // Allow super admin to access all super-admin paths
      if (request.nextUrl.pathname.startsWith('/super-admin')) {
        console.log('Super admin accessing super-admin path:', request.nextUrl.pathname);
        return NextResponse.next();
      }
      
      // Prevent super admin from accessing regular dashboard routes
      const regularDashboardPaths = [
        '/dashboard',
        '/patients',
        '/appointments',
        '/medications',
        '/prescriptions',
        '/payments',
        '/reports',
        '/labs',
        '/activities',
        '/profile',
        '/settings'
      ];
      
      const isRegularDashboardPath = regularDashboardPaths.some(path => 
        request.nextUrl.pathname === path || 
        request.nextUrl.pathname.startsWith(`${path}/`)
      );
      
      if (isRegularDashboardPath) {
        console.log('Super admin trying to access regular dashboard path:', request.nextUrl.pathname, 'redirecting to /super-admin');
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      // Super admin can access everything else, no subscription check needed
      return NextResponse.next();
    }

    // Handle regular users - check subscription status
    if (!isPublicPath && !isSuperAdminPath && userRole !== 'super_admin') {
      // Check if user has an organization
      if (!userOrganization) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // For now, let's skip the subscription check in middleware to avoid the loop
      // The subscription check will be handled by the individual pages/APIs
      // TODO: Implement direct database check here if needed
      
      // // Check subscription status
      // const subscriptionStatus = await checkSubscriptionStatus(userOrganization);
      // 
      // if (!subscriptionStatus.isActive) {
      //   // Allow access to payment page even if subscription is expired
      //   if (request.nextUrl.pathname.startsWith('/subscription/payment') || 
      //       request.nextUrl.pathname.startsWith('/subscription/expired')) {
      //     return NextResponse.next();
      //   }
      //   
      //   // Redirect to subscription payment page
      //   return NextResponse.redirect(new URL('/subscription/expired', request.url));
      // }
    }

    // Redirect authenticated users from login to appropriate dashboard
    if (request.nextUrl.pathname === '/login') {
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Redirect authenticated users from root path to appropriate dashboard
    if (request.nextUrl.pathname === '/') {
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // Add CORS headers to all responses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return response;
}

// Helper function to check subscription status (currently disabled to avoid loops)
async function checkSubscriptionStatus(organizationId: string) {
  try {
    // This is temporarily disabled to prevent middleware loops
    // In production, you'd want to implement direct database access here
    return { isActive: true, reason: 'Middleware check disabled' };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isActive: false, reason: 'Network error' };
  }
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /api/auth (NextAuth.js internals)
     * 3. /static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. All files in the public directory
     */
    '/((?!_next|api/auth|static|_vercel|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}; 