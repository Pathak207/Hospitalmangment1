import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Organization from '@/models/Organization';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { type, value } = await request.json();
    
    if (!type || !value) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    let available = false;
    let message = '';

    switch (type) {
      case 'email':
        if (!value.includes('@')) {
          return NextResponse.json(
            { available: false, message: 'Invalid email format' },
            { status: 400 }
          );
        }
        
        const existingUser = await User.findOne({ email: value.toLowerCase() });
        available = !existingUser;
        message = available 
          ? 'Email is available' 
          : 'This email is already registered';
        break;

      case 'organization':
        if (value.trim().length < 2) {
          return NextResponse.json(
            { available: false, message: 'Organization name must be at least 2 characters' },
            { status: 400 }
          );
        }
        
        const existingOrg = await Organization.findOne({ 
          name: { $regex: new RegExp(`^${value.trim()}$`, 'i') } 
        });
        available = !existingOrg;
        message = available 
          ? 'Organization name is available' 
          : 'This organization name is already taken';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be "email" or "organization"' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      available,
      message,
      type,
      value
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
