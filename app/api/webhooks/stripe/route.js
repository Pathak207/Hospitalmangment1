import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/dbConnect';
import Subscription from '@/models/Subscription';
import Organization from '@/models/Organization';
import { stripeUtils } from '@/lib/stripe';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('No webhook secret configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const result = stripeUtils.verifyWebhookSignature(body, signature, webhookSecret);
    if (!result.success) {
      console.error('Webhook signature verification failed:', result.error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = result.event;
    console.log('Received Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'customer.created':
        console.log('Customer created:', event.data.object.id);
        break;

      case 'payment_method.attached':
        console.log('Payment method attached:', event.data.object.id);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Handling subscription created:', subscription.id);
    
    // Find the subscription in our database
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      // Update subscription status
      dbSubscription.status = subscription.status;
      dbSubscription.nextPaymentDate = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null;
      
      await dbSubscription.save();
      console.log('Subscription updated in database');
    } else {
      console.log('Subscription not found in database:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Handling subscription updated:', subscription.id);
    
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      // Update subscription details
      dbSubscription.status = subscription.status;
      dbSubscription.nextPaymentDate = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null;
      
      // Handle trial end
      if (subscription.trial_end && subscription.status === 'active') {
        dbSubscription.trialEndDate = new Date(subscription.trial_end * 1000);
      }

      // Handle cancellation
      if (subscription.cancel_at_period_end) {
        dbSubscription.cancelAtPeriodEnd = true;
        dbSubscription.cancelledAt = new Date();
      }

      await dbSubscription.save();
      console.log('Subscription updated in database');
    } else {
      console.log('Subscription not found in database:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Handling subscription deleted:', subscription.id);
    
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      // Update subscription status
      dbSubscription.status = 'cancelled';
      dbSubscription.cancelledAt = new Date();
      dbSubscription.autoRenew = false;
      
      await dbSubscription.save();

      // Optionally deactivate the organization
      const organization = await Organization.findById(dbSubscription.organization);
      if (organization) {
        organization.isActive = false;
        await organization.save();
        console.log('Organization deactivated due to subscription cancellation');
      }

      console.log('Subscription cancelled in database');
    } else {
      console.log('Subscription not found in database:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('Handling payment succeeded:', invoice.id);
    
    if (invoice.subscription) {
      const dbSubscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });

      if (dbSubscription) {
        // Update payment information
        dbSubscription.lastPaymentDate = new Date();
        dbSubscription.nextPaymentDate = invoice.period_end 
          ? new Date(invoice.period_end * 1000) 
          : null;
        
        // Ensure subscription is active
        if (dbSubscription.status !== 'active') {
          dbSubscription.status = 'active';
        }

        await dbSubscription.save();

        // Reactivate organization if it was deactivated
        const organization = await Organization.findById(dbSubscription.organization);
        if (organization && !organization.isActive) {
          organization.isActive = true;
          await organization.save();
          console.log('Organization reactivated due to successful payment');
        }

        console.log('Payment recorded in database');
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  try {
    console.log('Handling payment failed:', invoice.id);
    
    if (invoice.subscription) {
      const dbSubscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });

      if (dbSubscription) {
        // Update subscription status
        dbSubscription.status = 'past_due';
        await dbSubscription.save();

        // TODO: Send notification to organization about failed payment
        console.log('Subscription marked as past due');
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription) {
  try {
    console.log('Handling trial will end:', subscription.id);
    
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      // TODO: Send notification to organization about trial ending
      console.log('Trial ending notification should be sent');
    }
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
} 