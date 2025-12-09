import Stripe from 'stripe';
import dbConnect from './dbConnect';
import PaymentGatewaySettings from '../models/PaymentGatewaySettings';

// Cache for Stripe instance to avoid reconnection
let stripeInstance = null;
let lastCredentialsCheck = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get Stripe credentials from database or environment
async function getStripeCredentials() {
  try {
    await dbConnect();
    
    const settings = await PaymentGatewaySettings.findOne({ global: true });
    
    if (settings) {
      const credentials = settings.mode === 'live' ? settings.live : settings.test;
      
      return {
        secretKey: credentials.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
        publicKey: credentials.stripePublicKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: credentials.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
        mode: settings.mode
      };
    }
  } catch (error) {
    console.warn('Failed to load Stripe credentials from database, using environment variables:', error.message);
  }
  
  // Fallback to environment variables
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key',
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy_secret',
    mode: 'test'
  };
}

// Function to get or create Stripe instance
async function getStripeInstance() {
  const now = Date.now();
  
  // Return cached instance if still valid
  if (stripeInstance && (now - lastCredentialsCheck) < CACHE_DURATION) {
    return stripeInstance;
  }
  
  // Get fresh credentials and create new instance
  const credentials = await getStripeCredentials();
  
  stripeInstance = new Stripe(credentials.secretKey, {
    apiVersion: '2023-10-16',
  });
  
  lastCredentialsCheck = now;
  
  console.log(`Stripe initialized with ${credentials.mode} mode credentials`);
  
  return stripeInstance;
}

// Initialize default Stripe instance (for backward compatibility)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
  apiVersion: '2023-10-16',
});

// Export the default instance and the dynamic getter
export default stripe;
export { getStripeInstance };

// Utility functions for Stripe operations
export const createCustomer = async (customerData) => {
  try {
    const stripeClient = await getStripeInstance();
    const customer = await stripeClient.customers.create(customerData);
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

export const createPaymentIntent = async (amount, currency = 'usd', customerId, metadata = {}) => {
  try {
    const stripeClient = await getStripeInstance();
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata: {
        source: 'doctorcare_payment',
        ...metadata
      }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const createStripeCustomer = async (organization) => {
  try {
    const stripeClient = await getStripeInstance();
    const customer = await stripeClient.customers.create({
      email: organization.email,
      name: organization.name,
      metadata: {
        organizationId: organization._id.toString(),
        source: 'doctorcare_subscription'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

export const createStripeSubscription = async (customerId, priceId, trialDays = 0) => {
  try {
    const stripeClient = await getStripeInstance();
    const subscriptionData = {
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    };
    
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }
    
    const subscription = await stripeClient.subscriptions.create(subscriptionData);
    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
};

// Webhook signature verification
export const verifyWebhookSignature = async (body, signature) => {
  try {
    const credentials = await getStripeCredentials();
    const stripeClient = await getStripeInstance();
    
    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      credentials.webhookSecret
    );
    
    return { success: true, event };
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return { success: false, error: error.message };
  }
};

// Utility object for easier access
export const stripeUtils = {
  createCustomer: async (data) => {
    try {
      const stripeClient = await getStripeInstance();
      const customer = await stripeClient.customers.create(data);
      return { success: true, customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: error.message };
    }
  },

  createPaymentMethod: async ({ customerId, paymentMethodData }) => {
    try {
      const stripeClient = await getStripeInstance();
      
      // Parse expiry date (MM/YY format)
      const [expMonth, expYear] = paymentMethodData.expiryDate.split('/');
      
      // Check if this is the Stripe test card
      const testCardNumber = paymentMethodData.cardNumber.replace(/\s/g, '');
      if (testCardNumber === '4242424242424242') {
        // For test card, try to create a test payment method token first
        console.log('🧪 Using Stripe test card - creating payment method...');
      }
      
      const paymentMethod = await stripeClient.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentMethodData.cardNumber.replace(/\s/g, ''), // Remove spaces
          exp_month: parseInt(expMonth),
          exp_year: parseInt(`20${expYear}`), // Convert YY to YYYY
          cvc: paymentMethodData.cvv,
        },
      });
      
      await stripeClient.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      return { success: true, paymentMethod };
    } catch (error) {
      console.error('Error creating payment method:', error);
      
      // Provide specific guidance for raw card data error
      if (error.message.includes('Sending credit card numbers directly to the Stripe API is generally unsafe')) {
        return { 
          success: false, 
          error: 'Raw card data API not enabled. Please enable it in your Stripe Dashboard under Settings > API Settings > Raw card data APIs, or use test card 4242 4242 4242 4242 for testing.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  },

  createSubscription: async ({ customerId, priceId, trialPeriodDays = 0 }) => {
    try {
      const stripeClient = await getStripeInstance();
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
      };
      
      if (trialPeriodDays > 0) {
        subscriptionData.trial_period_days = trialPeriodDays;
      }
      
      const subscription = await stripeClient.subscriptions.create(subscriptionData);
      return { success: true, subscription };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  },

  createProduct: async ({ name, description }) => {
    try {
      const stripeClient = await getStripeInstance();
      const product = await stripeClient.products.create({
        name,
        description,
      });
      return { success: true, product };
    } catch (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }
  },

  createPrice: async ({ productId, amount, currency = 'usd', interval = 'month' }) => {
    try {
      const stripeClient = await getStripeInstance();
      const price = await stripeClient.prices.create({
        product: productId,
        unit_amount: Math.round(amount * 100),
        currency,
        recurring: { interval },
      });
      return { success: true, price };
    } catch (error) {
      console.error('Error creating price:', error);
      return { success: false, error: error.message };
    }
  },

  verifyWebhookSignature: async (body, signature, webhookSecret) => {
    try {
      const stripeClient = await getStripeInstance();
      const event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
      return { success: true, event };
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return { success: false, error: error.message };
    }
  },

  getCustomerInvoices: async (customerId, limit = 10) => {
    try {
      const stripeClient = await getStripeInstance();
      const invoices = await stripeClient.invoices.list({
        customer: customerId,
        limit,
        status: 'paid'
      });
      return { success: true, invoices: invoices.data };
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      return { success: false, error: error.message };
    }
  },

  updateSubscription: async (subscriptionId, updateData) => {
    try {
      const stripeClient = await getStripeInstance();
      const subscription = await stripeClient.subscriptions.update(subscriptionId, updateData);
      return { success: true, subscription };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  },

  createBillingPortalSession: async (customerId, returnUrl) => {
    try {
      const stripeClient = await getStripeInstance();
      const session = await stripeClient.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      return { success: true, session };
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      return { success: false, error: error.message };
    }
  }
}; 