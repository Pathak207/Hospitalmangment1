import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import PaymentGatewaySettings from '@/models/PaymentGatewaySettings';
import { emailService } from '@/lib/email';

export async function POST(request) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can send test emails
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    console.log('Database connected for test email');
    
    const body = await request.json();
    const { testEmail } = body;
    
    // Validate test email
    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid test email address is required' },
        { status: 400 }
      );
    }

    // Get current email settings
    const settings = await PaymentGatewaySettings.findOne({ global: true });
    if (!settings || !settings.email) {
      return NextResponse.json(
        { error: 'No email configuration found. Please configure email settings first.' },
        { status: 400 }
      );
    }

    const emailConfig = settings.email;
    if (!emailConfig.enabled) {
      return NextResponse.json(
        { error: 'Email system is disabled. Please enable it in settings first.' },
        { status: 400 }
      );
    }

    console.log('Sending test email to:', testEmail);
    console.log('Using provider:', emailConfig.provider);

    // Create test email data
    const testData = {
      userData: {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail
      },
      organizationData: {
        name: 'Test Organization'
      },
      subscriptionData: {
        isTrialOnly: true,
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        planName: 'Test Plan',
        billingCycle: 'monthly',
        amount: 0
      }
    };

    // Send test email using the dedicated test email function
    console.log('Attempting to send test email...');
    const emailResult = await emailService.sendTestEmail(testEmail);

    console.log('Email service result:', emailResult);

    // Check if email was actually sent successfully
    if (!emailResult.success) {
      console.error('Email service reported failure:', emailResult.error);
      return NextResponse.json({
        error: `Failed to send test email: ${emailResult.error}`,
        details: emailResult.error,
        provider: emailConfig.provider,
        success: false
      }, { status: 500 });
    }

    console.log('✅ Test email sent successfully with messageId:', emailResult.messageId);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      provider: emailConfig.provider,
      testDetails: {
        to: testEmail,
        provider: emailConfig.provider.toUpperCase(),
        fromName: emailConfig.fromName,
        fromEmail: emailConfig.fromEmail,
        messageId: emailResult.messageId,
        response: emailResult.response,
        fromAddress: emailResult.fromAddress,
        timestamp: emailResult.timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    let errorMessage = 'Failed to send test email';
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Email authentication failed. Please check your username and password.';
    } else if (error.message.includes('Connection timeout')) {
      errorMessage = 'Email server connection timeout. Please check host and port settings.';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Email server not found. Please check your host settings.';
    } else if (error.message.includes('535')) {
      errorMessage = 'Email authentication failed. Please check your credentials.';
    } else if (error.message.includes('550')) {
      errorMessage = 'Email rejected by server. Please check your from email address.';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        provider: error.provider || 'unknown'
      },
      { status: 500 }
    );
  }
} 