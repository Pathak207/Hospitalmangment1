import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import AppointmentType from '@/models/AppointmentType';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get all active appointment types for the current organization
    const appointmentTypes = await AppointmentType.find({
      organization: session.user.organization,
      isActive: true
    }).sort({ sortOrder: 1, name: 1 });
    
    return NextResponse.json(appointmentTypes);
    
  } catch (error) {
    console.error('Error fetching appointment types:', error);
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
    if (!data.name || !data.duration || !data.color) {
      return NextResponse.json(
        { error: 'Name, duration, and color are required' },
        { status: 400 }
      );
    }
    
    // Create new appointment type
    const appointmentType = await AppointmentType.create({
      ...data,
      organization: session.user.organization, // Add organization field
      createdBy: session.user.id,
    });
    
    return NextResponse.json(appointmentType, { status: 201 });
    
  } catch (error) {
    console.error('Error creating appointment type:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 