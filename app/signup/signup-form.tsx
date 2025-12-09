'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  ArrowRight, 
  Check, 
  User, 
  Mail, 
  Lock, 
  Building, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  ArrowLeft,
  Loader,
  Clock,
  CheckCircle,
  DollarSign,
  Zap
} from 'lucide-react';

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatAmount } = useGlobalCurrency();

  type SubscriptionPlan = {
    _id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description?: string;
    features?: {
      maxPatients?: number;
      maxUsers?: number;
      customBranding?: boolean;
      prioritySupport?: boolean;
    };
  };

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscriptionChoice, setSubscriptionChoice] = useState<'trial' | 'plan' | ''>('');
  const [stripeSettings, setStripeSettings] = useState<{ publicKey: string | null; mode: 'test' | 'live' }>({ publicKey: null, mode: 'test' });
  const [emailCheckLoading, setEmailCheckLoading] = useState<boolean>(false);
  const [organizationCheckLoading, setOrganizationCheckLoading] = useState<boolean>(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{ email: boolean | null; organization: boolean | null }>({ email: null, organization: null });

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Organization Information
    organizationName: '',
    organizationType: 'family-practice',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    
    // Trial Settings
    trialPeriod: 14,
    
    // Payment Information (for paid plans)
    paymentMethod: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load subscription plans
        const plansResponse = await fetch('/api/subscription-plans?public=true');
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setSubscriptionPlans(plansData.plans || []);
        }

        // Load Stripe settings (public key and mode)
        const stripeResponse = await fetch('/api/settings/payment-gateway?public=true');
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          setStripeSettings({
            publicKey: stripeData.publicKey,
            mode: stripeData.mode || 'test'
          });
          console.log(`🔄 Stripe initialized in ${stripeData.mode} mode`);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Email availability check
  const checkEmailAvailability = async (email) => {
    if (!email || !email.includes('@')) return;
    
    setEmailCheckLoading(true);
    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailabilityStatus(prev => ({ ...prev, email: data.available }));
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      setAvailabilityStatus(prev => ({ ...prev, email: null }));
    }
    setEmailCheckLoading(false);
  };

  // Organization name availability check
  const checkOrganizationAvailability = async (name) => {
    if (!name || name.trim().length < 2) return;
    
    setOrganizationCheckLoading(true);
    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'organization', value: name.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailabilityStatus(prev => ({ ...prev, organization: data.available }));
      }
    } catch (error) {
      console.error('Error checking organization availability:', error);
      setAvailabilityStatus(prev => ({ ...prev, organization: null }));
    }
    setOrganizationCheckLoading(false);
  };

  // Debounced availability checks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.organizationName) {
        checkOrganizationAvailability(formData.organizationName);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.organizationName]);

  // Navigation functions
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToLandingPage = () => {
    router.push('/');
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply MM/YY formatting
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.substring(0, 2)}/${digits.substring(2)}`;
    } else {
      // Limit to 4 digits total (MMYY)
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for expiry date formatting
    let processedValue = value;
    if (name === 'paymentMethod.expiryDate') {
      processedValue = formatExpiryDate(value);
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: processedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Account Information - minimal required fields
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      // Practice Information - minimal required fields
      if (!formData.organizationName.trim()) newErrors.organizationName = 'Practice name is required';
      if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    }

    if (step === 2 && subscriptionChoice === 'plan') {
      if (!selectedPlan) newErrors.selectedPlan = 'Please select a subscription plan';
      if (!formData.paymentMethod.cardNumber.trim()) newErrors['paymentMethod.cardNumber'] = 'Card number is required';
      if (!formData.paymentMethod.expiryDate.trim()) newErrors['paymentMethod.expiryDate'] = 'Expiry date is required';
      if (!formData.paymentMethod.cvv.trim()) newErrors['paymentMethod.cvv'] = 'CVV is required';
      if (!formData.paymentMethod.cardholderName.trim()) newErrors['paymentMethod.cardholderName'] = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (subscriptionChoice === 'plan' && !validateStep(currentStep)) return;

    setLoading(true);
    try {
      const signupData = {
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || '' // Optional, can be empty
        },
        organizationInfo: {
          name: formData.organizationName,
          type: formData.organizationType || 'family-practice', // Default value
          address: {
            street: formData.address.street || 'To be updated', // Default placeholder
            city: formData.address.city,
            state: formData.address.state || 'To be updated', // Default placeholder
            zipCode: formData.address.zipCode || '00000', // Default placeholder
            country: formData.address.country || 'US'
          }
        },
        subscriptionInfo: {
          planId: subscriptionChoice === 'trial' ? subscriptionPlans[0]?._id : selectedPlan?._id,
          billingCycle,
          trialPeriod: formData.trialPeriod,
          isTrialOnly: subscriptionChoice === 'trial'
        },
        paymentInfo: subscriptionChoice === 'trial' ? null : formData.paymentMethod
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      });

      if (response.ok) {
        const data = await response.json();
        router.push('/signup/success');
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Account Setup', description: 'Create account & practice info' },
    { number: 2, title: 'Choose Plan', description: 'Trial or subscription' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-6 ${
                    currentStep > step.number ? 'bg-primary-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Step 1: Combined Account & Organization Information */}
          {currentStep === 1 && (
            <div>
              {/* Back Button */}
              <button
                onClick={goToLandingPage}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
              <p className="text-gray-600 mb-8">Just the essentials to get started. You can add more details later.</p>
              
              {/* Account Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.email ? 'border-red-500' : 
                          availabilityStatus.email === false ? 'border-red-500' :
                          availabilityStatus.email === true ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                      {/* Availability indicator */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailCheckLoading && (
                          <Loader className="h-4 w-4 text-gray-400 animate-spin" />
                        )}
                        {!emailCheckLoading && availabilityStatus.email === true && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!emailCheckLoading && availabilityStatus.email === false && (
                          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    {!errors.email && availabilityStatus.email === false && (
                      <p className="text-red-500 text-sm mt-1">This email is already registered</p>
                    )}
                    {!errors.email && availabilityStatus.email === true && (
                      <p className="text-green-600 text-sm mt-1">Email is available</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Create a password (min 8 characters)"
                      />
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Practice Information Section */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Practice Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Practice Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.organizationName ? 'border-red-500' : 
                          availabilityStatus.organization === false ? 'border-red-500' :
                          availabilityStatus.organization === true ? 'border-green-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your practice name"
                      />
                      {/* Availability indicator */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {organizationCheckLoading && (
                          <Loader className="h-4 w-4 text-gray-400 animate-spin" />
                        )}
                        {!organizationCheckLoading && availabilityStatus.organization === true && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!organizationCheckLoading && availabilityStatus.organization === false && (
                          <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
                    {!errors.organizationName && availabilityStatus.organization === false && (
                      <p className="text-red-500 text-sm mt-1">This practice name is already taken</p>
                    )}
                    {!errors.organizationName && availabilityStatus.organization === true && (
                      <p className="text-green-600 text-sm mt-1">Practice name is available</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your city"
                    />
                    {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center"
                >
                  Continue to Plan Selection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Plan (Final Step) */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
              
              {/* Plan Choice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Trial Option */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    subscriptionChoice === 'trial' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSubscriptionChoice('trial')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Free Trial</h3>
                        <p className="text-gray-600">14 days free</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      subscriptionChoice === 'trial' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {subscriptionChoice === 'trial' && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    Try DoctorCare free for 14 days with full access to all features. No payment required to start.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Full feature access
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      No credit card required
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Choose plan after trial
                    </li>
                  </ul>
                </div>

                {/* Paid Plan Option */}
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    subscriptionChoice === 'plan' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSubscriptionChoice('plan')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Zap className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Paid Plan</h3>
                        <p className="text-gray-600">Immediate access</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      subscriptionChoice === 'plan' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {subscriptionChoice === 'plan' && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    Start with a paid subscription for immediate access with no limitations.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Immediate activation
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Full feature access
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Priority support
                    </li>
                  </ul>
                </div>
              </div>

              {/* Plan Selection for Paid Plans */}
              {subscriptionChoice === 'plan' && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Your Subscription Plan</h3>
                  
                  {/* Billing Cycle Toggle */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingCycle === 'monthly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          billingCycle === 'yearly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Yearly <span className="text-green-600 font-semibold">(Save 20%)</span>
                      </button>
                    </div>
                  </div>

                  {/* Plan Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptionPlans.map((plan) => (
                      <div
                        key={plan._id}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPlan?._id === plan._id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="text-center">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h4>
                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">
                              {formatAmount(billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice)}
                            </span>
                            <span className="text-gray-600">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                          
                          <ul className="text-left space-y-2 text-sm">
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-gray-900 dark:text-gray-100">
                                {plan.features?.maxPatients === -1 ? 'Unlimited' : plan.features?.maxPatients} patients
                              </span>
                            </li>
                            <li className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-gray-900 dark:text-gray-100">
                                {plan.features?.maxUsers === -1 ? 'Unlimited' : plan.features?.maxUsers} users
                              </span>
                            </li>
                            {plan.features?.customBranding && (
                              <li className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                <span className="text-gray-900 dark:text-gray-100">
                                  Custom branding
                                </span>
                              </li>
                            )}
                            {plan.features?.prioritySupport && (
                              <li className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                <span className="text-gray-900 dark:text-gray-100">
                                  Priority support
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.selectedPlan && <p className="text-red-500 text-sm mt-2">{errors.selectedPlan}</p>}
                </div>
              )}

              {/* Payment Information for Paid Plans */}
              {subscriptionChoice === 'plan' && selectedPlan && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </h3>
                  
                  {/* Stripe Mode Indicator - Only show for test mode */}
                  {stripeSettings.mode === 'test' && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-blue-100 text-blue-800">
                      🧪 Test Mode • Test payments only
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        name="paymentMethod.cardholderName"
                        value={formData.paymentMethod.cardholderName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors['paymentMethod.cardholderName'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter cardholder name"
                      />
                      {errors['paymentMethod.cardholderName'] && <p className="text-red-500 text-sm mt-1">{errors['paymentMethod.cardholderName']}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="paymentMethod.cardNumber"
                        value={formData.paymentMethod.cardNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors['paymentMethod.cardNumber'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="4242 4242 4242 4242"
                      />
                      {stripeSettings.mode === 'test' && (
                        <p className="text-xs text-blue-600 mt-1">
                          💳 Test Card: 4242 4242 4242 4242 • Any future date • Any 3-digit CVC
                        </p>
                      )}
                      {errors['paymentMethod.cardNumber'] && <p className="text-red-500 text-sm mt-1">{errors['paymentMethod.cardNumber']}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="paymentMethod.expiryDate"
                        value={formData.paymentMethod.expiryDate}
                        onChange={handleInputChange}
                        maxLength={5}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors['paymentMethod.expiryDate'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="MM/YY"
                      />
                      {errors['paymentMethod.expiryDate'] && <p className="text-red-500 text-sm mt-1">{errors['paymentMethod.expiryDate']}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV *
                      </label>
                      <input
                        type="text"
                        name="paymentMethod.cvv"
                        value={formData.paymentMethod.cvv}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors['paymentMethod.cvv'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123"
                      />
                      {errors['paymentMethod.cvv'] && <p className="text-red-500 text-sm mt-1">{errors['paymentMethod.cvv']}</p>}
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={goToLandingPage}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !subscriptionChoice}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      {subscriptionChoice === 'trial' ? 'Start Free Trial' : 'Complete Subscription'}
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 