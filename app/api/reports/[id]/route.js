import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';

// GET a single report by ID
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    // Find report by ID or reportId
    let report;
    if (id.startsWith('REP-')) {
      report = await Report.findOne({ reportId: id });
    } else {
      // Try to find by MongoDB _id
      report = await Report.findById(id);
    }
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PUT and DELETE methods removed since reports are auto-generated and should not be editable
export async function PUT(request) {
  return NextResponse.json(
    { error: 'Reports cannot be edited as they are auto-generated based on database data' },
    { status: 403 }
  );
}

export async function DELETE(request) {
  return NextResponse.json(
    { error: 'Reports cannot be deleted as they are auto-generated system records' },
    { status: 403 }
  );
} 