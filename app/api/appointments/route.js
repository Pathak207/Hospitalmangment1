import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import AppointmentModel from '@/models/Appointment';
import PatientModel from '@/models/Patient';
import ActivityModel from '@/models/Activity';
import mongoose from 'mongoose';
import Payment from '@/models/Payment';
import { validateSubscriptionLimit, updateSubscriptionUsage } from '@/lib/subscription-utils';
import UserModel from '@/models/User';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || null;
    const date = searchParams.get('date') || null;
    const patient = searchParams.get('patient') || null;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build query with search and filters
    let query = {
      doctor: session.user.id
    };
    
    // Add patient filter if provided
    if (patient) {
      query.patient = new mongoose.Types.ObjectId(patient);
    }
    
    // Add date filter if provided
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      query.date = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // If search term is provided, join with Patient to search by patient name
    let appointments = [];
    let total = 0;
    
    if (search) {
      // Find patients matching search term
      const patients = await PatientModel.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const patientIds = patients.map(p => p._id);
      
      // Add patient ids to query
      query.patient = { $in: patientIds };
    }
    
    // Get appointments with pagination and populate patient
    appointments = await AppointmentModel.find(query)
      .populate('patient', 'name patientId age gender vitals')
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    total = await AppointmentModel.countDocuments(query);
    
    // Get all appointment IDs to check for payments
    const appointmentIds = appointments.map(apt => apt._id);
    
    // Find all payments for these appointments
    const payments = await Payment.find({
      appointment: { $in: appointmentIds }
    }).select('appointment amount paymentDate paymentMethod');
    
    // Create a map of appointment ID to payment info
    const paymentMap = new Map();
    payments.forEach(payment => {
      if (payment.appointment) {
        paymentMap.set(payment.appointment.toString(), {
          paid: true,
          paymentAmount: payment.amount,
          paymentDate: payment.paymentDate || payment.createdAt,
          paymentMethod: payment.paymentMethod
        });
      }
    });
    
    // Add payment status to each appointment
    const appointmentsWithPaymentStatus = appointments.map(appointment => {
      const appointmentObj = appointment.toObject();
      const paymentInfo = paymentMap.get(appointment._id.toString());
      
      if (paymentInfo) {
        // Appointment has payment
        appointmentObj.paid = true;
        appointmentObj.paymentAmount = paymentInfo.paymentAmount;
        appointmentObj.paymentDate = paymentInfo.paymentDate;
        appointmentObj.paymentMethod = paymentInfo.paymentMethod;
      } else {
        // No payment found
        appointmentObj.paid = false;
        appointmentObj.paymentAmount = null;
        appointmentObj.paymentDate = null;
        appointmentObj.paymentMethod = null;
      }
      
      return appointmentObj;
    });
    
    return NextResponse.json({
      appointments: appointmentsWithPaymentStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get user's organization
    const user = await UserModel.findById(session.user.id);
    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    // Check subscription limits before creating appointment
    try {
      await validateSubscriptionLimit(user.organization, 'appointment', 'create');
    } catch (limitError) {
      return NextResponse.json({ 
        error: limitError.message,
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        type: 'appointment_limit'
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.patient || !data.date || !data.time || !data.type || !data.reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if patient exists
    const patient = await PatientModel.findById(data.patient);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    
    // Create new appointment
    const appointment = await AppointmentModel.create({
      ...data,
      doctor: session.user.id,
      organization: user.organization, // Add organization field
      status: data.status || 'Pending'
    });
    
    // Update subscription usage counters
    try {
      await updateSubscriptionUsage(user.organization);
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    // Create activity
    await ActivityModel.create({
      title: 'Appointment created',
      description: `${patient.name} - ${data.type} - ${data.time}`,
      user: session.user.id,
      patient: patient._id,
      organization: user.organization, // Add organization field
      type: 'appointment',
      alert: false,
      relatedTo: {
        model: 'Appointment',
        id: appointment._id
      }
    });
    
    return NextResponse.json(appointment, { status: 201 });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 