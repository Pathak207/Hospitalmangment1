import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';

// GET - Get all subscription plans (public access for active plans, authenticated access for all plans)
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const publicAccess = searchParams.get('public') === 'true';

    // For public access (landing page), only return active plans
    if (publicAccess) {
      const plans = await SubscriptionPlanModel.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 });

      return NextResponse.json({
        success: true,
        plans,
      });
    }

    // For authenticated access, check session
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query = activeOnly ? { isActive: true } : {};

    const plans = await SubscriptionPlanModel.find(query)
      .sort({ sortOrder: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      plans,
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create a new subscription plan (Super Admin only)
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can create subscription plans
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();
    const { 
      name, 
      description, 
      monthlyPrice, 
      yearlyPrice, 
      features,
      stripeMonthlyPriceId,
      stripeYearlyPriceId,
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
        { isDefault: true },
        { isDefault: false }
      );
    }

    const plan = await SubscriptionPlanModel.create({
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      features: features || {},
      stripeMonthlyPriceId,
      stripeYearlyPriceId,
      isDefault,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription plan created successfully',
      plan,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 