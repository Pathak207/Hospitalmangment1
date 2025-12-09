import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PaymentGatewaySettings from '@/models/PaymentGatewaySettings';

// GET - Fetch payment gateway settings (Super Admin only) or public key (public)
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const publicOnly = url.searchParams.get('public') === 'true';
    
    // If requesting public key only, don't require authentication
    if (publicOnly) {
      await dbConnect();
      console.log('Database connected for public payment gateway key request');
      
      const settings = await PaymentGatewaySettings.findOne({ global: true });
      
      if (settings) {
        const credentials = settings.mode === 'live' ? settings.live : settings.test;
        return NextResponse.json({
          publicKey: credentials.stripePublicKey || null,
          mode: settings.mode || 'test'
        });
      }
      
      // Return null if no settings configured
      return NextResponse.json({
        publicKey: null,
        mode: 'test'
      });
    }
    
    // For full settings, require super admin authentication
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can access payment gateway settings
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    console.log('Database connected for payment gateway settings GET');
    
    // Get global payment gateway settings
    let settings = await PaymentGatewaySettings.findOne({ global: true });
    console.log('Found payment gateway settings:', !!settings);
    
    // If no settings exist, return default settings
    if (!settings) {
      console.log('No payment gateway settings found, returning defaults');
      return NextResponse.json({
        general: {
          platformName: 'HealthPay',
          platformDescription: 'Practice Management System',
          supportEmail: 'support@doctorcare.com',
          timezone: 'UTC',
          currency: 'USD',
        },
        login: {
          pageTitle: 'Welcome to DoctorCare',
          subtitle: 'Your comprehensive practice management solution',
          buttonText: 'Sign In',
          footerText: 'DoctorCare. All rights reserved.',
          sidePanelTitle: 'Modern Healthcare Management',
          sidePanelDescription: 'Streamline your practice with our comprehensive management system designed for modern healthcare providers.',
          features: [
            'Patient Management',
            'Appointment Scheduling',
            'Medical Records',
            'Billing & Payments'
          ],
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          paymentAlerts: true,
          systemAlerts: true,
        },
        security: {
          requireTwoFactor: false,
          sessionTimeout: 30,
          passwordMinLength: 8,
          allowPasswordReset: true,
        },
        paymentGateway: {
          mode: 'test',
          test: {
            stripePublicKey: '',
            stripeSecretKey: '',
            webhookSecret: '',
          },
          live: {
            stripePublicKey: '',
            stripeSecretKey: '',
            webhookSecret: '',
          },
          taxRate: 0,
        },
        email: {
          enabled: true,
          provider: 'smtp',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
          providerSettings: {
            sendgrid: {
              apiKey: '',
            },
            mailgun: {
              apiKey: '',
              domain: '',
            },
          },
        }
      });
    }
    
    // Return the settings in the expected format
    const response = {
      general: settings.general,
      notifications: settings.notifications,
      security: settings.security,
      paymentGateway: {
        mode: settings.mode,
        test: settings.test,
        live: settings.live,
        taxRate: settings.taxRate,
      },
      email: settings.email || {
        enabled: true,
        provider: 'smtp',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromName: 'DoctorCare',
        fromEmail: 'noreply@doctorcare.com',
        providerSettings: {
          sendgrid: {
            apiKey: '',
          },
          mailgun: {
            apiKey: '',
            domain: '',
          },
        },
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching payment gateway settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment gateway settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save payment gateway settings (Super Admin only)
export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can save payment gateway settings
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    console.log('Database connected for payment gateway settings POST');
    
    const body = await request.json();
    console.log('Received payment gateway settings:', body);
    console.log('Email settings in request:', body.email);
    
    const {
      general,
      notifications,
      security,
      paymentGateway,
      email
    } = body;
    
    // Validate required fields
    if (!paymentGateway || !paymentGateway.mode) {
      return NextResponse.json(
        { error: 'Payment gateway configuration is required' },
        { status: 400 }
      );
    }
    
    // Prepare settings data
    const settingsData = {
      global: true,
      mode: paymentGateway.mode,
      test: paymentGateway.test || {
        stripePublicKey: '',
        stripeSecretKey: '',
        webhookSecret: '',
      },
      live: paymentGateway.live || {
        stripePublicKey: '',
        stripeSecretKey: '',
        webhookSecret: '',
      },
      taxRate: paymentGateway.taxRate || 0,
      general: general || {},
      notifications: notifications || {},
      security: security || {},
      email: email || {},
      updatedAt: new Date(),
    };
    
    // Check if settings already exist
    const existingSettings = await PaymentGatewaySettings.findOne({ global: true });
    console.log('Existing payment gateway settings:', !!existingSettings);
    
    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await PaymentGatewaySettings.findByIdAndUpdate(
        existingSettings._id,
        settingsData,
        { new: true, runValidators: true }
      );
      console.log('Updated existing payment gateway settings');
      console.log('Updated email settings:', settings.email);
    } else {
      // Create new settings
      settings = await PaymentGatewaySettings.create(settingsData);
      console.log('Created new payment gateway settings');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment gateway settings saved successfully',
      settings: {
        general: settings.general,
        notifications: settings.notifications,
        security: settings.security,
        paymentGateway: {
          mode: settings.mode,
          test: settings.test,
          live: settings.live,
          taxRate: settings.taxRate,
        },
        email: settings.email
      }
    });
  } catch (error) {
    console.error('Error saving payment gateway settings:', error);
    return NextResponse.json(
      { error: 'Failed to save payment gateway settings', details: error.message },
      { status: 500 }
    );
  }
} 