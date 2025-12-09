import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import LabResultModel from '@/models/LabResult';
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
    const status = searchParams.get('status');
    
    // Build query based on user's organization
    let query = { organization: session.user.organization };
    
    // If patientId is provided, filter by patient (for patient-specific requests)
    if (patientId) {
      query.patient = patientId;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Get labs with patient information populated
    const labs = await LabResultModel.find(query)
      .sort({ createdAt: -1 })
      .populate('patient', 'name patientId email')
      .populate('orderedBy', 'name');
    
    return NextResponse.json({ labs });
  } catch (error) {
    console.error('Error getting lab results:', error);
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
    if (!data.patient || !data.testName || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user's organization
    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    // Create new lab result
    const labResult = await LabResultModel.create({
      ...data,
      orderedBy: session.user.id,
      organization: session.user.organization, // Add organization field
      orderedAt: new Date(),
      status: data.status || 'Pending'
    });
    
    // Get patient name for activity
    const patient = await PatientModel.findById(data.patient);
    
    // Create activity record
    await ActivityModel.create({
      title: 'Lab test ordered',
      description: `${patient.name} - ${data.testName} (${data.category}) - ${data.urgency || 'Routine'}`,
      user: session.user.id,
      patient: data.patient,
      organization: session.user.organization, // Add organization field
      type: 'lab',
      alert: data.urgency === 'STAT',
      relatedTo: {
        model: 'LabResult',
        id: labResult._id
      }
    });
    
    return NextResponse.json(labResult, { status: 201 });
  } catch (error) {
    console.error('Error creating lab result:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 