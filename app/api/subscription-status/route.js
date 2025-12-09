import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';
import OrganizationModel from '@/models/Organization';
import SubscriptionPlanModel from '@/models/SubscriptionPlan';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ 
        isActive: false, 
        reason: 'Organization ID is required' 
      }, { status: 400 });
    }

    await dbConnect();

    // Find organization
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ 
        isActive: false, 
        reason: 'Organization not found' 
      }, { status: 404 });
    }

    // Check if organization is active
    if (!organization.isActive) {
      return NextResponse.json({ 
        isActive: false, 
        reason: 'Organization is inactive' 
      });
    }

    // Check if organization has unlimited subscription type
    if (organization.subscriptionType === 'unlimited') {
      return NextResponse.json({ 
        isActive: true,
        organization: {
          id: organization._id,
          subscriptionType: 'unlimited'
        },
        subscription: {
          status: 'unlimited',
          plan: 'Unlimited Subscriber',
          endDate: null, // No end date for unlimited
          trialEndDate: null,
          billingCycle: 'unlimited',
          daysRemaining: -1, // Unlimited
        }
      });
    }

    // Find subscription (including trial-only subscriptions)
    const subscription = await SubscriptionModel.findOne({
      organization: organizationId,
      status: { $in: ['active', 'trialing'] }
    });

    // If no subscription found, check if organization is still in trial period
    if (!subscription) {
      // Check if organization was created recently and should be in trial
      const now = new Date();
      const organizationCreated = new Date(organization.createdAt);
      const defaultTrialDays = 14; // Default trial period
      const trialEndDate = new Date(organizationCreated);
      trialEndDate.setDate(trialEndDate.getDate() + defaultTrialDays);

      if (now < trialEndDate) {
        // Organization is still in default trial period
        const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
        return NextResponse.json({ 
          isActive: true,
          organization: {
            id: organization._id,
            subscriptionType: organization.subscriptionType || 'regular'
          },
          subscription: {
            status: 'trialing',
            plan: 'Trial Account',
            endDate: trialEndDate,
            trialEndDate: trialEndDate,
            billingCycle: 'trial',
            daysRemaining: daysRemaining,
          }
        });
      }

      return NextResponse.json({ 
        isActive: false, 
        reason: 'No active subscription found' 
      });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired = subscription.endDate < now;

    if (isExpired) {
      // Update subscription status to expired
      await SubscriptionModel.findByIdAndUpdate(subscription._id, {
        status: 'inactive',
        updatedAt: new Date(),
      });

      return NextResponse.json({ 
        isActive: false, 
        reason: 'Subscription expired',
        expiredAt: subscription.endDate 
      });
    }

    // Check trial status
    const isTrialing = subscription.status === 'trialing';
    const trialExpired = isTrialing && subscription.trialEndDate && subscription.trialEndDate < now;

    if (trialExpired) {
      return NextResponse.json({ 
        isActive: false, 
        reason: 'Trial period expired',
        trialExpiredAt: subscription.trialEndDate 
      });
    }

    // Get plan details separately if needed
    let planName = 'Unknown Plan';
    try {
      const plan = await SubscriptionPlanModel.findById(subscription.plan);
      if (plan) {
        planName = plan.name;
      }
    } catch (planError) {
      console.warn('Could not fetch plan details:', planError.message);
    }

    // Subscription is active
    return NextResponse.json({ 
      isActive: true,
      organization: {
        id: organization._id,
        subscriptionType: organization.subscriptionType || 'regular'
      },
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: planName,
        endDate: subscription.endDate,
        trialEndDate: subscription.trialEndDate,
        billingCycle: subscription.billingCycle,
        daysRemaining: Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24)),
      }
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json({ 
      isActive: false, 
      reason: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 