import nodemailer from 'nodemailer';
import dbConnect from '@/lib/db';
import PaymentGatewaySettings from '@/models/PaymentGatewaySettings';

// Get email settings from database
const getEmailSettings = async () => {
  try {
    await dbConnect();
    const settings = await PaymentGatewaySettings.findOne({ global: true });
    
    if (!settings || !settings.email || !settings.email.enabled) {
      console.log('Email not configured or disabled in admin settings');
      return null;
    }
    
    return settings.email;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
};

// Create email transporter
const createTransporter = async () => {
  const emailSettings = await getEmailSettings();
  
  // If no email settings or email disabled, use ethereal for development
  if (!emailSettings) {
    console.log('Using Ethereal Email for testing (no admin settings configured)');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // Configure transporter based on provider
  const config = {
    host: emailSettings.host,
    port: emailSettings.port,
    secure: emailSettings.secure,
    auth: {
      user: emailSettings.username,
      pass: emailSettings.password
    }
  };

  // Provider-specific configurations
  switch (emailSettings.provider) {
    case 'gmail':
      config.host = 'smtp.gmail.com';
      config.port = 587;
      config.secure = false;
      break;
    case 'outlook':
      config.host = 'smtp-mail.outlook.com';
      config.port = 587;
      config.secure = false;
      break;
    case 'sendgrid':
      config.host = 'smtp.sendgrid.net';
      config.port = 587;
      config.secure = false;
      config.auth.user = 'apikey';
      config.auth.pass = emailSettings.providerSettings.sendgrid.apiKey;
      break;
    case 'mailgun':
      config.host = 'smtp.mailgun.org';
      config.port = 587;
      config.secure = false;
      break;
    case 'smtp':
    default:
      // Use custom SMTP settings as configured
      break;
  }

  return nodemailer.createTransport(config);
};

// Email templates
const emailTemplates = {
  welcome: (userData, organizationData, subscriptionData) => ({
    subject: `Welcome to DoctorCare - ${subscriptionData.isTrialOnly ? 'Your Free Trial' : 'Your Subscription'} is Ready!`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to DoctorCare</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #3B82F6; }
        .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        .trial-info { background: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .paid-info { background: #ECFDF5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10B981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to DoctorCare!</h1>
          <p>${subscriptionData.isTrialOnly ? 'Your free trial is now active' : 'Your subscription is confirmed and active'}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${userData.firstName} ${userData.lastName}!</h2>
          
          <p>Congratulations! Your DoctorCare account has been successfully created for <strong>${organizationData.name}</strong>.</p>
          
          <div class="card">
            <h3>📋 Your Account Details</h3>
            <ul>
              <li><strong>Email:</strong> ${userData.email}</li>
              <li><strong>Organization:</strong> ${organizationData.name}</li>
              <li><strong>Account Type:</strong> ${subscriptionData.isTrialOnly ? 'Free Trial' : 'Paid Subscription'}</li>
              ${subscriptionData.isTrialOnly ? `<li><strong>Trial Ends:</strong> ${new Date(subscriptionData.trialEndDate).toLocaleDateString()}</li>` : ''}
            </ul>
          </div>

          ${subscriptionData.isTrialOnly ? `
          <div class="trial-info">
            <h3>🚀 Your 14-Day Free Trial Includes:</h3>
            <ul>
              ${formatPlanFeatures(subscriptionData.planFeatures, true).html}
            </ul>
            <p><small>💡 No credit card required during trial. Upgrade anytime to continue using DoctorCare.</small></p>
          </div>` : `
          <div class="paid-info">
            <h3>✅ Your Subscription is Active</h3>
            <ul>
              <li><strong>Plan:</strong> ${subscriptionData.planName}</li>
              ${subscriptionData.planDescription ? `<li><strong>Description:</strong> ${subscriptionData.planDescription}</li>` : ''}
              <li><strong>Billing:</strong> $${subscriptionData.amount}/${subscriptionData.billingCycle === 'yearly' ? 'year' : 'month'}</li>
              <li><strong>Billing Cycle:</strong> ${subscriptionData.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}</li>
              <li><strong>Status:</strong> Active & Ready to Use</li>
              ${subscriptionData.trialEndDate ? `<li><strong>Trial Period:</strong> ${new Date(subscriptionData.trialEndDate).toLocaleDateString()} (Free trial included)</li>` : ''}
            </ul>
            <div style="background: #F0FDF4; padding: 10px; border-radius: 4px; margin-top: 10px;">
              <p><strong>🎁 Your Plan Includes:</strong></p>
              <ul>
                ${formatPlanFeatures(subscriptionData.planFeatures, false).html}
              </ul>
            </div>
          </div>`}

          <div class="card">
            <h3>🚀 Next Steps</h3>
            <ol>
              <li>Sign in to your dashboard</li>
              <li>Complete your practice profile</li>
              <li>Add your first patient</li>
              <li>Schedule your first appointment</li>
              <li>Invite your team members</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">
              Sign In to Your Dashboard
            </a>
          </div>

          <div class="card">
            <h3>📞 Need Help?</h3>
            <p>Our support team is here to help you get started:</p>
            <ul>
              <li>📧 Email: support@doctorcare.com</li>
              <li>📚 Documentation: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/docs">Visit our help center</a></li>
              <li>🎥 Video tutorials: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tutorials">Watch getting started videos</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${userData.email} because you signed up for DoctorCare.</p>
          <p>© ${new Date().getFullYear()} DoctorCare. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `,
    text: `
    Welcome to DoctorCare!
    
    Hello ${userData.firstName} ${userData.lastName}!
    
    Your DoctorCare account has been successfully created for ${organizationData.name}.
    
    Account Details:
    - Email: ${userData.email}
    - Organization: ${organizationData.name}
    - Account Type: ${subscriptionData.isTrialOnly ? 'Free Trial' : 'Paid Subscription'}
    ${subscriptionData.isTrialOnly ? 
      `- Trial Ends: ${new Date(subscriptionData.trialEndDate).toLocaleDateString()}` : 
      `- Plan: ${subscriptionData.planName}
    - Billing: $${subscriptionData.amount}/${subscriptionData.billingCycle === 'yearly' ? 'year' : 'month'}
    - Status: Active & Ready to Use${subscriptionData.trialEndDate ? `
    - Trial Period: ${new Date(subscriptionData.trialEndDate).toLocaleDateString()} (Free trial included)` : ''}`
    }
    
    ${subscriptionData.isTrialOnly ? `
    Your 14-Day Free Trial Includes:${formatPlanFeatures(subscriptionData.planFeatures, true).text}
    
    💡 No credit card required during trial. Upgrade anytime to continue using DoctorCare.` : `
    Your Plan Includes:${formatPlanFeatures(subscriptionData.planFeatures, false).text}`}
    
    Next Steps:
    1. Sign in to your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login
    2. Complete your practice profile
    3. Add your first patient
    4. Schedule your first appointment
    5. Invite your team members
    
    Need help? Contact us at support@doctorcare.com
    
    Best regards,
    The DoctorCare Team
    `
  }),

  trialExpiringSoon: (userData, organizationData, daysLeft) => ({
    subject: `DoctorCare Trial Expiring in ${daysLeft} Days - Continue Your Journey`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FEF3C7; color: #92400E; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Your Trial Expires in ${daysLeft} Days</h1>
        </div>
        <div class="content">
          <h2>Hi ${userData.firstName}!</h2>
          <p>Your DoctorCare trial for ${organizationData.name} expires in ${daysLeft} days.</p>
          <p>Continue enjoying all features by upgrading to a paid plan.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/billing/upgrade" class="button">
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  }),

  subscriptionConfirmation: (userData, organizationData, subscriptionData) => ({
    subject: 'DoctorCare Subscription Confirmed - Thank You!',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Subscription Confirmed</h1>
        </div>
        <div class="content">
          <h2>Thank you ${userData.firstName}!</h2>
          <p>Your subscription for ${organizationData.name} has been confirmed.</p>
          <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
          <p><strong>Billing:</strong> ${subscriptionData.billingCycle}</p>
          <p><strong>Amount:</strong> $${subscriptionData.amount}</p>
        </div>
      </div>
    </body>
    </html>
    `
  })
};

// Helper function to format plan features for emails
const formatPlanFeatures = (planFeatures, isTrialOnly = false) => {
  if (isTrialOnly) {
    return {
      html: `
        <li>✅ Unlimited patient records</li>
        <li>✅ Appointment scheduling</li>
        <li>✅ Prescription management</li>
        <li>✅ Report generation</li>
        <li>✅ Team collaboration tools</li>
        <li>✅ All premium features</li>
      `,
      text: `
✅ Unlimited patient records
✅ Appointment scheduling  
✅ Prescription management
✅ Report generation
✅ Team collaboration tools
✅ All premium features`
    };
  }

  if (!planFeatures) {
    return {
      html: `
        <li>✅ Complete healthcare management system</li>
        <li>✅ Patient records & appointments</li>
        <li>✅ Medical record management</li>
        <li>✅ Prescription tracking</li>
        <li>✅ Team collaboration tools</li>
      `,
      text: `
✅ Complete healthcare management system
✅ Patient records & appointments
✅ Medical record management
✅ Prescription tracking
✅ Team collaboration tools`
    };
  }

  const features = [];
  const textFeatures = [];

  // Patient limit
  if (planFeatures.maxPatients === -1) {
    features.push('<li>✅ <strong>Unlimited patients</strong></li>');
    textFeatures.push('✅ Unlimited patients');
  } else {
    features.push(`<li>✅ <strong>Up to ${planFeatures.maxPatients} patients</strong></li>`);
    textFeatures.push(`✅ Up to ${planFeatures.maxPatients} patients`);
  }

  // User limit
  if (planFeatures.maxUsers === -1) {
    features.push('<li>✅ <strong>Unlimited team members</strong></li>');
    textFeatures.push('✅ Unlimited team members');
  } else {
    features.push(`<li>✅ <strong>Up to ${planFeatures.maxUsers} team members</strong></li>`);
    textFeatures.push(`✅ Up to ${planFeatures.maxUsers} team members`);
  }

  // Appointment limit
  if (planFeatures.maxAppointments === -1) {
    features.push('<li>✅ <strong>Unlimited appointments</strong></li>');
    textFeatures.push('✅ Unlimited appointments');
  } else {
    features.push(`<li>✅ <strong>Up to ${planFeatures.maxAppointments} appointments</strong></li>`);
    textFeatures.push(`✅ Up to ${planFeatures.maxAppointments} appointments`);
  }

  // Core features
  features.push('<li>✅ Complete medical record management</li>');
  features.push('<li>✅ Prescription & lab result tracking</li>');
  textFeatures.push('✅ Complete medical record management');
  textFeatures.push('✅ Prescription & lab result tracking');

  // Conditional features
  if (planFeatures.advancedReports) {
    features.push('<li>✅ <strong>Advanced reporting & analytics</strong></li>');
    textFeatures.push('✅ Advanced reporting & analytics');
  } else {
    features.push('<li>✅ Basic reporting</li>');
    textFeatures.push('✅ Basic reporting');
  }

  if (planFeatures.customBranding) {
    features.push('<li>✅ <strong>Custom branding</strong></li>');
    textFeatures.push('✅ Custom branding');
  }

  if (planFeatures.apiAccess) {
    features.push('<li>✅ <strong>API access</strong></li>');
    textFeatures.push('✅ API access');
  }

  if (planFeatures.prioritySupport) {
    features.push('<li>✅ <strong>Priority customer support</strong></li>');
    textFeatures.push('✅ Priority customer support');
  } else {
    features.push('<li>✅ Standard customer support</li>');
    textFeatures.push('✅ Standard customer support');
  }

  if (planFeatures.smsNotifications) {
    features.push('<li>✅ <strong>SMS notifications</strong></li>');
    textFeatures.push('✅ SMS notifications');
  }

  if (planFeatures.emailNotifications) {
    features.push('<li>✅ Email notifications</li>');
    textFeatures.push('✅ Email notifications');
  }

  if (planFeatures.dataBackup) {
    features.push('<li>✅ Regular data backup</li>');
    textFeatures.push('✅ Regular data backup');
  }

  features.push('<li>✅ Regular feature updates & security patches</li>');
  textFeatures.push('✅ Regular feature updates & security patches');

  return {
    html: features.join('\n                '),
    text: textFeatures.join('\n     ')
  };
};

// Get FROM address from settings
const getFromAddress = async () => {
  const emailSettings = await getEmailSettings();
  if (emailSettings) {
    return `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`;
  }
  return '"DoctorCare" <noreply@doctorcare.com>';
};

// Main email service
export const emailService = {
  async sendWelcomeEmail(userData, organizationData, subscriptionData) {
    try {
      const transporter = await createTransporter();
      const template = emailTemplates.welcome(userData, organizationData, subscriptionData);
      const fromAddress = await getFromAddress();
      
      const mailOptions = {
        from: fromAddress,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', result.messageId);
      
      // In development, log the preview URL for ethereal
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  },

  async sendTrialExpiringEmail(userData, organizationData, daysLeft) {
    try {
      const transporter = await createTransporter();
      const template = emailTemplates.trialExpiringSoon(userData, organizationData, daysLeft);
      const fromAddress = await getFromAddress();
      
      const mailOptions = {
        from: fromAddress,
        to: userData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Trial expiring email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send trial expiring email:', error);
      return { success: false, error: error.message };
    }
  },

  async sendSubscriptionConfirmationEmail(userData, organizationData, subscriptionData) {
    try {
      const transporter = await createTransporter();
      const template = emailTemplates.subscriptionConfirmation(userData, organizationData, subscriptionData);
      const fromAddress = await getFromAddress();
      
      const mailOptions = {
        from: fromAddress,
        to: userData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Subscription confirmation email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send subscription confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Generic email sender
  async sendEmail({ to, subject, html, text }) {
    try {
      const transporter = await createTransporter();
      const fromAddress = await getFromAddress();
      
      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html,
        text
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error.message };
    }
  },

  async sendTestEmail(testEmailAddress) {
    try {
      console.log('🧪 Preparing test email...');
      
      const transporter = await createTransporter();
      const fromAddress = await getFromAddress();
      const emailSettings = await getEmailSettings();
      
      if (!emailSettings) {
        throw new Error('No email configuration found');
      }

      // Create test email template
      const testTemplate = {
        subject: '🧪 DoctorCare Email Configuration Test',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Configuration Test</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-box { background: #10B981; color: white; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #10B981; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .provider-badge { background: #EBF8FF; color: #1E40AF; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Email Configuration Test</h1>
              <p>Testing DoctorCare Email System</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <h2>✅ Test Email Delivered Successfully!</h2>
                <p>Your email configuration is working correctly.</p>
              </div>
              
              <div class="info-box">
                <h3>📊 Test Details</h3>
                <p><strong>Test Email:</strong> ${testEmailAddress}</p>
                <p><strong>Provider:</strong> <span class="provider-badge">${emailSettings.provider.toUpperCase()}</span></p>
                <p><strong>From:</strong> ${emailSettings.fromName} &lt;${emailSettings.fromEmail}&gt;</p>
                <p><strong>Host:</strong> ${emailSettings.host || 'API-based'}</p>
                <p><strong>Port:</strong> ${emailSettings.port || 'N/A'}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="info-box">
                <h3>🎯 What This Means</h3>
                <ul>
                  <li>✅ SMTP/API connection is working</li>
                  <li>✅ Authentication is successful</li>
                  <li>✅ Email delivery is functional</li>
                  <li>✅ Your users will receive notifications</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated test email from DoctorCare.</p>
              <p>© ${new Date().getFullYear()} DoctorCare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `🧪 DoctorCare Email Configuration Test

✅ Test Email Delivered Successfully!
Your email configuration is working correctly.

📊 Test Details:
- Test Email: ${testEmailAddress}
- Provider: ${emailSettings.provider.toUpperCase()}
- From: ${emailSettings.fromName} <${emailSettings.fromEmail}>
- Host: ${emailSettings.host || 'API-based'}
- Port: ${emailSettings.port || 'N/A'}
- Timestamp: ${new Date().toLocaleString()}

🎯 What This Means:
✅ SMTP/API connection is working
✅ Authentication is successful  
✅ Email delivery is functional
✅ Your users will receive notifications

This is an automated test email from DoctorCare.
© ${new Date().getFullYear()} DoctorCare. All rights reserved.`
      };
      
      console.log('📧 Sending test email to:', testEmailAddress);
      console.log('📡 Using provider:', emailSettings.provider);
      console.log('📤 From address:', fromAddress);
      
      const mailOptions = {
        from: fromAddress,
        to: testEmailAddress,
        subject: testTemplate.subject,
        html: testTemplate.html,
        text: testTemplate.text
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ Test email sent successfully!');
      console.log('📮 Message ID:', result.messageId);
      console.log('📊 Response:', result.response);
      
      // In development, log the preview URL for ethereal
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
          console.log('🔗 Preview URL:', previewUrl);
        }
      }
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: result.response,
        provider: emailSettings.provider,
        fromAddress: fromAddress,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      
      // Enhanced error details
      let errorDetails = {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      };
      
      return { 
        success: false, 
        error: error.message,
        details: errorDetails,
        timestamp: new Date().toISOString()
      };
    }
  },

  async sendSubscriberWelcomeEmail(userData, organizationData, subscriptionData) {
    try {
      console.log('📧 Preparing subscriber welcome email...');
      
      const transporter = await createTransporter();
      const fromAddress = await getFromAddress();
      const emailSettings = await getEmailSettings();
      
      if (!emailSettings) {
        throw new Error('No email configuration found');
      }

      // Create subscriber welcome email template
      const template = {
        subject: '🎉 Welcome to DoctorCare - Your Healthcare Management System is Ready!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DoctorCare</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #3B82F6; }
            .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
            .trial-info { background: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .admin-note { background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to DoctorCare!</h1>
              <p>Your healthcare management account has been created by our admin team</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userData.firstName} ${userData.lastName}!</h2>
              
              <div class="admin-note">
                <h3>📋 Account Created by Administrator</h3>
                <p>Your DoctorCare account for <strong>${organizationData.name}</strong> has been set up by our administrative team. You can now access your healthcare management system.</p>
              </div>
              
              <div class="card">
                <h3>🔑 Your Account Details</h3>
                <p><strong>Organization:</strong> ${organizationData.name}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Role:</strong> Administrator</p>
                <p><strong>Access Level:</strong> Full System Access</p>
              </div>
              
              <div class="card">
                <h3>📊 Subscription Information</h3>
                <p><strong>Plan:</strong> ${subscriptionData.planName}</p>
                <p><strong>Status:</strong> ${subscriptionData.isTrialOnly ? 'Trial Period' : 'Active'}</p>
                ${subscriptionData.isTrialOnly ? 
                  `<p><strong>Trial Ends:</strong> ${new Date(subscriptionData.trialEndDate).toLocaleDateString()}</p>` :
                  `<p><strong>Billing:</strong> $${subscriptionData.amount} / ${subscriptionData.billingCycle}</p>`
                }
              </div>
              
              <div class="card">
                <h3>🚀 Next Steps</h3>
                <ol>
                  <li><strong>Access Your Account:</strong> 
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">Login to DoctorCare</a>
                  </li>
                  <li><strong>Complete Your Profile:</strong> Update your organization and personal information</li>
                  <li><strong>Add Your Team:</strong> Invite staff members and set up user roles</li>
                  <li><strong>Import Data:</strong> Add your patients, appointments, and medical records</li>
                  <li><strong>Explore Features:</strong> Discover appointment scheduling, patient management, and reporting tools</li>
                </ol>
              </div>
              
              <div class="card">
                <h3>📚 Getting Started Resources</h3>
                <ul>
                  <li>📖 User guide: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/docs">Complete documentation</a></li>
                  <li>🎥 Video tutorials: <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tutorials">Watch getting started videos</a></li>
                  <li>💬 Support: Contact our team for any questions or assistance</li>
                </ul>
              </div>
              
              ${subscriptionData.isTrialOnly ? `
              <div class="trial-info">
                <h3>⏰ Trial Period Notice</h3>
                <p>Your trial period will end on <strong>${new Date(subscriptionData.trialEndDate).toLocaleDateString()}</strong>. During this time, you have full access to all features. To continue using DoctorCare after the trial, please upgrade to a paid plan.</p>
              </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p>This email was sent to ${userData.email} because an account was created for you.</p>
              <p>© ${new Date().getFullYear()} DoctorCare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `
Welcome to DoctorCare!

Hello ${userData.firstName} ${userData.lastName}!

ACCOUNT CREATED BY ADMINISTRATOR
Your DoctorCare account for ${organizationData.name} has been set up by our administrative team.

YOUR ACCOUNT DETAILS:
- Organization: ${organizationData.name}
- Email: ${userData.email}
- Role: Administrator
- Access Level: Full System Access

SUBSCRIPTION INFORMATION:
- Plan: ${subscriptionData.planName}
- Status: ${subscriptionData.isTrialOnly ? 'Trial Period' : 'Active'}
${subscriptionData.isTrialOnly ? 
  `- Trial Ends: ${new Date(subscriptionData.trialEndDate).toLocaleDateString()}` :
  `- Billing: $${subscriptionData.amount} / ${subscriptionData.billingCycle}`
}

NEXT STEPS:
1. Login to your account: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login
2. Complete your profile and organization information
3. Add your team members and set up user roles
4. Import your patients, appointments, and medical records
5. Explore the appointment scheduling and patient management features

GETTING STARTED RESOURCES:
- User guide: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/docs
- Video tutorials: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tutorials
- Support: Contact our team for any questions

${subscriptionData.isTrialOnly ? `
TRIAL PERIOD NOTICE:
Your trial period will end on ${new Date(subscriptionData.trialEndDate).toLocaleDateString()}. During this time, you have full access to all features. To continue using DoctorCare after the trial, please upgrade to a paid plan.
` : ''}

This email was sent to ${userData.email} because an account was created for you.
© ${new Date().getFullYear()} DoctorCare. All rights reserved.
        `
      };
      
      console.log('📧 Sending subscriber welcome email to:', userData.email);
      console.log('🏢 Organization:', organizationData.name);
      
      const mailOptions = {
        from: fromAddress,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log('✅ Subscriber welcome email sent successfully!');
      console.log('📮 Message ID:', result.messageId);
      
      // In development, log the preview URL for ethereal
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
          console.log('🔗 Preview URL:', previewUrl);
        }
      }
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: result.response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to send subscriber welcome email:', error);
      
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export default emailService; 