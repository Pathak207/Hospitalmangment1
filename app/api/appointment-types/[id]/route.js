import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import AppointmentType from '@/models/AppointmentType';

export async function PUT(request, { params }) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    const data = await request.json();
    
    // Find and update appointment type (only if it belongs to the current organization)
    const appointmentType = await AppointmentType.findOneAndUpdate(
      { 
        _id: id, 
        organization: session.user.organization 
      },
      { 
        ...data,
        updatedAt: new Date() 
      },
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!appointmentType) {
      return NextResponse.json({ error: 'Appointment type not found' }, { status: 404 });
    }
    
    return NextResponse.json(appointmentType);
    
  } catch (error) {
    console.error('Error updating appointment type:', error);
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
    
    // Soft delete - mark as inactive instead of actually deleting
    const appointmentType = await AppointmentType.findOneAndUpdate(
      { 
        _id: id, 
        organization: session.user.organization 
      },
      { 
        isActive: false,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (!appointmentType) {
      return NextResponse.json({ error: 'Appointment type not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Appointment type deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting appointment type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 