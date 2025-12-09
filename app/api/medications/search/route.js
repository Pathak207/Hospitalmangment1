import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MedicationModel from '@/models/Medication';

export async function GET(request) {
  try {
    // Check authentication - temporarily disable for testing
    const session = await getAuthSession();
    
    console.log('Medication SEARCH - Session:', session);
    
    // Temporarily bypass authentication check for testing
    // if (!session) {
    //   console.log('Medication SEARCH - No session found');
    //   return NextResponse.json({ 
    //     error: 'Unauthorized - No valid session found',
    //     sessionInfo: 'No session' 
    //   }, { status: 401 });
    // }
    
    await dbConnect();
    
    // Get query parameter
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (!query || query.length < 2) {
      return NextResponse.json({ medications: [] });
    }
    
    // Search medications by name or generic name
    const medications = await MedicationModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { genericName: { $regex: query, $options: 'i' } }
      ]
    })
    .select('_id name genericName formulation strength')
    .sort({ name: 1 })
    .limit(10);
    
    return NextResponse.json({ medications });
    
  } catch (error) {
    console.error('Error searching medications:', error);
    return NextResponse.json({ error: error.message || 'Failed to search medications' }, { status: 500 });
  }
} 