import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import ClinicalNoteModel from '@/models/ClinicalNote';
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
    const type = searchParams.get('type');
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    
    // Build query
    const query = { 
      patient: patientId,
      $or: [
        { private: false },
        { author: session.user.id }
      ]
    };
    
    if (type) {
      query.type = type;
    }
    
    // Get notes for the patient
    const notes = await ClinicalNoteModel.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name');
    
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error getting clinical notes:', error);
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
    if (!data.patient || !data.type || !data.title || !data.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user's organization
    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    // Create new clinical note
    const note = await ClinicalNoteModel.create({
      ...data,
      author: session.user.id,
      organization: session.user.organization, // Add organization field
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get patient name for activity
    const patient = await PatientModel.findById(data.patient);
    
    // Create activity record
    await ActivityModel.create({
      title: 'Clinical note added',
      description: `${patient.name} - ${data.type}: ${data.title}`,
      user: session.user.id,
      patient: data.patient,
      organization: session.user.organization, // Add organization field
      type: 'note',
      alert: false,
      relatedTo: {
        model: 'ClinicalNote',
        id: note._id
      }
    });
    
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating clinical note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 