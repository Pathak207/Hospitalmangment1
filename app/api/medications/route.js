import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import MedicationModel from '@/models/Medication';

// GET - List or search medications with pagination and filters
export async function GET(request) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    console.log('Medication GET - Session:', session);
    
    if (!session) {
      console.log('Medication GET - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - No valid session found',
        sessionInfo: 'No session' 
      }, { status: 401 });
    }
    
    // Connect to the database
    try {
      await dbConnect();
      console.log('Successfully connected to database in GET medications');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const formulation = searchParams.get('formulation') || '';
    
    // Build query with organization filter for data isolation
    let query = {};
    
    // Add organization filter (show global medications + organization-specific medications)
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      query.$or = [
        { organization: session.user.organization }, // Organization-specific medications
        { organization: { $exists: false } }, // Global medications (no organization)
        { organization: null } // Global medications (null organization)
      ];
    }
    
    // Add search filters
    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
      
      if (query.$or) {
        // Combine organization filter with search using $and
        query = {
          $and: [
            { $or: query.$or }, // Organization filter
            { $or: searchConditions } // Search filter
          ]
        };
      } else {
        query.$or = searchConditions;
      }
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (formulation && formulation !== 'all') {
      query.formulation = formulation;
    }
    
    // Count total matching documents
    const total = await MedicationModel.countDocuments(query);
    
    // Get paginated results
    const medications = await MedicationModel.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get unique categories and formulations for filters
    const categories = await MedicationModel.distinct('category');
    const formulations = await MedicationModel.distinct('formulation');
    
    // Prepare pagination info
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      medications,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      filters: {
        categories: categories.filter(Boolean).sort(),
        formulations: formulations.filter(Boolean).sort()
      }
    });
    
  } catch (error) {
    console.error('Error in medications API:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch medications',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST - Create a new medication
export async function POST(request) {
  try {
    // Check authentication
    const session = await getAuthSession();
    
    console.log('Medication POST - Session:', session);
    
    if (!session) {
      console.log('Medication POST - No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - No valid session found',
        sessionInfo: 'No session' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Medication POST - User ID:', userId);
    
    // Connect to the database
    try {
      await dbConnect();
      console.log('Successfully connected to database in POST medication');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get medication data from request
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.formulation || !data.strength) {
      return NextResponse.json({ error: 'Name, formulation, and strength are required' }, { status: 400 });
    }
    
    // Create new medication
    const medication = new MedicationModel({
      ...data,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await medication.save();
    
    return NextResponse.json({ 
      message: 'Medication created successfully',
      medication
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating medication:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create medication',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
} 