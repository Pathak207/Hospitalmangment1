import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import AppointmentType from '@/models/AppointmentType';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to get unpaid appointments
async function getUnpaidAppointments(search = '') {
  try {
    await dbConnect();
    
    // Get appointments that don't have an associated payment
    const appointmentsQuery = {
      status: { $in: ['Completed', 'Confirmed'] },
    };
    
    // If search term provided, find related patients first
    let patientIds = [];
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const patients = await Patient.find({
        $or: [
          { name: searchRegex },
          { patientId: searchRegex }
        ]
      }).select('_id');
      
      patientIds = patients.map(p => p._id);
      
      // If no patients found by search but search is provided, 
      // we'll still try to match on type directly in the appointment
    }
    
    // Prepare query with patient filter if patients found by search
    const appointments = await Appointment.find({
      ...appointmentsQuery,
      ...(patientIds.length > 0 ? { patient: { $in: patientIds } } : {})
    }).populate('patient', 'name patientId');

    // Get appointment types for pricing
    const appointmentTypes = await AppointmentType.find({});
    
    // Check which appointments don't have payments
    const appointmentIds = appointments.map(apt => apt._id);
    const payments = await Payment.find({
      appointment: { $in: appointmentIds }
    });
    
    const paidAppointmentIds = new Set(payments.map(payment => String(payment.appointment)));
    
    // Filter to get only unpaid appointments
    let unpaidAppointments = appointments.filter(apt => !paidAppointmentIds.has(String(apt._id)));
    
    // Apply search term filter on appointment type if patientIds was empty
    if (search && patientIds.length === 0) {
      const searchRegex = new RegExp(search, 'i');
      unpaidAppointments = unpaidAppointments.filter(apt => 
        searchRegex.test(apt.type) || 
        (apt.patient?.name && searchRegex.test(apt.patient.name)) ||
        (apt.patient?.patientId && searchRegex.test(apt.patient.patientId))
      );
    }
    
    // Format for the frontend
    return unpaidAppointments.map(apt => ({
      id: apt._id,
      appointmentId: `APT-${apt._id.toString().slice(-4).toUpperCase()}`,
      patientName: apt.patient?.name || 'Unknown Patient',
      patientId: apt.patient?.patientId || 'Unknown ID',
      date: apt.date ? new Date(apt.date).toISOString().split('T')[0] : 'N/A',
      type: apt.type || 'Unknown Type',
      amount: getAppointmentFee(apt.type, appointmentTypes),
      provider: apt.doctor || 'Doctor' // Default provider - in a real app, get this from the appointment's doctor field
    }));
  } catch (error) {
    console.error('Error fetching unpaid appointments:', error);
    return [];
  }
}

// Helper function to determine fee based on appointment type
function getAppointmentFee(type, appointmentTypes = []) {
  const appointmentType = appointmentTypes.find(at => at.name === type);
  if (appointmentType && appointmentType.price) {
    return appointmentType.price;
  }
  
  // Fallback to hardcoded values if appointment type not found
  switch(type) {
    case 'Annual physical':
      return 200.00;
    case 'Consultation':
      return 150.00;
    case 'Specialty':
      return 180.00;
    case 'Emergency':
      return 250.00;
    case 'Follow-up':
    default:
      return 100.00;
  }
}

// GET - Fetch all payments or unpaid appointments
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search') || '';
    
    // Return unpaid appointments
    if (filter === 'unpaid') {
      const unpaidAppointments = await getUnpaidAppointments(search);
      return NextResponse.json({ unpaidAppointments });
    }
    
    // Return all payments (with organization filter for data isolation)
    let paymentQuery = {};
    
    // Super admin can see all payments, regular users only their organization's payments
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      paymentQuery.organization = session.user.organization;
    }
    
    const payments = await Payment.find(paymentQuery)
      .sort({ createdAt: -1 })
      .populate('patient', 'name patientId')
      .populate('appointment');
      
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error in payments GET route:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Create a new payment
export async function POST(request) {
  try {
    console.log('🔍 PAYMENTS API - POST request received');
    
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', session ? 'Valid session found' : 'No session');
    
    if (!session) {
      console.log('❌ Unauthorized - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ Database connected successfully');
    
    const data = await request.json();
    console.log('📋 Raw request data received:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.patient || !data.amount || !data.paymentMethod) {
      console.log('❌ Missing required fields:', {
        patient: !!data.patient,
        amount: !!data.amount,
        paymentMethod: !!data.paymentMethod
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('✅ Required fields validation passed');
    
    // Check if patient is a patientId string (PAT-XXXX format) instead of ObjectId
    if (typeof data.patient === 'string' && data.patient.startsWith('PAT-')) {
      console.log('🔍 Patient ID is PAT format, looking up patient...');
      // Find the patient by patientId
      const patient = await Patient.findOne({ patientId: data.patient });
      if (!patient) {
        console.log('❌ Patient not found with patientId:', data.patient);
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      console.log('✅ Patient found:', { _id: patient._id, name: patient.name });
      // Replace the patientId string with the actual ObjectId
      data.patient = patient._id;
    } else {
      console.log('✅ Patient ID is already ObjectId format:', data.patient);
    }
    
    console.log('💰 Final payment data to save:', JSON.stringify(data, null, 2));
    
    // Create the payment
    const payment = new Payment(data);
    console.log('🔧 Payment object created, attempting to save...');
    
    await payment.save();
    console.log('✅ Payment saved successfully:', {
      id: payment._id,
      amount: payment.amount,
      patient: payment.patient,
      paymentMethod: payment.paymentMethod
    });
    
    // Note: Payment status for appointments is now determined dynamically 
    // by checking the Payment collection, so no need to update appointment fields
    
    console.log('🎉 Payment processing completed successfully');
    
    return NextResponse.json({ 
      message: 'Payment created successfully', 
      payment: {
        id: payment._id,
        amount: payment.amount,
        patient: payment.patient,
        appointment: payment.appointment,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('❌ Error in payments POST route:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
} 