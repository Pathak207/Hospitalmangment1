import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MedicationModel from '@/models/Medication';

// GET - Get a specific medication by ID
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    try {
      await dbConnect();
      console.log('Successfully connected to database in GET medication by ID');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { id } = params;
    
    // Find the medication by ID
    const medication = await MedicationModel.findById(id);
    
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }
    
    return NextResponse.json({ medication });
    
  } catch (error) {
    console.error('Error getting medication:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get medication',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Update an existing medication
export async function PUT(request, { params }) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    console.log('Medication PUT - Session:', session);
    
    if (!session) {
      console.log('Medication PUT - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - No valid session found',
        sessionInfo: 'No session' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Medication PUT - User ID:', userId);
    
    // Connect to the database
    try {
      await dbConnect();
      console.log('Successfully connected to database in PUT medication');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { id } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.formulation || !data.strength) {
      return NextResponse.json({ error: 'Name, formulation, and strength are required' }, { status: 400 });
    }
    
    // Find the medication to update
    const medication = await MedicationModel.findById(id);
    
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }
    
    // Update medication
    const updatedMedication = await MedicationModel.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedBy: userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ 
      message: 'Medication updated successfully',
      medication: updatedMedication
    });
    
  } catch (error) {
    console.error('Error updating medication:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update medication',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete a medication
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    console.log('Medication DELETE - Session:', session);
    
    if (!session) {
      console.log('Medication DELETE - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - No valid session found',
        sessionInfo: 'No session' 
      }, { status: 401 });
    }
    
    // Connect to the database
    try {
      await dbConnect();
      console.log('Successfully connected to database in DELETE medication');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const { id } = params;
    
    // Find the medication to delete
    const medication = await MedicationModel.findById(id);
    
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }
    
    // Check if medication is in use in prescriptions
    // This would require additional logic if you need to prevent deleting medications in use
    // For now, we'll just delete it
    
    // Delete the medication
    await MedicationModel.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      message: 'Medication deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting medication:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete medication',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 