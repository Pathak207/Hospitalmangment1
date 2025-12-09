import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import PrescriptionModel from '@/models/Prescription';
import PatientModel from '@/models/Patient';
import ActivityModel from '@/models/Activity';

export async function GET(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    // Get prescription by ID
    const prescription = await PrescriptionModel.findById(id)
      .populate('patient');
    
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    
    return NextResponse.json({ prescription });
  } catch (error) {
    console.error('Error getting prescription:', error);
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
    
    // Get the prescription to check if it exists
    const prescription = await PrescriptionModel.findById(id);
    
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    
    // Add updatedAt timestamp
    data.updatedAt = new Date();
    
    // Update prescription
    const updatedPrescription = await PrescriptionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true } // Return the updated document
    );
    
    // Get patient info for activity log
    const patient = await PatientModel.findById(prescription.patient);
    
    // Log activity for discontinuation
    if (data.status === 'Discontinued' && prescription.status !== 'Discontinued') {
      await ActivityModel.create({
        title: 'Medication discontinued',
        description: `${patient.name} - ${prescription.medication} (${prescription.dosage})`,
        user: session.user.id,
        patient: prescription.patient,
        type: 'prescription',
        alert: false,
        relatedTo: {
          model: 'Prescription',
          id: prescription._id
        }
      });
    }
    
    return NextResponse.json({ prescription: updatedPrescription });
  } catch (error) {
    console.error('Error updating prescription:', error);
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
    
    // Get the prescription to check if it exists
    const prescription = await PrescriptionModel.findById(id);
    
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    
    // Delete prescription
    await PrescriptionModel.findByIdAndDelete(id);
    
    // Delete associated activities
    await ActivityModel.deleteMany({
      'relatedTo.model': 'Prescription',
      'relatedTo.id': id
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 