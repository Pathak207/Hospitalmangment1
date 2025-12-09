import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';
import OrganizationModel from '@/models/Organization';
import SubscriptionModel from '@/models/Subscription';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import { createPaymentIntent, createStripeCustomer } from '@/lib/stripe';

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot create subscriptions for themselves
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot create subscriptions' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();
    const { planId, billingCycle, organizationId } = data;

    // Validate required fields
    if (!planId || !billingCycle || !organizationId) {
      return NextResponse.json({ 
        error: 'Plan ID, billing cycle, and organization ID are required' 
      }, { status: 400 });
    }

    // Check if user belongs to the organization
    if (session.user.organization !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized organization access' }, { status: 403 });
    }

    // Get plan details
    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get organization details
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

    // Create or get Stripe customer
    let stripeCustomerId = organization.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const stripeCustomer = await createStripeCustomer(organization);
        stripeCustomerId = stripeCustomer.id;
        
        // Update organization with Stripe customer ID
        await OrganizationModel.findByIdAndUpdate(organizationId, {
          stripeCustomerId: stripeCustomerId,
        });
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError);
        return NextResponse.json({ 
          error: 'Failed to create customer',
          details: stripeError.message 
        }, { status: 500 });
      }
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(amount, 'usd', stripeCustomerId, {
      planId,
      billingCycle,
      organizationId,
      userId: session.user.id
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 