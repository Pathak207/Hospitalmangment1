import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';
import OrganizationModel from '@/models/Organization';
import SubscriptionModel from '@/models/Subscription';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import { getStripeInstance } from '@/lib/stripe';

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    // Get dynamic Stripe instance
    const stripe = await getStripeInstance();
    
    if (!stripe) {
      console.error('Stripe instance not available');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get metadata from payment intent
    const { planId, billingCycle, organizationId, userId } = paymentIntent.metadata;

    // Verify organization access
    if (session.user.organization !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized organization access' }, { status: 403 });
    }

    // Get plan and organization details
    const [plan, organization] = await Promise.all([
      SubscriptionPlanModel.findById(planId),
      OrganizationModel.findById(organizationId)
    ]);

    if (!plan || !organization) {
      return NextResponse.json({ error: 'Plan or organization not found' }, { status: 404 });
    }

    // Check if subscription already exists and update it, or create new one
    let subscription = await SubscriptionModel.findOne({ organization: organizationId });
    
    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    if (subscription) {
      // Update existing subscription
      subscription.plan = plan._id;
      subscription.status = 'active';
      subscription.billingCycle = billingCycle;
      subscription.amount = amount;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.paymentMethod = 'stripe';
      subscription.lastPaymentDate = new Date();
      subscription.nextPaymentDate = endDate;
      subscription.updatedAt = new Date();
      
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await SubscriptionModel.create({
        organization: organizationId,
        plan: plan._id,
        status: 'active',
        billingCycle,
        amount,
        startDate,
        endDate,
        paymentMethod: 'stripe',
        lastPaymentDate: new Date(),
        nextPaymentDate: endDate,
        stripeCustomerId: organization.stripeCustomerId,
        usage: {
          patients: 0,
          users: 1,
          appointments: 0,
          lastUpdated: new Date()
        },
        autoRenew: true,
        cancelAtPeriodEnd: false,
        createdBy: userId
      });
    }

    // Create payment record
    await SubscriptionPayment.create({
      organization: organizationId,
      subscription: subscription._id,
      amount: amount,
      currency: 'USD',
      description: `Subscription payment for ${plan.name} (${billingCycle})`,
      paymentMethod: 'stripe',
      billingCycle: billingCycle,
      stripePaymentIntentId: paymentIntentId,
      transactionId: paymentIntent.id,
      notes: `Stripe payment for ${plan.name} subscription`,
      status: 'completed',
      processedBy: userId
    });

    // Update organization subscription reference
    await OrganizationModel.findByIdAndUpdate(organizationId, {
      subscription: subscription._id,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription._id,
        plan: plan.name,
        status: subscription.status,
        endDate: subscription.endDate
      }
    });

  } catch (error) {
    console.error('Error completing subscription payment:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 