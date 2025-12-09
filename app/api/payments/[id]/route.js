import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Appointment from '@/models/Appointment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get a specific payment by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    
    // Find the payment by transactionId or _id
    let payment;
    if (id.startsWith('PMT-')) {
      // If it's a transaction ID format, search by transactionId
      payment = await Payment.findOne({ transactionId: id })
        .populate('patient', 'name patientId')
        .populate('appointment');
    } else {
      // Otherwise, search by _id
      payment = await Payment.findById(id)
        .populate('patient', 'name patientId')
        .populate('appointment');
    }
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ payment });
    
  } catch (error) {
    console.error('Error getting payment:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get payment',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Update a payment
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { id } = await params;
    const data = await request.json();
    
    // Find and update the payment by transactionId or _id
    let payment;
    if (id.startsWith('PMT-')) {
      // If it's a transaction ID format, search by transactionId
      payment = await Payment.findOneAndUpdate(
        { transactionId: id },
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('patient', 'name patientId')
       .populate('appointment');
    } else {
      // Otherwise, search by _id
      payment = await Payment.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('patient', 'name patientId')
       .populate('appointment');
    }
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Payment updated successfully',
      payment 
    });
    
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update payment',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete a payment
export async function DELETE(request, { params }) {
  try {
    console.log('🗑️ DELETE Payment Route - Starting...');
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ Database connected');
    
    const { id } = await params;
    console.log('🔍 Payment ID received:', id);
    
    // Try to find the payment using multiple strategies
    let payment;
    
    // Strategy 1: If it looks like a transaction ID (PMT- format), search by transactionId
    if (id.startsWith('PMT-')) {
      console.log('🔍 Searching by transactionId (PMT format):', id);
      payment = await Payment.findOne({ transactionId: id }).populate('appointment');
    }
    
    // Strategy 2: If not found and it's a valid MongoDB ObjectId, search by _id
    if (!payment && mongoose.Types.ObjectId.isValid(id)) {
      console.log('🔍 Searching by MongoDB _id:', id);
      try {
        payment = await Payment.findById(id).populate('appointment');
      } catch (mongoError) {
        console.error('❌ Error searching by MongoDB _id:', mongoError);
      }
    }
    
    // Strategy 3: If still not found, search by transactionId field (for any custom format)
    if (!payment) {
      console.log('🔍 Searching by any transactionId value:', id);
      payment = await Payment.findOne({ transactionId: id }).populate('appointment');
    }
    
    // Strategy 4: Last resort - search by any field that might contain this ID
    if (!payment) {
      console.log('🔍 Last resort - searching across multiple fields:', id);
      payment = await Payment.findOne({
        $or: [
          { transactionId: id },
          { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
          { 'patient.patientId': id } // In case it's somehow a patient ID
        ].filter(Boolean) // Remove null values
      }).populate('appointment');
    }
    
    if (!payment) {
      console.log('❌ Payment not found with ID:', id);
      return NextResponse.json({ 
        error: 'Payment not found',
        searchedId: id,
        message: 'Payment could not be found with the provided ID. It may have already been deleted.'
      }, { status: 404 });
    }
    
    console.log('✅ Payment found:', {
      _id: payment._id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      patient: payment.patient
    });
    
    // Delete the payment using the actual _id
    const deletedPayment = await Payment.findByIdAndDelete(payment._id);
    
    if (!deletedPayment) {
      console.error('❌ Failed to delete payment - findByIdAndDelete returned null');
      return NextResponse.json({ 
        error: 'Failed to delete payment from database',
        paymentId: payment._id 
      }, { status: 500 });
    }
    
    console.log('✅ Payment deleted successfully:', {
      id: deletedPayment._id,
      transactionId: deletedPayment.transactionId,
      amount: deletedPayment.amount,
      paymentMethod: deletedPayment.paymentMethod
    });
    
    return NextResponse.json({ 
      message: 'Payment deleted successfully',
      deletedPayment: {
        _id: deletedPayment._id,
        transactionId: deletedPayment.transactionId,
        amount: deletedPayment.amount,
        paymentMethod: deletedPayment.paymentMethod
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete payment',
      details: error.stack ? error.stack.split('\n')[0] : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 