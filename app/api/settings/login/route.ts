import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import LoginSettings from '@/models/LoginSettings';
import { getAuthSession } from '@/lib/auth';

// GET /api/settings/login - Fetch login settings
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('Database connected successfully');
    
    let settings;
    
    // Super admin gets global login settings (no organization filter)
    if (session.user.role === 'super_admin') {
      settings = await LoginSettings.findOne({ organization: null });
      console.log('Found global settings for super admin:', settings);
    } else {
      // Regular users get organization-specific settings
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      
      settings = await LoginSettings.findOne({ organization: session.user.organization });
      console.log('Found settings for organization:', session.user.organization, settings);
    }
    
    // Return null if no settings exist, frontend should handle empty state
    if (!settings) {
      console.log('No settings found in database');
      return NextResponse.json(null);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching login settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/settings/login - Save login settings
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('Database connected for POST request');
    
    const body = await request.json();
    console.log('Received body:', body);
    
    const {
      pageTitle,
      subtitle,
      buttonText,
      footerText,
      sidePanelTitle,
      sidePanelDescription,
      features
    } = body;
    
    // Validate required fields
    if (!pageTitle || !subtitle || !buttonText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let settingsData;
    let existingSettings;
    
    // Super admin creates/updates global login settings
    if (session.user.role === 'super_admin') {
      existingSettings = await LoginSettings.findOne({ organization: null });
      console.log('Existing global settings for super admin:', existingSettings);
      
      settingsData = {
        organization: null, // Global settings have no organization
        pageTitle,
        subtitle,
        buttonText,
        footerText,
        sidePanelTitle,
        sidePanelDescription,
        features: features || []
      };
    } else {
      // Regular users create/update organization-specific settings
      if (!session.user.organization) {
        return NextResponse.json({ error: 'No organization associated with user' }, { status: 403 });
      }
      
      existingSettings = await LoginSettings.findOne({ organization: session.user.organization });
      console.log('Existing settings for organization:', session.user.organization, existingSettings);
      
      settingsData = {
        organization: session.user.organization,
        pageTitle,
        subtitle,
        buttonText,
        footerText,
        sidePanelTitle,
        sidePanelDescription,
        features: features || []
      };
    }
    
    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await LoginSettings.findByIdAndUpdate(
        existingSettings._id,
        settingsData,
        { new: true }
      );
      console.log('Updated existing settings:', settings);
    } else {
      // Create new settings
      settings = await LoginSettings.create(settingsData);
      console.log('Created new settings:', settings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving login settings:', error);
    return NextResponse.json(
      { error: 'Failed to save login settings', details: error.message },
      { status: 500 }
    );
  }
} 