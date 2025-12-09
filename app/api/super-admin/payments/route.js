import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import SubscriptionPayment from '@/models/SubscriptionPayment';
import Organization from '@/models/Organization';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Fetch subscription payments for super admin
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search query for organizations if search term provided
    let organizationIds = [];
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const organizations = await Organization.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      organizationIds = organizations.map(org => org._id);
    }

    // Build subscription query
    const subscriptionQuery = {
      ...(organizationIds.length > 0 && { organization: { $in: organizationIds } }),
      // Only show subscriptions that have actually made payments
      $or: [
        { lastPaymentDate: { $exists: true, $ne: null } }, // Has made at least one payment
        { status: 'active', paymentMethod: 'stripe' }, // Active Stripe subscriptions (paid)
        { status: 'cancelled', lastPaymentDate: { $exists: true } } // Cancelled but had payments
      ]
    };

    // Get subscriptions with payment history and actual subscription payments
    const [subscriptions, subscriptionPayments] = await Promise.all([
      Subscription.find(subscriptionQuery)
        .populate('organization', 'name email stripeCustomerId')
        .populate('plan', 'name monthlyPrice yearlyPrice')
        .sort({ lastPaymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      
      // Get ALL actual subscription payments (not limited by subscription query)
      SubscriptionPayment.find({
        ...(organizationIds.length > 0 && { organization: { $in: organizationIds } })
      })
        .populate('organization', 'name email')
        .populate({
          path: 'subscription',
          populate: {
            path: 'plan',
            select: 'name monthlyPrice yearlyPrice'
          }
        })
        .sort({ createdAt: -1 })
        .skip(0) // Don't skip for subscription payments
        .limit(100) // Get more subscription payments
    ]);

    const totalSubscriptions = await Subscription.countDocuments(subscriptionQuery);

    // Get Stripe invoices for more detailed payment information
    let stripeInvoices = [];
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // Get all Stripe subscription IDs
        const stripeSubIds = subscriptions
          .filter(sub => sub.stripeSubscriptionId)
          .map(sub => sub.stripeSubscriptionId);

        if (stripeSubIds.length > 0) {
          // Fetch invoices for these subscriptions
          const invoicePromises = stripeSubIds.map(async (subId) => {
            try {
              const invoices = await stripe.invoices.list({
                subscription: subId,
                limit: 5 // Get last 5 invoices per subscription
              });
              return invoices.data;
            } catch (error) {
              console.error(`Error fetching invoices for subscription ${subId}:`, error);
              return [];
            }
          });

          const invoiceArrays = await Promise.all(invoicePromises);
          stripeInvoices = invoiceArrays.flat();
        }
      } catch (error) {
        console.error('Error fetching Stripe invoices:', error);
      }
    }

    // Transform subscriptions and subscription payments into payment records
    const payments = [];
    
    // Add actual subscription payments first
    subscriptionPayments.forEach(payment => {
      payments.push({
        _id: payment._id,
        amount: payment.amount,
        currency: payment.currency || 'USD',
        status: payment.status === 'completed' ? 'completed' : payment.status,
        method: payment.paymentMethod,
        subscriber: {
          name: payment.organization?.name || 'Unknown Organization',
          email: payment.organization?.email || 'unknown@example.com'
        },
        plan: {
          name: payment.subscription?.plan?.name || 'Unknown Plan'
        },
        createdAt: payment.createdAt,
        subscriptionId: payment.subscription?._id,
        billingCycle: payment.billingCycle,
        transactionId: payment.transactionId,
        notes: payment.notes || `${payment.billingCycle} subscription payment`,
        type: 'subscription_payment'
      });
    });
    
    // Add Stripe subscription payments for subscriptions without manual payments
    for (const subscription of subscriptions) {
      // Find Stripe invoices for this subscription
      const subscriptionInvoices = stripeInvoices.filter(inv => 
        inv.subscription === subscription.stripeSubscriptionId
      );

      if (subscriptionInvoices.length > 0) {
        // Create payment records from Stripe invoices
        subscriptionInvoices.forEach(invoice => {
          if (invoice.status === 'paid') {
            payments.push({
              _id: invoice.id,
              amount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency.toUpperCase(),
              status: 'completed',
              method: 'stripe',
              subscriber: {
                name: subscription.organization?.name || 'Unknown Organization',
                email: subscription.organization?.email || 'unknown@example.com'
              },
              plan: {
                name: subscription.plan?.name || 'Unknown Plan'
              },
              createdAt: new Date(invoice.created * 1000),
              stripePaymentId: invoice.payment_intent,
              stripeInvoiceId: invoice.id,
              subscriptionId: subscription._id,
              billingCycle: subscription.billingCycle,
              notes: `Stripe invoice ${invoice.number}`,
              type: 'stripe_payment'
            });
          }
        });
      }
    }

    // Sort payments by date (newest first)
    payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate statistics
    const stats = await calculatePaymentStats();

    return NextResponse.json({
      success: true,
      payments: payments.slice(0, limit), // Apply limit to final results
      pagination: {
        page,
        limit,
        total: payments.length,
        pages: Math.ceil(payments.length / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching super admin payments:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to calculate payment statistics
async function calculatePaymentStats() {
  try {
    // Get subscription payments from SubscriptionPayment collection
    const subscriptionPayments = await SubscriptionPayment.find({
      status: 'completed'
    });

    // Get subscriptions that have made payments
    const allSubscriptions = await Subscription.find({
      $or: [
        { lastPaymentDate: { $exists: true, $ne: null } }, // Has made at least one payment
        { status: 'active', paymentMethod: 'stripe' }, // Active Stripe subscriptions (paid)
        { status: 'cancelled', lastPaymentDate: { $exists: true } } // Cancelled but had payments
      ]
    }).populate('plan', 'monthlyPrice yearlyPrice');

    // Calculate total revenue from actual payments
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let totalPayments = 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Add subscription payments from SubscriptionPayment collection
    subscriptionPayments.forEach(payment => {
      totalRevenue += payment.amount;
      totalPayments += 1;

      // Check if payment was this month
      const paymentDate = payment.createdAt;
      if (paymentDate && 
          paymentDate.getMonth() === currentMonth && 
          paymentDate.getFullYear() === currentYear) {
        monthlyRevenue += payment.amount;
      }
    });

    // Add legacy subscription payments from Subscription collection (for existing data)
    for (const subscription of allSubscriptions) {
      // Only count subscriptions that have actually made payments and don't have corresponding SubscriptionPayment records
      if (subscription.lastPaymentDate && subscription.lastPaymentDate !== null) {
        // Check if this subscription already has a payment in SubscriptionPayment collection
        const hasSubscriptionPayment = subscriptionPayments.some(sp => 
          sp.subscription && sp.subscription.toString() === subscription._id.toString()
        );

        if (!hasSubscriptionPayment) {
          totalRevenue += subscription.amount || 0;
          totalPayments += 1;

          // Check if payment was this month
          const paymentDate = subscription.lastPaymentDate;
          if (paymentDate && 
              paymentDate.getMonth() === currentMonth && 
              paymentDate.getFullYear() === currentYear) {
            monthlyRevenue += subscription.amount || 0;
          }
        }
      }
    }

    // Calculate average payment
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalPayments,
      averagePayment: Math.round(averagePayment * 100) / 100
    };

  } catch (error) {
    console.error('Error calculating payment stats:', error);
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalPayments: 0,
      averagePayment: 0
    };
  }
}

// Helper function to get payment status from subscription status
function getPaymentStatus(subscriptionStatus) {
  switch (subscriptionStatus) {
    case 'active':
      return 'completed';
    case 'trialing':
      return 'completed'; // Trial is considered successful
    case 'past_due':
      return 'pending';
    case 'cancelled':
      return 'completed'; // Past payments were successful
    case 'inactive':
      return 'failed';
    default:
      return 'pending';
  }
} 