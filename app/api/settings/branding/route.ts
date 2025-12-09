import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BrandingSettings from '@/models/BrandingSettings';
import { getAuthSession } from '@/lib/auth';
import { validateFeatureAccess } from '@/lib/subscription-utils';

// GET /api/settings/branding - Get branding settings
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot access organization-specific branding settings
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot access organization branding settings' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    // Check if user has access to custom branding feature
    try {
      const hasAccess = await validateFeatureAccess(session.user.organization, 'customBranding');
      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Custom branding feature not available in your subscription plan',
          code: 'FEATURE_NOT_AVAILABLE',
          feature: 'customBranding'
        }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: error.message,
        code: 'SUBSCRIPTION_CHECK_FAILED'
      }, { status: 403 });
    }

    await dbConnect();
    console.log('Database connected for GET request');
    
    // Filter by organization
    const settings = await BrandingSettings.findOne({ organization: session.user.organization });
    console.log('Retrieved branding settings for organization:', session.user.organization, settings);
    
    if (!settings) {
      // Return default values if no settings exist for this organization
      return NextResponse.json({
        appName: 'DoctorCare',
        appTagline: 'Practice Management',
        logoText: 'DC',
        footerText: 'DoctorCare. All rights reserved.'
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/settings/branding - Save branding settings
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admin cannot modify organization-specific branding settings
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super admin cannot modify organization branding settings' }, { status: 403 });
    }

    if (!session.user.organization) {
      return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
    }

    // Check if user has access to custom branding feature
    try {
      const hasAccess = await validateFeatureAccess(session.user.organization, 'customBranding');
      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Custom branding feature not available in your subscription plan',
          code: 'FEATURE_NOT_AVAILABLE',
          feature: 'customBranding'
        }, { status: 403 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: error.message,
        code: 'SUBSCRIPTION_CHECK_FAILED'
      }, { status: 403 });
    }

    await dbConnect();
    console.log('Database connected for POST request');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    const {
      appName,
      appTagline,
      logoText,
      footerText
    } = body;
    
    // Validate required fields
    if (!appName || !appTagline || !logoText || !footerText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if settings already exist for this organization
    const existingSettings = await BrandingSettings.findOne({ organization: session.user.organization });
    console.log('Existing branding settings for organization:', session.user.organization, existingSettings);
    
    const settingsData = {
      organization: session.user.organization,
      appName: appName.trim(),
      appTagline: appTagline.trim(),
      logoText: logoText.trim(),
      footerText: footerText.trim()
    };
    
    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await BrandingSettings.findByIdAndUpdate(
        existingSettings._id,
        settingsData,
        { new: true }
      );
      console.log('Updated existing branding settings:', settings);
    } else {
      // Create new settings
      settings = await BrandingSettings.create(settingsData);
      console.log('Created new branding settings:', settings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to save branding settings', details: error.message },
      { status: 500 }
    );
  }
} 