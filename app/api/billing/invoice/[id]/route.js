import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access invoices
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access invoices' }, { status: 403 });
    }

    await dbConnect();

    const invoiceId = params.id;

    if (!invoiceId) {
      return NextResponse.json({ 
        error: 'Invoice ID is required' 
      }, { status: 400 });
    }

    // Find subscription by ID or Stripe subscription ID
    const subscription = await SubscriptionModel.findOne({
      $or: [
        { _id: invoiceId },
        { stripeSubscriptionId: invoiceId }
      ]
    })
    .populate('organization', 'name email')
    .populate('plan', 'name');

    if (!subscription) {
      return NextResponse.json({ 
        error: 'Invoice not found' 
      }, { status: 404 });
    }

    // Check if user belongs to the organization
    if (session.user.organization !== subscription.organization._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized organization access' }, { status: 403 });
    }

    // In a real application, you would:
    // 1. Fetch the actual invoice from Stripe using stripe.invoices.retrieve()
    // 2. Return the invoice PDF URL or generate a PDF
    
    // For now, return invoice details as JSON
    const invoiceData = {
      id: subscription._id,
      invoiceNumber: `INV-${subscription._id.toString().slice(-8)}`,
      date: subscription.lastPaymentDate || subscription.startDate,
      dueDate: subscription.endDate,
      amount: subscription.amount,
      currency: subscription.currency || 'USD',
      status: subscription.status === 'active' ? 'paid' : 'pending',
      organization: {
        name: subscription.organization.name,
        email: subscription.organization.email
      },
      plan: {
        name: subscription.plan?.name || 'Unknown Plan',
        billingCycle: subscription.billingCycle
      },
      lineItems: [
        {
          description: `${subscription.plan?.name || 'Subscription'} - ${subscription.billingCycle}`,
          amount: subscription.amount,
          quantity: 1
        }
      ],
      downloadUrl: subscription.stripeSubscriptionId 
        ? `https://invoice.stripe.com/i/acct_${subscription.stripeCustomerId}/${subscription.stripeSubscriptionId}`
        : null
    };

    // If Stripe subscription exists, redirect to Stripe invoice
    if (subscription.stripeSubscriptionId && invoiceData.downloadUrl) {
      return NextResponse.redirect(invoiceData.downloadUrl);
    }

    // Otherwise return invoice data
    return NextResponse.json({
      success: true,
      invoice: invoiceData
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 