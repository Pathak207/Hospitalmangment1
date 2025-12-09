import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Subscription from '@/models/Subscription';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import { stripeUtils } from '@/lib/stripe';
import { emailService } from '@/lib/email';

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { personalInfo, organizationInfo, subscriptionInfo, paymentInfo } = body;
    


    // Validate required fields
    if (!personalInfo?.email || !personalInfo?.password || !personalInfo?.firstName || !personalInfo?.lastName) {
      console.log('❌ VALIDATION FAILED: Missing personal info', {
        email: !!personalInfo?.email,
        password: !!personalInfo?.password,
        firstName: !!personalInfo?.firstName,
        lastName: !!personalInfo?.lastName
      });
      return NextResponse.json(
        { error: 'Missing required personal information' },
        { status: 400 }
      );
    }

    if (!organizationInfo?.name || !organizationInfo?.address) {
      console.log('❌ VALIDATION FAILED: Missing organization info', {
        name: !!organizationInfo?.name,
        address: !!organizationInfo?.address
      });
      return NextResponse.json(
        { error: 'Missing required organization information' },
        { status: 400 }
      );
    }

    if (!subscriptionInfo?.planId && !subscriptionInfo?.isTrialOnly) {
      console.log('❌ VALIDATION FAILED: Missing subscription info', {
        planId: subscriptionInfo?.planId,
        isTrialOnly: subscriptionInfo?.isTrialOnly
      });
      return NextResponse.json(
        { error: 'Missing subscription plan information' },
        { status: 400 }
      );
    }

    // Validate payment info for paid subscriptions
    if (!subscriptionInfo.isTrialOnly && (!paymentInfo?.cardNumber || !paymentInfo?.expiryDate || !paymentInfo?.cvv || !paymentInfo?.cardholderName)) {
      console.log('❌ VALIDATION FAILED: Missing payment info for paid subscription', {
        cardNumber: !!paymentInfo?.cardNumber,
        expiryDate: !!paymentInfo?.expiryDate,
        cvv: !!paymentInfo?.cvv,
        cardholderName: !!paymentInfo?.cardholderName,
        isTrialOnly: subscriptionInfo.isTrialOnly
      });
      return NextResponse.json(
        { error: 'Missing required payment information for paid subscription' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: personalInfo.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check if organization name already exists
    const existingOrg = await Organization.findOne({ name: organizationInfo.name });
    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists' },
        { status: 400 }
      );
    }

    // Get the subscription plan (only for non-trial subscriptions)
    let plan = null;
    if (!subscriptionInfo.isTrialOnly) {
      plan = await SubscriptionPlan.findById(subscriptionInfo.planId);
      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid subscription plan' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(personalInfo.password, 12);

    // Create organization
    const organization = await Organization.create({
      name: organizationInfo.name,
      email: personalInfo.email,
      phone: personalInfo.phone || '',
      address: organizationInfo.address,
      timezone: 'UTC',
      currency: 'USD',
      isActive: true,
      branding: {
        appName: organizationInfo.name,
        appTagline: 'Healthcare Management',
        logoText: organizationInfo.name.substring(0, 2).toUpperCase(),
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF'
      }
    });

    // Create admin user
    const user = await User.create({
      name: `${personalInfo.firstName} ${personalInfo.lastName}`,
      email: personalInfo.email,
      password: hashedPassword,
      role: 'doctor', // Default role for organization owner
      organization: organization._id,
      phone: personalInfo.phone || '',
      isActive: true
    });

    // Update organization with owner reference
    organization.owner = user._id;
    await organization.save();

    // Calculate subscription dates
    const startDate = new Date();
    let endDate = new Date();
    let trialEndDate = null;
    let stripeCustomerId = null;
    let stripeSubscriptionId = null;

    if (subscriptionInfo.isTrialOnly) {
      // Trial only - set end date to trial period
      endDate.setDate(startDate.getDate() + (subscriptionInfo.trialPeriod || 14));
      trialEndDate = new Date(endDate);
    } else {
      // Paid subscription with trial - integrate with Stripe
      trialEndDate = new Date();
      trialEndDate.setDate(startDate.getDate() + 14); // 14-day trial
      
      if (subscriptionInfo.billingCycle === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
      } else {
        endDate.setMonth(startDate.getMonth() + 1);
      }

      // Create Stripe customer
      const customerResult = await stripeUtils.createCustomer({
        email: personalInfo.email,
        name: `${personalInfo.firstName} ${personalInfo.lastName}`,
        phone: personalInfo.phone,
        address: {
          line1: organizationInfo.address.street,
          city: organizationInfo.address.city,
          state: organizationInfo.address.state,
          postal_code: organizationInfo.address.zipCode,
          country: organizationInfo.address.country || 'US'
        }
      });

      if (!customerResult.success) {
        throw new Error(`Failed to create Stripe customer: ${customerResult.error}`);
      }

      stripeCustomerId = customerResult.customer.id;

      // Create payment method and attach to customer
      const paymentMethodResult = await stripeUtils.createPaymentMethod({
        customerId: stripeCustomerId,
        paymentMethodData: paymentInfo
      });

      if (!paymentMethodResult.success) {
        throw new Error(`Failed to create payment method: ${paymentMethodResult.error}`);
      }

      // Create Stripe subscription
      const subscriptionResult = await stripeUtils.createSubscription({
        customerId: stripeCustomerId,
        priceId: subscriptionInfo.billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly,
        trialPeriodDays: 14
      });

      if (!subscriptionResult.success) {
        throw new Error(`Failed to create Stripe subscription: ${subscriptionResult.error}`);
      }

      stripeSubscriptionId = subscriptionResult.subscription.id;
    }

    // Determine subscription amount
    const amount = subscriptionInfo.isTrialOnly ? 0 : 
      (subscriptionInfo.billingCycle === 'yearly' 
        ? plan.yearlyPrice 
        : plan.monthlyPrice);

    // Create subscription
    const subscription = await Subscription.create({
      organization: organization._id,
      plan: plan?._id || null,
      status: subscriptionInfo.isTrialOnly ? 'trialing' : 'trialing', // Start with trial even for paid plans
      billingCycle: subscriptionInfo.billingCycle || 'monthly',
      amount: subscriptionInfo.isTrialOnly ? 0 : amount,
      currency: 'USD',
      startDate,
      endDate,
      trialEndDate,
      paymentMethod: subscriptionInfo.isTrialOnly ? 'manual' : 'stripe',
      autoRenew: !subscriptionInfo.isTrialOnly,
      stripeCustomerId,
      stripeSubscriptionId,
      usage: {
        patients: 0,
        users: 1, // Count the admin user
        appointments: 0,
        lastUpdated: new Date()
      },
      notes: subscriptionInfo.isTrialOnly ? 'Trial subscription' : 'New paid subscription with Stripe integration',
      createdBy: user._id
    });

    // Update organization with subscription reference
    organization.subscription = subscription._id;
    // Save Stripe customer ID to organization
    if (stripeCustomerId) {
      organization.stripeCustomerId = stripeCustomerId;
    }
    await organization.save();

    // Send welcome email
    try {
      const userData = {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email
      };
      
      const organizationData = {
        name: organization.name
      };
      
      const subscriptionData = {
        isTrialOnly: subscriptionInfo.isTrialOnly,
        trialEndDate,
        planName: plan?.name || 'Trial',
        planDescription: plan?.description || '',
        billingCycle: subscriptionInfo.billingCycle || 'monthly',
        amount: subscriptionInfo.isTrialOnly ? 0 : amount,
        planFeatures: plan?.features || null
      };

      await emailService.sendWelcomeEmail(userData, organizationData, subscriptionData);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: user._id,
        organizationId: organization._id,
        subscriptionId: subscription._id,
        trialEndDate,
        isTrialOnly: subscriptionInfo.isTrialOnly,
        stripeCustomerId,
        stripeSubscriptionId
      }
    });

  } catch (error) {
    console.error('🚨 SIGNUP ERROR:', error);
    console.error('🚨 ERROR STACK:', error.stack);
    console.error('🚨 ERROR MESSAGE:', error.message);
    console.error('🚨 ERROR CODE:', error.code);
    console.error('🚨 ERROR NAME:', error.name);
    
    // Return appropriate error message
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      console.error('🚨 DUPLICATE KEY ERROR:', field);
      return NextResponse.json(
        { error: `An account with this ${field} already exists` },
        { status: 400 }
      );
    }

    // Handle Stripe-specific errors
    if (error.message.includes('Stripe')) {
      console.error('🚨 STRIPE ERROR:', error.message);
      return NextResponse.json(
        { error: 'Payment processing failed. Please check your payment information and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
} 