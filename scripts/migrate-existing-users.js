const mongoose = require('mongoose');
const { hash } = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// User Schema (inline definition for migration)
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

// Organization Schema (inline definition for migration)
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

// SubscriptionPlan Schema (inline definition for migration)
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

// Subscription Schema (inline definition for migration)
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

async function migrateExistingUsers() {
  try {
    console.log('Starting migration of existing users...');

    await connectDB();

    // Find users without organization (excluding super_admin)
    const usersWithoutOrg = await UserModel.find({
      organization: { $exists: false },
      role: { $ne: 'super_admin' }
    });

    console.log(`Found ${usersWithoutOrg.length} users without organization`);

    if (usersWithoutOrg.length === 0) {
      console.log('No users need migration');
      return;
    }

    // Get the default subscription plan
    const defaultPlan = await SubscriptionPlanModel.findOne({ isDefault: true });
    if (!defaultPlan) {
      console.log('No default subscription plan found. Creating one...');
      // You may want to run the SaaS seeding script first
      throw new Error('Please run the SaaS seeding script first: npm run seed:saas');
    }

    for (const user of usersWithoutOrg) {
      console.log(`\nMigrating user: ${user.name} (${user.email})`);

      // Create organization for this user
      const orgName = user.name.includes('Dr.') ? 
        `${user.name} Practice` : 
        `Dr. ${user.name} Practice`;

      const organization = await OrganizationModel.create({
        name: orgName,
        email: user.email,
        phone: user.phone || '',
        timezone: 'UTC',
        currency: 'USD',
        branding: {
          appName: orgName,
          appTagline: 'Practice Management',
          logoText: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
        },
        isActive: true,
        owner: user._id,
      });

      console.log(`Created organization: ${organization.name}`);

      // Create subscription for the organization (30-day trial)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30-day trial

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

      const subscription = await SubscriptionModel.create({
        organization: organization._id,
        plan: defaultPlan._id,
        status: 'trialing',
        billingCycle: 'monthly',
        amount: defaultPlan.monthlyPrice,
        currency: 'USD',
        startDate,
        endDate,
        trialEndDate,
        paymentMethod: 'manual',
        autoRenew: true,
        notes: 'Migrated existing user - 30-day trial',
      });

      console.log(`Created subscription: ${subscription.status} until ${endDate.toDateString()}`);

      // Update organization with subscription reference
      await OrganizationModel.findByIdAndUpdate(organization._id, {
        subscription: subscription._id,
      });

      // Update user with organization reference
      await UserModel.findByIdAndUpdate(user._id, {
        organization: organization._id,
        updatedAt: new Date(),
      });

      console.log(`Updated user with organization reference`);
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated ${usersWithoutOrg.length} users`);
    console.log('All existing users now have organizations and 30-day trial subscriptions');

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration script
if (require.main === module) {
  migrateExistingUsers();
}

module.exports = { migrateExistingUsers }; 