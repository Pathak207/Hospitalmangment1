import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';

// GET - Get a specific subscription plan by ID
export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    
    const plan = await SubscriptionPlanModel.findById(id);
    
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan,
    });

  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update a subscription plan (Super Admin only)
export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can update subscription plans
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    const data = await request.json();
    
    const { 
      name, 
      description, 
      monthlyPrice, 
      yearlyPrice, 
      features,
      stripePriceIdMonthly,
      stripePriceIdYearly,
      isActive = true,
      isDefault = false,
      sortOrder = 0
    } = data;

    // Validate required fields
    if (!name || monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json({ 
        error: 'Name, monthly price, and yearly price are required' 
      }, { status: 400 });
    }

    // If this is set as default, unset other default plans
    if (isDefault) {
      await SubscriptionPlanModel.updateMany(
        { isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const plan = await SubscriptionPlanModel.findByIdAndUpdate(
      id,
      {
        name,
        description,
        monthlyPrice,
        yearlyPrice,
        features: features || {},
        stripePriceIdMonthly,
        stripePriceIdYearly,
        isActive,
        isDefault,
        sortOrder,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plan updated successfully',
      plan,
    });

  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete a subscription plan (Super Admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can delete subscription plans
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { id } = await params;
    
    const plan = await SubscriptionPlanModel.findByIdAndDelete(id);
    
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plan deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 