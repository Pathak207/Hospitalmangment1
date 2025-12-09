import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import PatientModel from '@/models/Patient';
import AppointmentModel from '@/models/Appointment';
import TaskModel from '@/models/Task';
import ActivityModel from '@/models/Activity';
import { updateSubscriptionUsage } from '@/lib/subscription-utils';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const patientId = params.id;
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    
    // Build query with organization filter
    const query = { _id: patientId };
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      query.organization = session.user.organization;
    }
    
    const patient = await PatientModel.findOne(query).lean();
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot update patients directly
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot update patients directly' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    const { id } = params;
    const data = await request.json();

    // Ensure user can only update patients from their organization
    const query = { _id: id, organization: session.user.organization };
    
    // Update patient
    const patient = await PatientModel.findOneAndUpdate(
      query,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json(patient);
    
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot delete patients directly
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot delete patients directly' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    // First, verify the patient belongs to the user's organization
    const patient = await PatientModel.findOne({ _id: id, organization: session.user.organization });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
    }
    
    // Check if patient has related appointments or tasks (within the same organization)
    const appointmentsCount = await AppointmentModel.countDocuments({ 
      patient: id, 
      organization: session.user.organization 
    });
    const tasksCount = await TaskModel.countDocuments({ 
      patient: id, 
      organization: session.user.organization 
    });
    
    if (appointmentsCount > 0 || tasksCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with related appointments or tasks' },
        { status: 400 }
      );
    }
    
    // Delete patient
    await PatientModel.findByIdAndDelete(id);
    
    // Delete related activities (within the same organization)
    await ActivityModel.deleteMany({ patient: id, organization: session.user.organization });
    
    // Update subscription usage counters
    try {
      await updateSubscriptionUsage(session.user.organization);
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    return NextResponse.json({ message: 'Patient deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 