import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import OrganizationModel from '@/models/Organization';
import { stripeUtils } from '@/lib/stripe';

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot upgrade subscriptions
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot upgrade subscriptions' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { planId, billingCycle } = body;

    if (!planId || !billingCycle) {
      return NextResponse.json({ 
        error: 'Plan ID and billing cycle are required' 
      }, { status: 400 });
    }

    // Get organization
    const organization = await OrganizationModel.findById(session.user.organization);
    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    // Get current subscription
    const currentSubscription = await SubscriptionModel.findOne({
      organization: organization._id,
      status: { $in: ['active', 'trialing'] }
    }).populate('plan');

    if (!currentSubscription) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 404 });
    }

    // Get new plan
    const newPlan = await SubscriptionPlan.findById(planId);
    if (!newPlan) {
      return NextResponse.json({ 
        error: 'Invalid plan selected' 
      }, { status: 400 });
    }

    // Check if it's actually an upgrade/downgrade
    if (currentSubscription.plan._id.toString() === planId && currentSubscription.billingCycle === billingCycle) {
      return NextResponse.json({ 
        error: 'You are already on this plan' 
      }, { status: 400 });
    }

    // Handle trial-only to paid subscription conversion
    if (currentSubscription.paymentMethod === 'manual' && !organization.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'Payment method required for paid subscription. Please add a payment method first.' 
      }, { status: 400 });
    }

    // Update subscription through Stripe if it's a Stripe subscription
    if (currentSubscription.stripeSubscriptionId && organization.stripeCustomerId) {
      const newPriceId = billingCycle === 'yearly' 
        ? newPlan.stripePriceIdYearly 
        : newPlan.stripePriceIdMonthly;

      if (!newPriceId) {
        return NextResponse.json({ 
          error: 'Plan pricing not configured properly' 
        }, { status: 500 });
      }

      // Update Stripe subscription
      const updateResult = await stripeUtils.updateSubscription(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{
            id: currentSubscription.stripeSubscriptionId,
            price: newPriceId
          }],
          proration_behavior: 'create_prorations'
        }
      );

      if (!updateResult.success) {
        return NextResponse.json({ 
          error: 'Failed to update subscription',
          details: updateResult.error
        }, { status: 500 });
      }
    }

    // Update subscription in database
    const newAmount = billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice;
    
    currentSubscription.plan = newPlan._id;
    currentSubscription.billingCycle = billingCycle;
    currentSubscription.amount = newAmount;
    currentSubscription.updatedAt = new Date();

    // If upgrading from trial to paid, update payment method
    if (currentSubscription.paymentMethod === 'manual' && organization.stripeCustomerId) {
      currentSubscription.paymentMethod = 'stripe';
    }

    await currentSubscription.save();

    // Populate the plan details for response
    await currentSubscription.populate('plan');

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        id: currentSubscription._id,
        plan: currentSubscription.plan.name,
        billingCycle: currentSubscription.billingCycle,
        amount: currentSubscription.amount,
        status: currentSubscription.status,
        nextPaymentDate: currentSubscription.nextPaymentDate
      }
    });

  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 