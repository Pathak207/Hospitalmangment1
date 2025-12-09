import { NextResponse } from 'next/server';
import { getGlobalCurrency } from '@/lib/server-currency-utils';

// GET - Get global currency setting
export async function GET() {
  try {
    const currency = await getGlobalCurrency();
    
    return NextResponse.json({ 
      success: true,
      currency: currency 
    });
  } catch (error) {
    console.error('Error fetching global currency:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch global currency',
        currency: 'USD' // fallback
      },
      { status: 500 }
    );
  }
}
