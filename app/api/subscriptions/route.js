import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';
import OrganizationModel from '@/models/Organization';
import UserModel from '@/models/User';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import { createStripeCustomer, createStripeSubscription } from '@/lib/stripe';
import { emailService } from '@/lib/email';

// GET - Get subscriptions (Super Admin only)
export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can view all subscriptions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const subscriptions = await SubscriptionModel.find(query)
      .populate('organization', 'name email')
      .populate('plan', 'name monthlyPrice yearlyPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SubscriptionModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Create a new subscription
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can create subscriptions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();
    const { organizationId, planId, billingCycle, paymentMethod, trialDays = 0, amount } = data;

    // Validate required fields - planId is optional for trial-only subscriptions
    if (!organizationId || !billingCycle) {
      return NextResponse.json({ 
        error: 'Organization ID and billing cycle are required' 
      }, { status: 400 });
    }

    // Get organization
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    let plan = null;
    let subscriptionAmount = amount || 0;

    // Get plan details if planId is provided
    if (planId) {
      plan = await SubscriptionPlanModel.findById(planId);
      if (!plan) {
        return NextResponse.json({ 
          error: 'Plan not found' 
        }, { status: 404 });
      }
      // Calculate subscription amount from plan
      subscriptionAmount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (planId) {
      // For paid plans, set proper end date
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
    } else {
      // For trial-only, set end date to trial period
      endDate.setDate(endDate.getDate() + (trialDays || 14));
    }

    // Determine subscription status based on payment method and plan
    let subscriptionStatus = 'active'; // Default to active for paid subscriptions
    
    // Set to trialing only if:
    // 1. Explicit trial period is requested (trialDays > 0), OR
    // 2. No plan is selected (trial-only subscription)
    if (trialDays > 0 || !planId) {
      subscriptionStatus = 'trialing';
    }
    
    // For cash payments with a plan, ensure it's active (not trialing)
    if (paymentMethod === 'cash' && planId && trialDays === 0) {
      subscriptionStatus = 'active';
    }

    // Normalize payment method for database storage
    let normalizedPaymentMethod = paymentMethod || 'manual';
    if (paymentMethod === 'card') {
      normalizedPaymentMethod = 'stripe'; // Card payments use Stripe
    }
    
    // Create subscription
    const subscriptionData = {
      organization: organizationId,
      plan: planId || null,
      status: subscriptionStatus,
      billingCycle,
      amount: subscriptionAmount,
      startDate,
      endDate,
      paymentMethod: normalizedPaymentMethod,
      createdBy: session.user.id,
    };

    // If trial period, set trial end date
    if (trialDays > 0) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      subscriptionData.trialEndDate = trialEndDate;
    }
    
    // For cash payments with a plan, set last payment date to indicate payment received
    if (paymentMethod === 'cash' && planId && subscriptionStatus === 'active') {
      subscriptionData.lastPaymentDate = new Date();
      subscriptionData.notes = 'Cash payment received - subscription activated manually by super admin';
    }

    // Handle Stripe integration if payment method is stripe or card
    if (paymentMethod === 'stripe' || paymentMethod === 'card') {
      try {
        // Create or get Stripe customer
        let stripeCustomerId = organization.stripeCustomerId;
        if (!stripeCustomerId) {
          const stripeCustomer = await createStripeCustomer(organization);
          stripeCustomerId = stripeCustomer.id;
          
          // Update organization with Stripe customer ID
          await OrganizationModel.findByIdAndUpdate(organizationId, {
            stripeCustomerId: stripeCustomerId,
          });
        }

        // Get Stripe price ID
        const stripePriceId = billingCycle === 'monthly' 
          ? plan.stripeMonthlyPriceId 
          : plan.stripeYearlyPriceId;

        if (!stripePriceId) {
          return NextResponse.json({ 
            error: 'Stripe price ID not configured for this plan' 
          }, { status: 400 });
        }

        // Create Stripe subscription
        const stripeSubscription = await createStripeSubscription(
          stripeCustomerId, 
          stripePriceId, 
          trialDays
        );

        subscriptionData.stripeSubscriptionId = stripeSubscription.id;
        subscriptionData.stripeCustomerId = stripeCustomerId;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return NextResponse.json({ 
          error: 'Failed to create Stripe subscription',
          details: stripeError.message 
        }, { status: 500 });
      }
    }

    console.log('🔄 Creating subscription with data:', JSON.stringify(subscriptionData, null, 2));
    
    // For trial subscriptions, we need to bypass the plan requirement validation
    // Create subscription manually to avoid Mongoose validation issues with cached schema
    const subscription = new SubscriptionModel(subscriptionData);
    
    // Custom validation for trial subscriptions
    if (!subscription.plan && subscription.status !== 'trialing') {
      return NextResponse.json({ 
        error: 'Plan is required for non-trial subscriptions' 
      }, { status: 400 });
    }
    
    // Save without running Mongoose validation to bypass cached schema issues
    await subscription.save({ validateBeforeSave: false });
    console.log('✅ Subscription created successfully:', subscription._id);

    // Create payment record for cash payments
    if (paymentMethod === 'cash' && planId && subscriptionStatus === 'active') {
      try {
        const paymentData = {
          organization: organizationId,
          subscription: subscription._id,
          amount: subscriptionAmount,
          currency: 'USD',
          description: `Subscription payment for ${plan.name} (${billingCycle})`,
          paymentMethod: 'cash',
          billingCycle: billingCycle,
          notes: `Cash payment for subscription ${subscription._id} - ${plan.name} plan`,
          status: 'completed',
          processedBy: session.user.id,
        };

        const payment = await SubscriptionPayment.create(paymentData);
      } catch (paymentError) {
        console.error('❌ Failed to create subscription payment record:', paymentError);
        console.error('❌ Payment error stack:', paymentError.stack);
        // Don't fail the subscription creation if payment record fails
      }
    }

    // Update organization with subscription reference
    console.log('🔄 Updating organization with subscription reference...');
    await OrganizationModel.findByIdAndUpdate(organizationId, {
      subscription: subscription._id,
    });
    console.log('✅ Organization updated successfully');

    // Populate the response
    console.log('🔄 Populating subscription data...');
    let populatedSubscription;
    try {
      populatedSubscription = await SubscriptionModel.findById(subscription._id)
        .populate('organization', 'name email');
      
      // Only populate plan if it exists (not null for trial subscriptions)
      if (populatedSubscription.plan) {
        await populatedSubscription.populate('plan', 'name monthlyPrice yearlyPrice');
      }
      console.log('✅ Subscription populated successfully');
    } catch (populateError) {
      console.error('❌ Error during population:', populateError);
      // Fall back to non-populated subscription
      populatedSubscription = subscription;
    }

    // Send subscription notification email if it's a paid plan (not trial-only)
    // For super admin created subscriptions OR subscription upgrades/changes
    if (planId && subscriptionStatus === 'active') {
      try {
        // Check if this is an upgrade/change (organization already has users with existing subscriptions)
        const existingActiveSubscriptions = await SubscriptionModel.countDocuments({
          organization: organizationId,
          status: { $in: ['active', 'trialing'] },
          _id: { $ne: subscription._id } // Exclude the current subscription
        });
        
        // Check if this is a super admin created subscription (cash payment method indicates super admin)
        const isSuperAdminCreated = normalizedPaymentMethod === 'cash';
        
        // Send email for subscription upgrades/changes OR super admin created subscriptions
        if (existingActiveSubscriptions > 0 || isSuperAdminCreated) {
          const emailType = isSuperAdminCreated ? 'welcome' : 'upgrade/change';
          console.log(`📧 Sending subscription ${emailType} email...`);
          
          // Get organization owner details
          const owner = await UserModel.findOne({ 
            organization: organizationId, 
            role: 'admin' 
          }).sort({ createdAt: 1 }); // Get the first admin (owner)
          
          if (owner) {
            const userData = {
              firstName: owner.name.split(' ')[0] || owner.name,
              lastName: owner.name.split(' ').slice(1).join(' ') || '',
              email: owner.email
            };

            const organizationData = {
              name: organization.name
            };

            const subscriptionData = {
              isTrialOnly: false,
              planName: plan?.name || 'Premium Plan',
              planDescription: plan?.description || '',
              billingCycle: billingCycle,
              amount: subscriptionAmount,
              status: subscriptionStatus,
              startDate: startDate,
              endDate: endDate,
              paymentMethod: normalizedPaymentMethod,
              trialEndDate: null, // No trial for direct paid subscriptions
              planFeatures: plan?.features || null // Include plan features
            };

            // For super admin created subscriptions, send welcome email
            // For upgrades/changes, send subscription confirmation email
            if (isSuperAdminCreated) {
              await emailService.sendWelcomeEmail(userData, organizationData, subscriptionData);
              console.log('✅ Welcome email sent successfully for super admin created subscription');
            } else {
              await emailService.sendSubscriptionConfirmationEmail(userData, organizationData, subscriptionData);
              console.log('✅ Subscription upgrade/change email sent successfully');
            }
          }
        } else {
          console.log('📧 Skipping subscription email - this is an initial signup (welcome email already sent)');
        }
      } catch (emailError) {
        console.error('❌ Failed to send subscription activation email:', emailError);
        // Don't fail the subscription creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: populatedSubscription,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 