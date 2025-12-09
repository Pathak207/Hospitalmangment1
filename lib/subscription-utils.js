import dbConnect from './db';
import SubscriptionModel from '@/models/Subscription';
import OrganizationModel from '@/models/Organization';
import PatientModel from '@/models/Patient';
import UserModel from '@/models/User';
import AppointmentModel from '@/models/Appointment';

/**
 * Get current monthly usage statistics for an organization
 * Uses calendar month (resets on 1st of each month)
 */
export async function getCurrentUsage(organizationId) {
  await dbConnect();
  
  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  // Get all users in the organization
  const orgUsers = await UserModel.find({ organization: organizationId }).select('_id');
  const userIds = orgUsers.map(user => user._id);
  
  const [patientCount, userCount, appointmentCount] = await Promise.all([
    // Monthly patient count (created this month)
    PatientModel.countDocuments({ 
      organization: organizationId,
      createdAt: {
        $gte: startOfMonth,
        $lt: startOfNextMonth
      }
    }),
    // Total users (this remains total, not monthly)
    UserModel.countDocuments({ organization: organizationId }),
    // Monthly appointment count (created this month)
    AppointmentModel.countDocuments({ 
      doctor: { $in: userIds },
      createdAt: {
        $gte: startOfMonth,
        $lt: startOfNextMonth
      }
    })
  ]);

  return {
    patients: patientCount, // Monthly count
    users: userCount, // Total count (users don't reset monthly)
    appointments: appointmentCount, // Monthly count
    monthPeriod: {
      start: startOfMonth,
      end: startOfNextMonth,
      current: now
    },
    lastUpdated: new Date()
  };
}

/**
 * Update subscription usage counters
 */
export async function updateSubscriptionUsage(organizationId) {
  await dbConnect();
  
  const currentUsage = await getCurrentUsage(organizationId);
  
  await SubscriptionModel.findOneAndUpdate(
    { 
      organization: organizationId,
      status: { $in: ['active', 'trialing'] }
    },
    { usage: currentUsage },
    { new: true }
  );

  return currentUsage;
}

/**
 * Validate if an organization can perform an action based on subscription limits
 */
export async function validateSubscriptionLimit(organizationId, resource, action = 'create') {
  await dbConnect();

  // Check if this is an unlimited account first
  const organization = await OrganizationModel.findById(organizationId)
    .populate('subscription', 'status');
  
  // For unlimited accounts, allow unlimited access
  if (organization?.subscriptionType === 'unlimited') {
    return { 
      allowed: true, 
      currentUsage: await getCurrentUsage(organizationId), 
      limits: { maxPatients: -1, maxUsers: -1, maxAppointments: -1 },
      planName: 'Unlimited Account' 
    };
  }
  
  const isTrialAccount = organization?.subscription?.status === 'trial' || 
                        organization?.subscription?.status === 'trialing' ||
                        !organization?.subscription; // New accounts without subscription are also considered trial

  // For trial accounts, allow unlimited access
  if (isTrialAccount) {
    return { 
      allowed: true, 
      currentUsage: await getCurrentUsage(organizationId), 
      limits: { maxPatients: -1, maxUsers: -1, maxAppointments: -1 },
      planName: 'Trial Account' 
    };
  }

  // Get subscription with plan details for paid accounts
  const subscription = await SubscriptionModel.findOne({
    organization: organizationId,
    status: { $in: ['active', 'trialing'] }
  }).populate('plan');

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  if (!subscription.plan) {
    throw new Error('No subscription plan found');
  }

  const { features } = subscription.plan;
  
  // Get current real-time usage
  const currentUsage = await getCurrentUsage(organizationId);

  // Validate based on resource type
  switch (resource) {
    case 'patient':
      if (action === 'create' && features.maxPatients !== -1 && currentUsage.patients >= features.maxPatients) {
        const monthName = currentUsage.monthPeriod.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        throw new Error(`Monthly patient limit reached. Your ${subscription.plan.name} plan allows up to ${features.maxPatients} patients per month. You have created ${currentUsage.patients} patients in ${monthName}.`);
      }
      break;
      
    case 'user':
      if (action === 'create' && features.maxUsers !== -1 && currentUsage.users >= features.maxUsers) {
        throw new Error(`User limit reached. Your ${subscription.plan.name} plan allows up to ${features.maxUsers} users total.`);
      }
      break;
      
    case 'appointment':
      if (action === 'create' && features.maxAppointments !== -1 && currentUsage.appointments >= features.maxAppointments) {
        const monthName = currentUsage.monthPeriod.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        throw new Error(`Monthly appointment limit reached. Your ${subscription.plan.name} plan allows up to ${features.maxAppointments} appointments per month. You have created ${currentUsage.appointments} appointments in ${monthName}.`);
      }
      break;
      
    default:
      throw new Error(`Unknown resource type: ${resource}`);
  }

  return { 
    allowed: true, 
    currentUsage, 
    limits: features,
    planName: subscription.plan.name 
  };
}

/**
 * Check if a feature is available in the current subscription plan
 */
export async function validateFeatureAccess(organizationId, feature) {
  await dbConnect();

  // Check if this is an unlimited account first
  const organization = await OrganizationModel.findById(organizationId)
    .populate('subscription', 'status');
  
  // For unlimited accounts, allow access to all features
  if (organization?.subscriptionType === 'unlimited') {
    return true;
  }
  
  const isTrialAccount = organization?.subscription?.status === 'trial' || 
                        organization?.subscription?.status === 'trialing' ||
                        !organization?.subscription; // New accounts without subscription are also considered trial

  // For trial accounts, allow access to all features
  if (isTrialAccount) {
    return true;
  }

  const subscription = await SubscriptionModel.findOne({
    organization: organizationId,
    status: { $in: ['active', 'trialing'] }
  }).populate('plan');

  if (!subscription?.plan) {
    throw new Error('No active subscription found');
  }

  const { features } = subscription.plan;
  
  // Check feature availability
  switch (feature) {
    case 'customBranding':
      return features.customBranding === true;
    case 'apiAccess':
      return features.apiAccess === true;
    case 'prioritySupport':
      return features.prioritySupport === true;
    case 'advancedReports':
      return features.advancedReports === true;
    case 'smsNotifications':
      return features.smsNotifications === true;
    case 'emailNotifications':
      return features.emailNotifications === true;
    case 'dataBackup':
      return features.dataBackup === true;
    default:
      return false;
  }
}

/**
 * Get subscription plan details and usage for an organization
 */
export async function getSubscriptionDetails(organizationId) {
  await dbConnect();

  // Check if this is an unlimited account first
  const organization = await OrganizationModel.findById(organizationId)
    .populate('subscription', 'status');
  
  // For unlimited accounts, return unlimited access details
  if (organization?.subscriptionType === 'unlimited') {
    const currentUsage = await getCurrentUsage(organizationId);
    return {
      subscription: null,
      plan: {
        name: 'Unlimited Account',
        features: {
          maxPatients: -1,
          maxUsers: -1,
          maxAppointments: -1,
          customBranding: true,
          apiAccess: true,
          prioritySupport: true,
          advancedReports: true,
          smsNotifications: true,
          emailNotifications: true,
          dataBackup: true
        }
      },
      usage: currentUsage,
      limits: {
        maxPatients: -1,
        maxUsers: -1,
        maxAppointments: -1,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        advancedReports: true,
        smsNotifications: true,
        emailNotifications: true,
        dataBackup: true
      },
      isActive: true
    };
  }
  
  const isTrialAccount = organization?.subscription?.status === 'trial' || 
                        organization?.subscription?.status === 'trialing' ||
                        !organization?.subscription; // New accounts without subscription are also considered trial

  // For trial accounts, return trial subscription details
  if (isTrialAccount) {
    const currentUsage = await getCurrentUsage(organizationId);
    return {
      subscription: null,
      plan: {
        name: 'Trial Account',
        features: {
          maxPatients: -1,
          maxUsers: -1,
          maxAppointments: -1,
          customBranding: true,
          apiAccess: true,
          prioritySupport: true,
          advancedReports: true,
          smsNotifications: true,
          emailNotifications: true,
          dataBackup: true
        }
      },
      usage: currentUsage,
      limits: {
        maxPatients: -1,
        maxUsers: -1,
        maxAppointments: -1,
        customBranding: true,
        apiAccess: true,
        prioritySupport: true,
        advancedReports: true,
        smsNotifications: true,
        emailNotifications: true,
        dataBackup: true
      },
      isActive: true
    };
  }

  const subscription = await SubscriptionModel.findOne({
    organization: organizationId,
    status: { $in: ['active', 'trialing'] }
  }).populate('plan');

  if (!subscription) {
    return null;
  }

  const currentUsage = await getCurrentUsage(organizationId);

  return {
    subscription,
    plan: subscription.plan,
    usage: currentUsage,
    limits: subscription.plan?.features || {},
    isActive: subscription.status === 'active' || subscription.status === 'trialing'
  };
}

/**
 * Middleware function to check subscription limits
 */
export function createSubscriptionMiddleware(resource) {
  return async (organizationId, action = 'create') => {
    try {
      await validateSubscriptionLimit(organizationId, resource, action);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: 'SUBSCRIPTION_LIMIT_EXCEEDED'
      };
    }
  };
} 