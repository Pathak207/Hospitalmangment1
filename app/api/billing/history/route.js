import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import OrganizationModel from '@/models/Organization';
import { stripeUtils } from '@/lib/stripe';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access billing history
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access billing history' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organization;

    console.log('🔍 BILLING HISTORY DEBUG:', {
      sessionUser: session.user,
      requestedOrgId: searchParams.get('organizationId'),
      sessionOrgId: session.user.organization,
      finalOrgId: organizationId
    });

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID is required' 
      }, { status: 400 });
    }

    // Check if user belongs to the organization
    if (session.user.organization !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized organization access' }, { status: 403 });
    }

    // Get organization
    const organization = await OrganizationModel.findById(organizationId);
    if (!organization) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }

    // Get all subscriptions for this organization
    const subscriptions = await SubscriptionModel.find({
      organization: organizationId
    })
    .populate('plan', 'name')
    .sort({ createdAt: -1 });

    // Get all subscription payments for this organization
    const subscriptionPayments = await SubscriptionPayment.find({
      organization: organizationId,
      status: 'completed'
    })
    .populate({
      path: 'subscription',
      populate: {
        path: 'plan',
        select: 'name'
      }
    })
    .sort({ createdAt: -1 });

    // Get Stripe invoices if customer exists
    let stripeInvoices = [];
    if (organization.stripeCustomerId) {
      try {
        console.log('🔍 STRIPE: Attempting to fetch invoices for customer:', organization.stripeCustomerId);
      const invoicesResult = await stripeUtils.getCustomerInvoices(organization.stripeCustomerId, 20);
        console.log('🔍 STRIPE: Invoices result:', invoicesResult);
      if (invoicesResult.success) {
        stripeInvoices = invoicesResult.invoices;
      }
      } catch (stripeError) {
        console.error('🔍 STRIPE ERROR: Failed to fetch Stripe invoices:', stripeError);
        // Continue without Stripe invoices if there's an error
        stripeInvoices = [];
      }
    }

    // Create billing history from subscription payments
    const billingHistory = [];

    // Add subscription payments to billing history
    subscriptionPayments.forEach(payment => {
      billingHistory.push({
        id: payment._id,
        date: payment.createdAt,
        amount: payment.amount,
        status: 'paid',
        plan: payment.subscription?.plan?.name || 'Unknown Plan',
        billingCycle: payment.billingCycle,
        subscriptionId: payment.subscription?._id,
        transactionId: payment.transactionId,
        paymentMethod: payment.paymentMethod,
        downloadUrl: null, // Could generate invoice URL here
        pdfUrl: null,
        type: 'subscription_payment'
      });
    });

    // Add Stripe invoices to billing history (if not already covered by subscription payments)
    stripeInvoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        // Check if we already have this payment from SubscriptionPayment
        const existingPayment = subscriptionPayments.find(payment => 
          payment.stripePaymentIntentId === invoice.payment_intent ||
          payment.stripeInvoiceId === invoice.id
        );

        if (!existingPayment) {
          billingHistory.push({
            id: invoice.id,
            date: new Date(invoice.created * 1000),
            amount: invoice.amount_paid / 100,
            status: 'paid',
            plan: 'Stripe Subscription',
            billingCycle: 'monthly',
            stripeInvoiceId: invoice.id,
            downloadUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf,
            type: 'stripe_invoice'
          });
        }
      }
    });

    // Sort billing history by date (newest first)
    billingHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get current subscription details
    const currentSubscription = await SubscriptionModel.findOne({
      organization: organizationId,
      status: { $in: ['active', 'trialing'] }
    }).populate('plan', 'name monthlyPrice yearlyPrice features');

    // Get payment methods from Stripe
    const paymentMethods = [];
    if (organization.stripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentMethodsResult = await stripe.paymentMethods.list({
          customer: organization.stripeCustomerId,
          type: 'card'
        });

        paymentMethods.push(...paymentMethodsResult.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          isDefault: pm.id === organization.defaultPaymentMethod
        })));
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Don't add fallback data, just log the error
      }
    }

    console.log(`Billing history for organization ${organizationId}:`, {
      subscriptionPayments: subscriptionPayments.length,
      stripeInvoices: stripeInvoices.length,
      totalBillingHistory: billingHistory.length
    });

    // Debug: Log actual billing history data
    console.log('📋 BILLING HISTORY ITEMS:', billingHistory.map(item => ({
      id: item.id,
      date: item.date,
      amount: item.amount,
      status: item.status,
      type: item.type,
      paymentMethod: item.paymentMethod
    })));

    return NextResponse.json({
      success: true,
      billingHistory,
      currentSubscription,
      paymentMethods,
      organization: {
        id: organization._id,
        name: organization.name,
        email: organization.email,
        stripeCustomerId: organization.stripeCustomerId
      }
    });

  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to determine payment status from subscription status
function getPaymentStatus(subscriptionStatus) {
  switch (subscriptionStatus) {
    case 'active': return 'paid';
    case 'trialing': return 'trial';
    case 'past_due': return 'overdue';
    case 'cancelled': return 'cancelled';
    default: return 'pending';
  }
} 