import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import LabResultModel from '@/models/LabResult';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    
    // Build query to get labs ordered by this doctor - use proper ObjectId
    const query = { orderedBy: new mongoose.Types.ObjectId(session.user.id) };
    
    if (status) {
      if (status === 'pending') {
        query.status = { $in: ['Ordered', 'In Progress'] };
      } else {
        query.status = status;
      }
    }
    
    if (category) {
      query.category = category;
    }
    
    if (urgency) {
      query.urgency = urgency;
    }
    
    // Get all lab results for this doctor
    const labs = await LabResultModel.find(query)
      .sort({ orderedAt: -1 })
      .populate('patient', 'name patientId age')
      .populate('orderedBy', 'name')
      .lean(); // Use lean() for better performance
    
    return NextResponse.json({ labs });
  } catch (error) {
    console.error('Error getting all lab results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 