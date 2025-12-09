import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Organization from '@/models/Organization';

export async function GET(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access organization-specific practice settings
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access organization practice settings' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    await dbConnect();

    // Get organization settings
    const organization = await Organization.findById(session.user.organization);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Extract practice settings from organization
    const practiceSettings = {
      practiceName: organization.name,
      taxId: organization.taxId || 'XX-XXXXXXX',
      siteTitle: organization.branding?.appName || 'DoctorCare Portal',
      dateFormat: organization.dateFormat || 'MM/DD/YYYY',
      currency: organization.currency || 'USD',
      phone: organization.phone || '(555) 123-4567',
      email: organization.email,
      address: organization.address || {},
      timezone: organization.timezone || 'UTC',
      website: organization.website || ''
    };

    return NextResponse.json(practiceSettings);

  } catch (error) {
    console.error('Error fetching practice settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access organization-specific practice settings
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access organization practice settings' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      practiceName,
      taxId,
      siteTitle,
      dateFormat,
      currency,
      phone,
      email,
      address,
      timezone,
      website
    } = body;

    // Validate required fields
    if (!practiceName || !email) {
      return NextResponse.json(
        { error: 'Practice name and email are required' },
        { status: 400 }
      );
    }

    // Update organization with practice settings
    const organization = await Organization.findById(session.user.organization);
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization fields
    organization.name = practiceName;
    organization.taxId = taxId;
    organization.dateFormat = dateFormat;
    organization.currency = currency;
    organization.phone = phone;
    organization.email = email;
    organization.timezone = timezone;
    organization.website = website;
    
    if (address) {
      organization.address = {
        ...organization.address,
        ...address
      };
    }

    // Update branding app name if siteTitle is provided
    if (siteTitle) {
      organization.branding = {
        ...organization.branding,
        appName: siteTitle
      };
    }

    await organization.save();

    // Return updated practice settings
    const updatedSettings = {
      practiceName: organization.name,
      taxId: organization.taxId || 'XX-XXXXXXX',
      siteTitle: organization.branding?.appName || 'DoctorCare Portal',
      dateFormat: organization.dateFormat || 'MM/DD/YYYY',
      currency: organization.currency || 'USD',
      phone: organization.phone || '(555) 123-4567',
      email: organization.email,
      address: organization.address || {},
      timezone: organization.timezone || 'UTC',
      website: organization.website || ''
    };

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Error updating practice settings:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 