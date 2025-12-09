import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import PrescriptionModel from '@/models/Prescription';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build aggregation pipeline
    const pipeline = [];
    
    // Add organization filter first (CRITICAL for data isolation)
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      const { ObjectId } = require('mongodb');
      pipeline.push({
        $match: { organization: new ObjectId(session.user.organization) }
      });
    }
    
    // Add patient filter if provided (after organization filter)
    if (patientId) {
      const { ObjectId } = require('mongodb');
      pipeline.push({
        $match: { patient: new ObjectId(patientId) }
      });
    }
    
    // Join with patients collection
    pipeline.push(
      {
        $lookup: {
          from: 'patients',
          localField: 'patient',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $unwind: '$patient'
      }
    );
    
    // Build match conditions for other filters
    const matchConditions = {};
    
    if (status && status !== 'all') {
      matchConditions.status = status;
    }
    
    // Add search functionality if provided
    if (search) {
      matchConditions.$or = [
        { 'medications.name': { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { prescriptionId: { $regex: search, $options: 'i' } },
        { 'patient.name': { $regex: search, $options: 'i' } },
        { 'patient.patientId': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add match stage if there are other conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
    
    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });
    
    // Create pipeline for total count (without pagination)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    
    // Add pagination to main pipeline
    pipeline.push({ $skip: skip }, { $limit: limit });
    
    // Execute both pipelines
    const [prescriptions, countResult] = await Promise.all([
      PrescriptionModel.aggregate(pipeline),
      PrescriptionModel.aggregate(countPipeline)
    ]);
    
    // Get total count
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({ 
      prescriptions,
      pagination: {
        total,
        totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error getting prescriptions:', error);
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
    if (!data.patient || !data.medications || !Array.isArray(data.medications) || data.medications.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate each medication
    for (const med of data.medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        return NextResponse.json(
          { error: 'Missing required medication fields' },
          { status: 400 }
        );
      }
    }
    
    // Set prescriptionDate to today if not provided
    if (!data.prescriptionDate) {
      data.prescriptionDate = new Date().toISOString();
    }
    
    // Set status to Active if not provided
    if (!data.status) {
      data.status = 'Active';
    }

    // Generate prescription ID if not provided
    if (!data.prescriptionId) {
      const count = await PrescriptionModel.countDocuments();
      data.prescriptionId = `RX-${(10000 + count + 1).toString()}`;
    }
    
    // Get user's organization
    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }
    
    // Create new prescription
    const prescription = await PrescriptionModel.create({
      ...data,
      doctor: session.user.id,
      organization: session.user.organization, // Add organization field
      createdAt: new Date()
    });
    
    // Get patient name for activity
    const patient = await PatientModel.findById(data.patient);
    
    // Create activity record
    await ActivityModel.create({
      title: 'Prescription created',
      description: `${patient.name} - ${data.medications.length} medication(s)`,
      user: session.user.id,
      patient: data.patient,
      organization: session.user.organization, // Add organization field
      type: 'prescription',
      alert: false,
      relatedTo: {
        model: 'Prescription',
        id: prescription._id
      }
    });
    
    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 