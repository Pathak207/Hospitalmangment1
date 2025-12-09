import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Organization from '@/models/Organization';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const organization = await Organization.findById(params.id)
      .populate('owner', 'name email phone role')
      .populate({
        path: 'subscription',
        populate: {
          path: 'plan',
          model: 'SubscriptionPlan'
        }
      });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Allow super admin to view any organization
    // Allow users to view their own organization (even if deactivated)
    if (session.user.role !== 'super_admin' && session.user.organization !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const data = await request.json();
    const { name, email, phone, website, address, isActive, subscriptionType } = data;

    // Check if organization exists
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Validate required fields only if they are being updated
    if ((name !== undefined && !name) || (email !== undefined && !email)) {
      return NextResponse.json({ error: 'Name and email cannot be empty' }, { status: 400 });
    }

    // Check if email is already taken by another organization (only if email is being updated)
    if (email !== undefined && email !== organization.email) {
      const existingOrg = await Organization.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: params.id }
      });
      if (existingOrg) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Prepare update object with only the fields that are provided
    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone?.trim();
    if (website !== undefined) updateData.website = website?.trim();
    if (address !== undefined) updateData.address = address || {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (subscriptionType !== undefined) updateData.subscriptionType = subscriptionType;

    // Update organization
    const updatedOrganization = await Organization.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('owner', 'name email phone role')
    .populate({
      path: 'subscription',
      populate: {
        path: 'plan',
        model: 'SubscriptionPlan'
      }
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Check if organization exists
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete associated subscription if exists
    if (organization.subscription) {
      await Subscription.findByIdAndDelete(organization.subscription);
    }

    // Delete associated users (owner and other users)
    await User.deleteMany({ organization: params.id });

    // Delete the organization
    await Organization.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 