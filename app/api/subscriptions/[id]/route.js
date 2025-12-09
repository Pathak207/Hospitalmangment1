import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionModel from '@/models/Subscription';
import OrganizationModel from '@/models/Organization';
import { cancelStripeSubscription, getStripeSubscription } from '@/lib/stripe';

// GET - Get subscription by ID
export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const subscription = await SubscriptionModel.findById(params.id)
      .populate('organization', 'name email')
      .populate('plan', 'name monthlyPrice yearlyPrice features');

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check permissions
    if (session.user.role !== 'super_admin' && 
        subscription.organization._id.toString() !== session.user.organization?.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      subscription,
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update subscription
export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can update subscriptions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();
    const { status, endDate, notes, paymentMethod, planId } = data;

    const subscription = await SubscriptionModel.findById(params.id);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Update subscription
    const updateData = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (endDate) updateData.endDate = new Date(endDate);
    if (notes) updateData.notes = notes;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (planId) updateData.plan = planId;

    // Handle status changes
    if (status === 'cancelled' && subscription.status !== 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = data.cancelReason || 'Cancelled by admin';
      
      // Cancel Stripe subscription if exists
      if (subscription.stripeSubscriptionId) {
        try {
          await cancelStripeSubscription(subscription.stripeSubscriptionId, true);
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError);
        }
      }
    }

    const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('organization', 'name email')
     .populate('plan', 'name monthlyPrice yearlyPrice');

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: updatedSubscription,
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Cancel subscription
export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can delete subscriptions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const subscription = await SubscriptionModel.findById(params.id);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId) {
      try {
        await cancelStripeSubscription(subscription.stripeSubscriptionId, false);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
      }
    }

    // Update subscription status instead of deleting
    await SubscriptionModel.findByIdAndUpdate(params.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Cancelled by admin',
      updatedAt: new Date(),
    });

    // Remove subscription reference from organization
    await OrganizationModel.findByIdAndUpdate(subscription.organization, {
      $unset: { subscription: 1 },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 