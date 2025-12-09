import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { validateSubscriptionLimit, updateSubscriptionUsage } from '@/lib/subscription-utils';
import { hash } from 'bcryptjs';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin can see all users, regular users only their organization's users
    if (session.user.role !== 'super_admin' && !session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const emailCheck = searchParams.get('email');

    // If email parameter is provided, check if email exists
    if (emailCheck) {
      const existing = await UserModel.findOne({ email: emailCheck.toLowerCase() });
      return NextResponse.json({ exists: !!existing });
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build base query with organization filter
    const baseQuery = session.user.role === 'super_admin' 
      ? {} 
      : { organization: session.user.organization };
    
    // Build query with search
    const query = search 
      ? {
          ...baseQuery,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } }
          ]
        } 
      : baseQuery;
    
    // Get users with pagination and search (exclude password)
    const users = await UserModel.find(query)
      .select('-password')
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await UserModel.countDocuments(query);
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization admins/doctors can create users (not super admin)
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot create organization users directly' }, { status: 403 });
    }

    // Only admin or doctor role can create users
    if (!['admin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create users' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Check subscription limits before creating user
    try {
      await validateSubscriptionLimit(session.user.organization, 'user', 'create');
    } catch (limitError) {
      return NextResponse.json({ 
        error: limitError.message,
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        type: 'user_limit'
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json({ 
        error: 'Name, email, password, and role are required' 
      }, { status: 400 });
    }

    // Validate role
    const allowedRoles = ['doctor', 'nurse', 'admin', 'staff'];
    if (!allowedRoles.includes(data.role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Allowed roles: ' + allowedRoles.join(', ') 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await hash(data.password, 12);
    
    // Create new user
    const user = await UserModel.create({
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      organization: session.user.organization,
      isActive: true
    });
    
    // Update subscription usage counters
    try {
      await updateSubscriptionUsage(session.user.organization);
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return NextResponse.json(userResponse, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 