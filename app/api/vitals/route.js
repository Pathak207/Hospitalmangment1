import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import VitalsModel from '@/models/Vitals';
import PatientModel from '@/models/Patient';
import ActivityModel from '@/models/Activity';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    
    // Get vitals for the patient
    const vitals = await VitalsModel.find({ patient: patientId })
      .sort({ recordedAt: -1 })
      .populate('recordedBy', 'name');
    
    return NextResponse.json({ vitals });
  } catch (error) {
    console.error('Error getting vitals:', error);
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
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.patient || !data.bloodPressure || !data.heartRate || !data.temperature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user's organization
    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    // Create new vitals record
    const vitals = await VitalsModel.create({
      ...data,
      recordedBy: session.user.id,
      organization: session.user.organization, // Add organization field
      recordedAt: new Date()
    });
    
    // Get patient name for activity
    const patient = await PatientModel.findById(data.patient);
    
    // Create activity record
    await ActivityModel.create({
      title: 'Vitals recorded',
      description: `${patient.name} - BP: ${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}, HR: ${data.heartRate}, Temp: ${data.temperature}`,
      user: session.user.id,
      patient: data.patient,
      organization: session.user.organization, // Add organization field
      type: 'vitals',
      alert: false,
      relatedTo: {
        model: 'Vitals',
        id: vitals._id
      }
    });
    
    // Update patient's latest vitals
    await PatientModel.findByIdAndUpdate(data.patient, {
      vitals: {
        bp: `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}`,
        hr: data.heartRate.toString(),
        temp: data.temperature.toString(),
        lastUpdated: new Date()
      }
    });
    
    return NextResponse.json(vitals, { status: 201 });
  } catch (error) {
    console.error('Error creating vitals record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 