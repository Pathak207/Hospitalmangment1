import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import { getAuthSession } from '@/lib/auth';
import { validateFeatureAccess } from '@/lib/subscription-utils';
import UserModel from '@/models/User';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to advanced reports feature
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }

      try {
        const hasAccess = await validateFeatureAccess(session.user.organization, 'advancedReports');
        if (!hasAccess) {
          return NextResponse.json({ 
            error: 'Advanced reports feature not available in your subscription plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'advancedReports'
          }, { status: 403 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: error.message,
          code: 'SUBSCRIPTION_CHECK_FAILED'
        }, { status: 403 });
      }
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange');
    const searchQuery = searchParams.get('search');
    
    // Build query object with organization filter for data isolation
    let query = {};
    
    // Add organization filter (critical for data isolation)
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      query.organization = session.user.organization;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (dateRange) {
      // Handle date range filtering
      const now = new Date();
      if (dateRange === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query.date = { $gte: startOfMonth, $lte: now };
      } else if (dateRange === 'last-month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        query.date = { $gte: startOfLastMonth, $lte: endOfLastMonth };
      } else if (dateRange === 'this-quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        query.date = { $gte: startOfQuarter, $lte: now };
      } else if (dateRange === 'this-year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        query.date = { $gte: startOfYear, $lte: now };
      }
    }
    
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { reportId: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Execute query
    const reports = await Report.find(query).sort({ date: -1 });
    
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to advanced reports feature
    if (session.user.role !== 'super_admin') {
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }

      try {
        const hasAccess = await validateFeatureAccess(session.user.organization, 'advancedReports');
        if (!hasAccess) {
          return NextResponse.json({ 
            error: 'Advanced reports feature not available in your subscription plan',
            code: 'FEATURE_NOT_AVAILABLE',
            feature: 'advancedReports'
          }, { status: 403 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: error.message,
          code: 'SUBSCRIPTION_CHECK_FAILED'
        }, { status: 403 });
      }
    }
    
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Generate a unique report ID
    const reportCount = await Report.countDocuments();
    const reportId = `REP-${(1000 + reportCount + 1).toString()}`;
    
    // Create new report object
    const reportData = {
      ...body,
      reportId,
      date: body.date ? new Date(body.date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validate required fields
    if (!reportData.title) {
      return NextResponse.json(
        { error: 'Report title is required' },
        { status: 400 }
      );
    }
    
    if (!reportData.description) {
      return NextResponse.json(
        { error: 'Report description is required' },
        { status: 400 }
      );
    }
    
    if (!reportData.category) {
      return NextResponse.json(
        { error: 'Report category is required' },
        { status: 400 }
      );
    }
    
    if (!reportData.status) {
      // Default to "In Progress" if not provided
      reportData.status = 'In Progress';
    }
    
    // Create the new report
    const newReport = await Report.create(reportData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report created successfully',
      report: newReport 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}