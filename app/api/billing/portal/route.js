import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import OrganizationModel from '@/models/Organization';
import { stripeUtils } from '@/lib/stripe';

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access billing portal
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access billing portal' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { returnUrl } = body;

    // Get organization
    const organization = await OrganizationModel.findById(session.user.organization);
    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    // Check if organization has a Stripe customer ID
    if (!organization.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No billing account found. Please contact support.' 
      }, { status: 400 });
    }

    // Create billing portal session
    const portalResult = await stripeUtils.createBillingPortalSession(
      organization.stripeCustomerId,
      returnUrl || `${process.env.NEXTAUTH_URL}/billing`
    );

    if (!portalResult.success) {
      return NextResponse.json({ 
        error: 'Failed to create billing portal session',
        details: portalResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: portalResult.session.url
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 