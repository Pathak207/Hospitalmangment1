import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import AppointmentModel from '@/models/Appointment';
import ActivityModel from '@/models/Activity';
import { updateSubscriptionUsage } from '@/lib/subscription-utils';
import UserModel from '@/models/User';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    
    // Get appointment by ID with patient details
    const appointment = await AppointmentModel.findById(id)
      .populate('patient')
      .populate('doctor', 'name');
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Get related activities
    const activities = await ActivityModel.find({
      'relatedTo.model': 'Appointment',
      'relatedTo.id': appointment._id
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ appointment, activities });
    
  } catch (error) {
    console.error('Error getting appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    const data = await request.json();
    
    console.log('🔄 APPOINTMENT UPDATE - ID:', id);
    console.log('🔄 APPOINTMENT UPDATE - Data:', JSON.stringify(data, null, 2));
    
    // Find the appointment first to get the original data
    const originalAppointment = await AppointmentModel.findById(id)
      .populate('patient', 'name');
    
    if (!originalAppointment) {
      console.log('❌ Appointment not found with ID:', id);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    console.log('🔍 Original appointment found:', {
      id: originalAppointment._id,
      patient: originalAppointment.patient?.name,
      paid: originalAppointment.paid
    });
    
    // Update appointment
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Appointment updated successfully:', {
      id: updatedAppointment._id,
      paid: updatedAppointment.paid,
      paymentDate: updatedAppointment.paymentDate
    });
    
    // Create activity if status changed
    if (data.status && data.status !== originalAppointment.status) {
      let activityTitle;
      
      switch (data.status) {
        case 'Confirmed':
          activityTitle = 'Appointment confirmed';
          break;
        case 'Completed':
          activityTitle = 'Appointment completed';
          break;
        case 'Cancelled':
          activityTitle = 'Appointment cancelled';
          break;
        case 'No-show':
          activityTitle = 'Patient no-show';
          break;
        default:
          activityTitle = 'Appointment updated';
      }
      
      await ActivityModel.create({
        title: activityTitle,
        description: `${originalAppointment.patient.name} - ${originalAppointment.type} - ${originalAppointment.time}`,
        user: session.user.id,
        patient: originalAppointment.patient._id,
        type: 'appointment',
        alert: false,
        relatedTo: {
          model: 'Appointment',
          id: originalAppointment._id
        }
      });
    }
    
    return NextResponse.json(updatedAppointment);
    
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    
    // Find the appointment first to get patient info
    const appointment = await AppointmentModel.findById(id)
      .populate('patient', 'name');
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Delete appointment
    await AppointmentModel.findByIdAndDelete(id);
    
    // Create activity
    await ActivityModel.create({
      title: 'Appointment deleted',
      description: `${appointment.patient.name} - ${appointment.type} - ${appointment.time}`,
      user: session.user.id,
      patient: appointment.patient._id,
      type: 'appointment',
      alert: false
    });
    
    // Delete related activities
    await ActivityModel.deleteMany({
      'relatedTo.model': 'Appointment',
      'relatedTo.id': appointment._id
    });
    
    // Update subscription usage counters
    try {
      const user = await UserModel.findById(session.user.id);
      if (user?.organization) {
        await updateSubscriptionUsage(user.organization);
      }
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    return NextResponse.json({ message: 'Appointment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 