import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { hash } from 'bcrypt';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Check if super admin already exists
    const existingUser = await UserModel.findOne({ email: 'superadmin@dms.com' });
    
    if (existingUser) {
      // Update password for existing user
      const hashedPassword = await hash('12345', 10);
      await UserModel.findByIdAndUpdate(existingUser._id, {
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Super admin user password updated successfully',
        email: 'superadmin@dms.com'
      });
    }
    
    // Create new super admin user
    const hashedPassword = await hash('12345', 10);
    
    const adminUser = await UserModel.create({
      name: 'Super Admin',
      email: 'superadmin@dms.com',
      password: hashedPassword,
      role: 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Super admin user created successfully',
      user: {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user', details: error.message },
      { status: 500 }
    );
  }
} 