import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import LabResultModel from '@/models/LabResult';
import PatientModel from '@/models/Patient';
import ActivityModel from '@/models/Activity';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lab result ID' }, { status: 400 });
    }
    
    // Get the lab result - ensure it belongs to this doctor
    const labResult = await LabResultModel.findOne({
      _id: id,
      orderedBy: new mongoose.Types.ObjectId(session.user.id)
    })
    .populate('patient', 'name patientId age')
    .populate('orderedBy', 'name')
    .lean();
    
    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    
    return NextResponse.json({ labResult });
  } catch (error) {
    console.error('Error getting lab result:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    const data = await request.json();
    
    // Get the lab result to check if it exists
    const labResult = await LabResultModel.findById(id);
    
    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    
    // Update lab result
    const updatedLabResult = await LabResultModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } // Return the updated document
    );
    
    // Get patient info for activity log
    const patient = await PatientModel.findById(labResult.patient);
    
    // Log activity for completed lab results
    if (data.status === 'Completed' && labResult.status !== 'Completed') {
      await ActivityModel.create({
        title: 'Lab results available',
        description: `${patient.name} - ${labResult.testName} (${labResult.category})`,
        user: session.user.id,
        patient: labResult.patient,
        type: 'lab',
        alert: true, // Alert provider about lab results
        relatedTo: {
          model: 'LabResult',
          id: labResult._id
        }
      });
    }
    
    return NextResponse.json({ labResult: updatedLabResult });
  } catch (error) {
    console.error('Error updating lab result:', error);
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
    
    const { id } = params;
    
    // Get the lab result to check if it exists and get patient info
    const labResult = await LabResultModel.findById(id);
    
    if (!labResult) {
      return NextResponse.json({ error: 'Lab result not found' }, { status: 404 });
    }
    
    // Get patient info for activity log
    const patient = await PatientModel.findById(labResult.patient);
    
    // Delete the lab result
    await LabResultModel.findByIdAndDelete(id);
    
    // Log activity for deleted lab
    await ActivityModel.create({
      title: 'Lab order deleted',
      description: `${patient?.name || 'Unknown patient'} - ${labResult.testName} (${labResult.category})`,
      user: session.user.id,
      patient: labResult.patient,
      type: 'lab',
      alert: false,
      relatedTo: {
        model: 'LabResult',
        id: labResult._id
      }
    });
    
    return NextResponse.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab result:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 