import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { hash } from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session || !session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    await dbConnect();

    const user = await UserModel.findById(session.user.id).select('-password');
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        department: user.department || '',
        profilePicture: user.profilePicture || '',
        dateOfBirth: user.dateOfBirth,
        gender: user.gender || '',
        emergencyContact: user.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        experience: user.experience || 0,
        education: user.education || [],
        certifications: user.certifications || [],
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const session = await getAuthSession();
    
    if (!session || !session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Extract and validate fields
    const {
      name,
      email,
      phone,
      address,
      specialization,
      licenseNumber,
      department,
      dateOfBirth,
      gender,
      emergencyContact,
      experience,
      education,
      certifications,
      // Password change field
      newPassword
    } = body;

    await dbConnect();

    const user = await UserModel.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // If email is being changed, validate it's unique
    if (email && email !== user.email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ 
          error: 'Invalid email format' 
        }, { status: 400 });
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: session.user.id } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'Email address is already in use' 
        }, { status: 400 });
      }
    }

    // If password change is requested, hash the new password
    if (newPassword && newPassword.trim() !== '') {
      // Hash new password
      const hashedPassword = await hash(newPassword, 12);
      user.password = hashedPassword;
    }

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = { ...user.address, ...address };
    if (specialization !== undefined) user.specialization = specialization;
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
    if (department !== undefined) user.department = department;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) user.gender = gender;
    if (emergencyContact !== undefined) user.emergencyContact = { ...user.emergencyContact, ...emergencyContact };
    if (experience !== undefined) user.experience = experience;
    if (education !== undefined) user.education = education;
    if (certifications !== undefined) user.certifications = certifications;

    await user.save();

    // Return updated user data (without password)
    const updatedUser = await UserModel.findById(session.user.id).select('-password');

    // If name was updated, signal client to refresh session
    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      sessionRefreshRequired: name !== undefined, // Signal if name was changed
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone || '',
        address: updatedUser.address || {},
        specialization: updatedUser.specialization || '',
        licenseNumber: updatedUser.licenseNumber || '',
        department: updatedUser.department || '',
        profilePicture: updatedUser.profilePicture || '',
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender || '',
        emergencyContact: updatedUser.emergencyContact || {},
        experience: updatedUser.experience || 0,
        education: updatedUser.education || [],
        certifications: updatedUser.certifications || [],
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

    // If name was updated, add header to signal session refresh
    if (name !== undefined) {
      response.headers.set('X-Session-Refresh', 'true');
    }

    return response;

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 