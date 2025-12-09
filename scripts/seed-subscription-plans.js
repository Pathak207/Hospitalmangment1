const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Define the SubscriptionPlan schema since we can't import the model directly
const SubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  monthlyPrice: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: [0, 'Price cannot be negative'],
  },
  yearlyPrice: {
    type: Number,
    required: [true, 'Yearly price is required'],
    min: [0, 'Price cannot be negative'],
  },
  features: {
    maxPatients: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    maxUsers: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    customBranding: {
      type: Boolean,
      default: false,
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    advancedReports: {
      type: Boolean,
      default: false,
    },
    apiAccess: {
      type: Boolean,
      default: false,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
  stripeMonthlyPriceId: {
    type: String,
    required: false,
  },
  stripeYearlyPriceId: {
    type: String,
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
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

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorcare';

async function seedSubscriptionPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing subscription plans');

    // Define subscription plans
    const plans = [
      {
        name: 'Basic',
        description: 'Perfect for small practices just getting started',
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        features: {
          maxPatients: 100,
          maxUsers: 2,
          customBranding: false,
          prioritySupport: false,
          advancedReports: false,
          apiAccess: false,
          smsNotifications: false,
          emailNotifications: true
        },
        isActive: true,
        isDefault: false,
        sortOrder: 1,
        stripeMonthlyPriceId: 'price_basic_monthly',
        stripeYearlyPriceId: 'price_basic_yearly'
      },
      {
        name: 'Professional',
        description: 'Most popular choice for growing practices',
        monthlyPrice: 59.99,
        yearlyPrice: 599.99,
        features: {
          maxPatients: 500,
          maxUsers: 5,
          customBranding: true,
          prioritySupport: true,
          advancedReports: true,
          apiAccess: true,
          smsNotifications: true,
          emailNotifications: true
        },
        isActive: true,
        isDefault: true,
        sortOrder: 2,
        stripeMonthlyPriceId: 'price_professional_monthly',
        stripeYearlyPriceId: 'price_professional_yearly'
      },
      {
        name: 'Enterprise',
        description: 'Advanced features for large healthcare organizations',
        monthlyPrice: 99.99,
        yearlyPrice: 999.99,
        features: {
          maxPatients: -1, // Unlimited
          maxUsers: -1, // Unlimited
          customBranding: true,
          prioritySupport: true,
          advancedReports: true,
          apiAccess: true,
          smsNotifications: true,
          emailNotifications: true
        },
        isActive: true,
        isDefault: false,
        sortOrder: 3,
        stripeMonthlyPriceId: 'price_enterprise_monthly',
        stripeYearlyPriceId: 'price_enterprise_yearly'
      }
    ];

    // Create plans
    const createdPlans = await SubscriptionPlan.insertMany(plans);
    console.log(`Created ${createdPlans.length} subscription plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.monthlyPrice}/month, $${plan.yearlyPrice}/year`);
    });

    console.log('Subscription plans seeded successfully!');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedSubscriptionPlans(); 