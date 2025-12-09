import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import PatientModel from '@/models/Patient';
import { validateSubscriptionLimit, updateSubscriptionUsage } from '@/lib/subscription-utils';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin can see all patients, regular users only their organization's patients
    if (session.user.role !== 'super_admin' && !session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build base query with organization filter
    const baseQuery = session.user.role === 'super_admin' 
      ? {} 
      : { organization: session.user.organization };
    
    // Build query with search
    const query = search 
      ? {
          ...baseQuery,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { patientId: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { contactNumber: { $regex: search, $options: 'i' } }
          ]
        } 
      : baseQuery;
    
    // Get patients with pagination and search
    const patients = await PatientModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await PatientModel.countDocuments(query);
    
    return NextResponse.json({
      patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in patients API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization users can create patients (not super admin)
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot create patients directly' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Check subscription limits before creating patient
    try {
      await validateSubscriptionLimit(session.user.organization, 'patient', 'create');
    } catch (limitError) {
      return NextResponse.json({ 
        error: limitError.message,
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        type: 'patient_limit'
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Add organization to patient data
    data.organization = session.user.organization;
    
    // Generate a patient ID if not provided (organization-specific)
    if (!data.patientId) {
      const count = await PatientModel.countDocuments({ organization: session.user.organization });
      data.patientId = `PAT-${session.user.organization.toString().slice(-4)}-${(1000 + count + 1).toString()}`;
    }
    
    // Create new patient
    const patient = await PatientModel.create(data);
    
    // Update subscription usage counters
    try {
      await updateSubscriptionUsage(session.user.organization);
    } catch (usageError) {
      console.warn('Failed to update subscription usage:', usageError.message);
    }
    
    return NextResponse.json(patient, { status: 201 });
    
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 