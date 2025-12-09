import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const PaymentGatewaySettingsSchema = new Schema({
  // This will be a global setting (no organization reference for super admin)
  global: {
    type: Boolean,
    default: true,
    required: true,
  },
  // Payment gateway mode
  mode: {
    type: String,
    enum: ['test', 'live'],
    default: 'test',
    required: true,
  },
  // Test environment credentials
  test: {
    stripePublicKey: {
      type: String,
      default: '',
    },
    stripeSecretKey: {
      type: String,
      default: '',
    },
    webhookSecret: {
      type: String,
      default: '',
    },
  },
  // Live environment credentials
  live: {
    stripePublicKey: {
      type: String,
      default: '',
    },
    stripeSecretKey: {
      type: String,
      default: '',
    },
    webhookSecret: {
      type: String,
      default: '',
    },
  },
  // Additional settings
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  // General settings
  general: {
    platformName: {
      type: String,
      default: 'DoctorCare',
    },
    platformDescription: {
      type: String,
      default: 'Practice Management System',
    },
    supportEmail: {
      type: String,
      default: 'support@doctorcare.com',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  // Notification settings
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    paymentAlerts: {
      type: Boolean,
      default: true,
    },
    systemAlerts: {
      type: Boolean,
      default: true,
    },
  },
  // Email configuration
  email: {
    enabled: {
      type: Boolean,
      default: true,
    },
    provider: {
      type: String,
      enum: ['smtp', 'gmail', 'outlook', 'sendgrid', 'mailgun'],
      default: 'smtp',
    },
    host: {
      type: String,
      default: 'smtp.gmail.com',
    },
    port: {
      type: Number,
      default: 587,
    },
    secure: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      default: '',
    },
    fromName: {
      type: String,
      default: 'DoctorCare',
    },
    fromEmail: {
      type: String,
      default: 'noreply@doctorcare.com',
    },
    // Provider-specific settings
    providerSettings: {
      sendgrid: {
        apiKey: {
          type: String,
          default: '',
        },
      },
      mailgun: {
        apiKey: {
          type: String,
          default: '',
        },
        domain: {
          type: String,
          default: '',
        },
      },
    },
  },
  // Security settings
  security: {
    requireTwoFactor: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number,
      default: 30,
    },
    passwordMinLength: {
      type: Number,
      default: 8,
    },
    allowPasswordReset: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
PaymentGatewaySettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one global settings document exists
PaymentGatewaySettingsSchema.index({ global: 1 }, { unique: true });

const PaymentGatewaySettings = mongoose.models.PaymentGatewaySettings || mongoose.model('PaymentGatewaySettings', PaymentGatewaySettingsSchema);

export default PaymentGatewaySettings; 