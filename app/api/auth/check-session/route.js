import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    console.log('Check Session - Session:', session);
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session found',
        details: {
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || 'user'
      },
      details: {
        expires: session.expires,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: error.message || 'Error checking session',
      details: {
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 