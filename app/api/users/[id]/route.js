import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import { updateSubscriptionUsage } from '@/lib/subscription-utils';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = params;
    
    // Build query with organization filter
    const query = { _id: id };
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      query.organization = session.user.organization;
    }
    
    const user = await UserModel.findOne(query)
      .select('-password')
      .populate('organization', 'name');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization admins/doctors can update users (not super admin)
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot update organization users directly' }, { status: 403 });
    }

    // Only admin or doctor role can update users
    if (!['admin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to update users' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    const { id } = params;
    const data = await request.json();

    // Prevent updating password through this endpoint
    if (data.password) {
      delete data.password;
    }

    // Ensure user can only update users from their organization
    const query = { _id: id, organization: session.user.organization };
    
    // Update user
    const user = await UserModel.findOneAndUpdate(
      query,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization admins/doctors can delete users (not super admin)
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot delete organization users directly' }, { status: 403 });
    }

    // Only admin or doctor role can delete users
    if (!['admin', 'doctor'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to delete users' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    // Prevent users from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    // First, verify the user belongs to the same organization
    const user = await UserModel.findOne({ _id: id, organization: session.user.organization });
    if (!user) {
      return NextResponse.json({ error: 'User not found or access denied' }, { status: 404 });
    }
    
    // Delete user
    await UserModel.findByIdAndDelete(id);
    
    // Update subscription usage counters
    try {
      await updateSubscriptionUsage(session.user.organization);
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 