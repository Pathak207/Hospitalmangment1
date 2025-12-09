import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAuthSession } from '@/lib/auth';
import LabResultModel from '@/models/LabResult';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Test database connection and model
    const count = await LabResultModel.countDocuments();
    const orgCount = await LabResultModel.countDocuments({ organization: session.user.organization });
    
    return NextResponse.json({ 
      message: 'API working',
      totalLabs: count,
      orgLabs: orgCount,
      userOrganization: session.user.organization,
      user: session.user.name
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 