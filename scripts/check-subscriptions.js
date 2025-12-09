const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Subscription Schema (inline definition)
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

// Organization Schema (inline definition)
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

// Create models
const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctorcare');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function checkSubscriptions() {
  try {
    await connectDB();

    console.log('Checking all subscriptions...\n');

    const subscriptions = await SubscriptionModel.find()
      .populate('organization', 'name email')
      .populate('plan', 'name monthlyPrice');

    const now = new Date();
    console.log('Current date:', now.toISOString());
    console.log('Current date (local):', now.toLocaleString());
    console.log('');

    subscriptions.forEach((sub, index) => {
      console.log(`--- Subscription ${index + 1} ---`);
      console.log('Organization:', sub.organization?.name || 'Unknown');
      console.log('Email:', sub.organization?.email || 'Unknown');
      console.log('Plan:', sub.plan?.name || 'Unknown');
      console.log('Status:', sub.status);
      console.log('Billing Cycle:', sub.billingCycle);
      console.log('Amount:', `$${sub.amount}`);
      console.log('Start Date:', sub.startDate.toLocaleString());
      console.log('End Date:', sub.endDate.toLocaleString());
      console.log('Trial End Date:', sub.trialEndDate ? sub.trialEndDate.toLocaleString() : 'N/A');
      console.log('Payment Method:', sub.paymentMethod);
      console.log('Notes:', sub.notes || 'None');
      
      // Check if expired
      const isExpired = sub.endDate < now;
      const trialExpired = sub.status === 'trialing' && sub.trialEndDate && sub.trialEndDate < now;
      
      console.log('Is Expired (endDate):', isExpired);
      console.log('Is Trial Expired (trialEndDate):', trialExpired);
      
      if (sub.endDate > now) {
        const daysRemaining = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24));
        console.log('Days Remaining:', daysRemaining);
      }
      
      if (sub.trialEndDate && sub.trialEndDate > now) {
        const trialDaysRemaining = Math.ceil((sub.trialEndDate - now) / (1000 * 60 * 60 * 24));
        console.log('Trial Days Remaining:', trialDaysRemaining);
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('Error checking subscriptions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check script
if (require.main === module) {
  checkSubscriptions();
}

module.exports = { checkSubscriptions }; 