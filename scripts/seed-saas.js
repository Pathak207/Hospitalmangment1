const mongoose = require('mongoose');
const { hash } = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// User Schema (inline definition for seeding)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'nurse', 'admin', 'staff', 'super_admin'], default: 'doctor' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: function() { return this.role !== 'super_admin'; } },
  phone: { type: String, default: '' },
  specialization: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  department: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Organization Schema (inline definition for seeding)
const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: false },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  website: { type: String, required: false },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: false },
  isActive: { type: Boolean, default: true },
  branding: {
    appName: { type: String, default: 'DoctorCare' },
    appTagline: { type: String, default: 'Practice Management' },
    logoText: { type: String, default: 'DC' },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E40AF' },
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// SubscriptionPlan Schema (inline definition for seeding)
const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  monthlyPrice: { type: Number, required: true, min: 0 },
  yearlyPrice: { type: Number, required: true, min: 0 },
  stripeMonthlyPriceId: { type: String, required: false },
  stripeYearlyPriceId: { type: String, required: false },
  features: {
    maxPatients: { type: Number, default: -1 },
    maxUsers: { type: Number, default: -1 },
    maxAppointments: { type: Number, default: -1 },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    advancedReports: { type: Boolean, default: false },
    dataBackup: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Subscription Schema (inline definition for seeding)
const SubscriptionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due', 'unpaid', 'trialing'], default: 'active' },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  trialEndDate: { type: Date, required: false },
  stripeSubscriptionId: { type: String, required: false },
  stripeCustomerId: { type: String, required: false },
  paymentMethod: { type: String, enum: ['stripe', 'manual', 'cash'], default: 'stripe' },
  lastPaymentDate: { type: Date, required: false },
  nextPaymentDate: { type: Date, required: false },
  autoRenew: { type: Boolean, default: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  cancelledAt: { type: Date, required: false },
  cancelReason: { type: String, required: false },
  notes: { type: String, required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create models
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
const SubscriptionPlanModel = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorcare');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await UserModel.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return existingSuperAdmin;
    }

    // Create super admin user
    const hashedPassword = await hash('12345', 12);
    const superAdmin = await UserModel.create({
      name: 'Super Admin',
      email: 'superadmin@dms.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    });

    console.log('Super admin created successfully');
    return superAdmin;
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
}

async function createSubscriptionPlans() {
  try {
    // Check if plans already exist
    const existingPlans = await SubscriptionPlanModel.find();
    if (existingPlans.length > 0) {
      console.log('Subscription plans already exist');
      return existingPlans;
    }

    // Create subscription plans
    const plans = [
      {
        name: 'Basic',
        description: 'Perfect for small practices',
        monthlyPrice: 29.99,
        yearlyPrice: 299.99,
        features: {
          maxPatients: 100,
          maxUsers: 3,
          maxAppointments: 500,
          customBranding: false,
          apiAccess: false,
          prioritySupport: false,
          advancedReports: false,
          dataBackup: true,
          smsNotifications: false,
          emailNotifications: true,
        },
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Professional',
        description: 'Great for growing practices',
        monthlyPrice: 59.99,
        yearlyPrice: 599.99,
        features: {
          maxPatients: 500,
          maxUsers: 10,
          maxAppointments: 2000,
          customBranding: true,
          apiAccess: false,
          prioritySupport: true,
          advancedReports: true,
          dataBackup: true,
          smsNotifications: true,
          emailNotifications: true,
        },
        isActive: true,
        isDefault: true,
        sortOrder: 2,
      },
      {
        name: 'Enterprise',
        description: 'For large practices and clinics',
        monthlyPrice: 99.99,
        yearlyPrice: 999.99,
        features: {
          maxPatients: -1, // Unlimited
          maxUsers: -1, // Unlimited
          maxAppointments: -1, // Unlimited
          customBranding: true,
          apiAccess: true,
          prioritySupport: true,
          advancedReports: true,
          dataBackup: true,
          smsNotifications: true,
          emailNotifications: true,
        },
        isActive: true,
        sortOrder: 3,
      },
    ];

    const createdPlans = await SubscriptionPlanModel.insertMany(plans);
    console.log(`Created ${createdPlans.length} subscription plans`);
    return createdPlans;
  } catch (error) {
    console.error('Error creating subscription plans:', error);
    throw error;
  }
}

async function createDemoOrganization() {
  try {
    // Check if demo organization already exists
    const existingOrg = await OrganizationModel.findOne({ email: 'admin@dms.com' });
    if (existingOrg) {
      console.log('Demo organization already exists');
      return existingOrg;
    }

    // Create demo organization
    const demoOrg = await OrganizationModel.create({
      name: 'Demo Medical Practice',
      email: 'admin@dms.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Medical Center Dr',
        city: 'Healthcare City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
      },
      website: 'https://demo.doctorcare.com',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      branding: {
        appName: 'Demo Medical Practice',
        appTagline: 'Your Health, Our Priority',
        logoText: 'DMP',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
      },
      isActive: true,
    });

    console.log('Demo organization created successfully');
    return demoOrg;
  } catch (error) {
    console.error('Error creating demo organization:', error);
    throw error;
  }
}

async function createDemoUser(organizationId) {
  try {
    // Check if demo user already exists
    const existingUser = await UserModel.findOne({ email: 'admin@dms.com' });
    if (existingUser) {
      console.log('Demo user already exists');
      return existingUser;
    }

    // Create demo user
    const hashedPassword = await hash('12345', 12);
    const demoUser = await UserModel.create({
      name: 'Dr. Demo User',
      email: 'admin@dms.com',
      password: hashedPassword,
      role: 'admin',
      organization: organizationId,
      phone: '+1-555-0123',
      specialization: 'General Practice',
      licenseNumber: 'MD123456',
      department: 'General Medicine',
      isActive: true,
    });

    // Update organization with owner reference
    await OrganizationModel.findByIdAndUpdate(organizationId, {
      owner: demoUser._id,
    });

    console.log('Demo user created successfully');
    return demoUser;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
}

async function createDemoSubscription(organizationId, planId) {
  try {
    // Check if demo subscription already exists
    const existingSubscription = await SubscriptionModel.findOne({ organization: organizationId });
    if (existingSubscription) {
      console.log('Demo subscription already exists');
      return existingSubscription;
    }

    // Create demo subscription (30-day trial)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30-day trial

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    const demoSubscription = await SubscriptionModel.create({
      organization: organizationId,
      plan: planId,
      status: 'trialing',
      billingCycle: 'monthly',
      amount: 59.99,
      currency: 'USD',
      startDate,
      endDate,
      trialEndDate,
      paymentMethod: 'manual',
      autoRenew: true,
      notes: 'Demo subscription with trial period',
    });

    // Update organization with subscription reference
    await OrganizationModel.findByIdAndUpdate(organizationId, {
      subscription: demoSubscription._id,
    });

    console.log('Demo subscription created successfully');
    return demoSubscription;
  } catch (error) {
    console.error('Error creating demo subscription:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('Starting SaaS database seeding...');

    // Connect to database
    await connectDB();

    // Create super admin
    const superAdmin = await createSuperAdmin();

    // Create subscription plans
    const plans = await createSubscriptionPlans();
    const professionalPlan = plans.find(plan => plan.name === 'Professional');

    // Create demo organization
    const demoOrg = await createDemoOrganization();

    // Create demo user
    const demoUser = await createDemoUser(demoOrg._id);

    // Create demo subscription
    if (professionalPlan) {
      await createDemoSubscription(demoOrg._id, professionalPlan._id);
    }

    console.log('\n=== SaaS Database Seeding Complete ===');
    console.log('\nLogin Credentials:');
    console.log('Super Admin:');
    console.log('  Email: superadmin@dms.com');
    console.log('  Password: 12345');
    console.log('\nDemo Organization Admin:');
    console.log('  Email: admin@dms.com');
    console.log('  Password: 12345');
    console.log('\nDemo Organization: Demo Medical Practice');
    console.log('Subscription: Professional Plan (14-day trial)');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase }; 