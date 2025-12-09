import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import SubscriptionPayment from '@/models/SubscriptionPayment';

// GET - Get subscription payments (Super Admin only)
export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can view subscription payments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query
    let query = {};
    if (search) {
      // Search by organization name or payment method
      query.$or = [
        { paymentMethod: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const subscriptionPayments = await SubscriptionPayment.find(query)
      .populate({
        path: 'organization',
        select: 'name email'
      })
      .populate({
        path: 'subscription',
        select: 'status billingCycle',
        populate: {
          path: 'plan',
          select: 'name monthlyPrice yearlyPrice'
        }
      })
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SubscriptionPayment.countDocuments(query);

    return NextResponse.json({
      success: true,
      payments: subscriptionPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching subscription payments:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 