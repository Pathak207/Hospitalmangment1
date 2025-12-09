import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { validateFeatureAccess, getSubscriptionDetails } from '@/lib/subscription-utils';
import dbConnect from '@/lib/db';
import OrganizationModel from '@/models/Organization';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin has access to all features
    if (session.user.role === 'super_admin') {
      return NextResponse.json({
        success: true,
        features: {
          customBranding: true,
          apiAccess: true,
          prioritySupport: true,
          advancedReports: true,
          smsNotifications: true,
          emailNotifications: true,
          dataBackup: true
        },
        plan: 'Super Admin'
      });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    await dbConnect();

    // Check if this is a trial account
    const organization = await OrganizationModel.findById(session.user.organization)
      .populate('subscription', 'status');
    
    const isTrialAccount = organization?.subscription?.status === 'trial' || 
                          organization?.subscription?.status === 'trialing' ||
                          !organization?.subscription;

    // For trial accounts, give access to all features
    if (isTrialAccount) {
      return NextResponse.json({
        success: true,
        features: {
          customBranding: true,
          apiAccess: true,
          prioritySupport: true,
          advancedReports: true,
          smsNotifications: true,
          emailNotifications: true,
          dataBackup: true
        },
        plan: 'Trial Account',
        usage: { patients: 0, users: 0, appointments: 0 },
        limits: {
          maxPatients: -1,
          maxUsers: -1,
          maxAppointments: -1
        }
      });
    }

    // Get subscription details for paid accounts
    const subscriptionDetails = await getSubscriptionDetails(session.user.organization);
    
    if (!subscriptionDetails) {
      return NextResponse.json({ 
        error: 'No active subscription found',
        features: {
          customBranding: false,
          apiAccess: false,
          prioritySupport: false,
          advancedReports: false,
          smsNotifications: false,
          emailNotifications: true,
          dataBackup: false
        }
      }, { status: 403 });
    }

    const features = subscriptionDetails.limits;
    
    return NextResponse.json({
      success: true,
      features,
      plan: subscriptionDetails.plan?.name || 'Unknown',
      usage: subscriptionDetails.usage,
      limits: {
        maxPatients: features.maxPatients,
        maxUsers: features.maxUsers,
        maxAppointments: features.maxAppointments
      }
    });
    
  } catch (error) {
    console.error('Error checking feature access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin has access to all features
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ hasAccess: true, plan: 'Super Admin' });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    const { feature } = await request.json();
    
    if (!feature) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    try {
      const hasAccess = await validateFeatureAccess(session.user.organization, feature);
      
      // Get plan name for response
      const subscriptionDetails = await getSubscriptionDetails(session.user.organization);
      
      return NextResponse.json({
        hasAccess,
        feature,
        plan: subscriptionDetails?.plan?.name || 'Unknown'
      });
      
    } catch (error) {
      return NextResponse.json({ 
        hasAccess: false, 
        feature,
        error: error.message 
      }, { status: 403 });
    }
    
  } catch (error) {
    console.error('Error validating feature access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 