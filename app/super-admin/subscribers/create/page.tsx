'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building, 
  Phone, 
  MapPin,
  Save,
  CreditCard,
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle
} from 'lucide-react';

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

// Function to get Stripe publishable key from database
async function getStripePublicKey() {
  try {
    const response = await fetch('/api/settings/payment-gateway?public=true');
    if (response.ok) {
      const data = await response.json();
      return data.publicKey || null;
    }
  } catch (error) {
    console.error('Failed to load Stripe credentials:', error);
  }
  return null;
}

// Function to initialize Stripe
async function initializeStripe() {
  if (!stripePromise) {
    const publicKey = await getStripePublicKey();
    if (publicKey && publicKey.trim()) {
      stripePromise = loadStripe(publicKey);
    } else {
      console.error('No Stripe public key found. Please configure payment gateway in super admin settings.');
    }
  }
  return stripePromise;
}

// Payment form component
function PaymentForm({ formData, setFormData, onPaymentSuccess, loading }: {
  formData: any;
  setFormData: any;
  onPaymentSuccess: (paymentMethodId: string) => void;
  loading: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState<string>('');
  const [cardComplete, setCardComplete] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : '');
    setCardComplete(event.complete);
  };

  const createPaymentMethod = async () => {
    if (!stripe || !elements) return null;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return null;

    setValidating(true);
    setCardError('');

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          line1: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: formData.country || 'US',
        },
      },
    });

    setValidating(false);

    if (error) {
      setCardError(error.message || 'Payment method creation failed');
      return null;
    }

    return paymentMethod;
  };

  // Show loading state if Stripe is not ready
  if (!stripe || !elements) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading payment system...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
          <CardElement
            onChange={handleCardChange}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  iconColor: '#666EE8',
                },
                invalid: {
                  color: '#fa755a',
                  iconColor: '#fa755a',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Your payment information is encrypted and secure
        </p>
      </div>
      
      {cardError && (
        <div className="flex items-start space-x-3 text-red-600 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment Error</p>
            <p>{cardError}</p>
          </div>
        </div>
      )}
      
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Card will be validated but not charged immediately. The subscriber can manage billing after account creation.
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={async () => {
          const paymentMethod = await createPaymentMethod();
          if (paymentMethod) {
            onPaymentSuccess(paymentMethod.id);
          }
        }}
        disabled={!cardComplete || validating || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        size="lg"
      >
        {validating ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Validating Payment Method...
          </div>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Validate Payment Method
          </>
        )}
      </Button>
    </div>
  );
}

// Main form component that uses Stripe Elements
function CreateSubscriberForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [paymentValidated, setPaymentValidated] = useState(false);

  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formData, setFormData] = useState({
    // Organization fields
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Subscription fields
    subscriptionType: 'trial', // 'trial' or 'plan'
    planId: '',
    billingCycle: 'monthly',
    trialDays: '14',
    paymentMethod: 'cash', // Only cash payment for super admin
  });

  useEffect(() => {
    // Wait for session to load before making any decisions
    if (status === 'loading') return;
    
    // Only redirect if session is loaded and user is not super admin
    if (status === 'unauthenticated' || (session && session.user?.role !== 'super_admin')) {
      router.push('/login');
      return;
    }

    // If we get here, user is authenticated as super admin
    if (session?.user?.role === 'super_admin') {
      fetchPlans();
    }
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailError('');
      return;
    }

    setEmailCheckLoading(true);
    setEmailError('');

    try {
      // Check organization email
      const orgResponse = await fetch(`/api/organizations?email=${encodeURIComponent(email)}`);
      const userData = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        if (orgData.exists) {
          setEmailError('This email is already used by another organization');
          return;
        }
      }

      if (userData.ok) {
        const userCheck = await userData.json();
        if (userCheck.exists) {
          setEmailError('This email is already used by another user');
          return;
        }
      }

      setEmailError('');
    } catch (error) {
      console.error('Error checking email availability:', error);
      setEmailError('');
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If switching to trial, clear planId
      if (name === 'subscriptionType' && value === 'trial') {
        newData.planId = '';
      }
      
      return newData;
    });

    // Check email availability when email changes
    if (name === 'email') {
      setEmailError('');
      // Debounce email checking
      setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
    }
  };

  const handlePaymentSuccess = (paymentMethodId: string) => {
    setPaymentMethodId(paymentMethodId);
    setPaymentValidated(true);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation for paid plan
      if (formData.subscriptionType === 'plan' && !formData.planId) {
        alert('Please select a subscription plan');
        setLoading(false);
        return;
      }

      // Create organization with owner account
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          // Owner details (using subscriber info)
          ownerName: formData.name,
          ownerEmail: formData.email,
          ownerPassword: formData.password,
          ownerPhone: formData.phone,
          // Subscription intent - tells API to skip email if paid subscription will be created
          subscriptionType: formData.subscriptionType,
          skipWelcomeEmail: formData.subscriptionType === 'plan', // Skip email for paid plans, send for trials and unlimited
        }),
      });

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json();
        if (errorData.error && errorData.error.includes('already exists')) {
          throw new Error(`${errorData.error}. Please use a different email address or check if the subscriber already exists.`);
        }
        throw new Error(errorData.error || 'Failed to create organization');
      }

      const orgData = await orgResponse.json();

      // SIMPLIFIED FLOW: Handle subscription creation
      if (formData.subscriptionType === 'plan' && formData.planId) {
        // CASH PAYMENT: Create active subscription directly
        const subscriptionResponse = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: orgData.organization._id,
            planId: formData.planId,
            billingCycle: formData.billingCycle,
            paymentMethod: 'cash',
          }),
        });

        if (!subscriptionResponse.ok) {
          const errorData = await subscriptionResponse.json();
          console.error('Failed to create subscription:', errorData);
          throw new Error(`Failed to create subscription: ${errorData.error || errorData.details || 'Unknown error'}`);
        }

        const subscriptionData = await subscriptionResponse.json();
        console.log('✅ Subscription created successfully:', subscriptionData);

        // Redirect to subscribers list with success message
        router.push('/super-admin/subscribers?success=Subscriber created successfully with cash payment');
      } else if (formData.subscriptionType === 'trial') {
        // TRIAL ONLY: Create trial subscription
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + parseInt(formData.trialDays));

        const trialSubscriptionResponse = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: orgData.organization._id,
            planId: null, // No plan for trial-only
            billingCycle: 'monthly', // Default
            trialDays: parseInt(formData.trialDays),
            amount: 0, // Free trial
            paymentMethod: 'manual', // Trial doesn't require payment method
          }),
        });

        if (!trialSubscriptionResponse.ok) {
          const errorData = await trialSubscriptionResponse.json();
          console.error('Failed to create trial subscription:', errorData);
          throw new Error(`Failed to create trial subscription: ${errorData.error || errorData.details || 'Unknown error'}`);
        }

        const trialSubscriptionData = await trialSubscriptionResponse.json();
        console.log('✅ Trial subscription created successfully:', trialSubscriptionData);

        // Redirect to subscribers list with success message
        router.push('/super-admin/subscribers?success=Trial subscriber created successfully');
      } else if (formData.subscriptionType === 'unlimited') {
        // UNLIMITED SUBSCRIBER: Create organization but no subscription 
        // The organization will be marked as unlimited and get full access without subscription
        
        // Update organization to mark as unlimited
        const updateOrgResponse = await fetch(`/api/organizations/${orgData.organization._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionType: 'unlimited', // Special flag for unlimited accounts
          }),
        });

        if (!updateOrgResponse.ok) {
          const errorData = await updateOrgResponse.json();
          console.error('Failed to update organization for unlimited access:', errorData);
          throw new Error(`Failed to set unlimited access: ${errorData.error || errorData.details || 'Unknown error'}`);
        }

        console.log('✅ Unlimited subscriber created successfully');

        // Redirect to subscribers list with success message
        router.push('/super-admin/subscribers?success=Unlimited subscriber created successfully');
      }
    } catch (error) {
      console.error('Error creating subscriber:', error);
      alert(`Failed to create subscriber: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = formData.subscriptionType === 'plan' && formData.planId 
    ? plans.find(plan => plan._id === formData.planId)
    : null;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button 
            onClick={() => router.push('/super-admin/subscribers')}
            variant="outline"
            size="sm"
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subscribers
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Add New Subscriber
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new subscriber to the platform
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Subscriber Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Doctor Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter subscriber's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter subscriber's email address"
                    required
                      className={emailError ? 'border-red-500 dark:border-red-400' : ''}
                    />
                    {emailCheckLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {emailError}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This email will be used for both the organization and the login account. It must be unique.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password for subscriber"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This will be the subscriber's login password
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Practice Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter practice address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code
                    </label>
                    <Input
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <Input
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <CreditCard className="h-5 w-5" />
                  Subscription Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Subscription Type *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <input
                        type="radio"
                        name="subscriptionType"
                        value="trial"
                        checked={formData.subscriptionType === 'trial'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Trial Only</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Free trial period, no payment required. User can choose a plan after trial ends.
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <input
                        type="radio"
                        name="subscriptionType"
                        value="plan"
                        checked={formData.subscriptionType === 'plan'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Paid Plan</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Direct subscription to a paid plan, no trial period.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <input
                        type="radio"
                        name="subscriptionType"
                        value="unlimited"
                        checked={formData.subscriptionType === 'unlimited'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div className="w-5 h-5 mr-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Unlimited Subscriber</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Full access to all features forever, no subscription required. Perfect for VIP clients.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.subscriptionType === 'trial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trial Period (Days)
                    </label>
                    <Input
                      name="trialDays"
                      type="number"
                      min="1"
                      max="90"
                      value={formData.trialDays}
                      onChange={handleInputChange}
                      placeholder="Enter trial days"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Number of free trial days (1-90). After trial ends, user must choose a plan to continue.
                    </p>
                  </div>
                )}

                {formData.subscriptionType === 'plan' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subscription Plan *
                      </label>
                      <select
                        name="planId"
                        value={formData.planId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        required={formData.subscriptionType === 'plan'}
                      >
                        <option value="">Select a plan</option>
                        {plans.map((plan) => (
                          <option key={plan._id} value={plan._id}>
                            {plan.name} - ${plan.monthlyPrice}/month
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Select a subscription plan for immediate activation
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Billing Cycle
                      </label>
                      <select
                        name="billingCycle"
                        value={formData.billingCycle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Payment Method *
                      </label>
                      <div className="max-w-md">
                        <label className="flex items-center p-4 border-2 border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={true}
                            readOnly={true}
                            className="mr-3"
                          />
                          <DollarSign className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">Cash Payment</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Offline payment confirmed by super admin
                            </div>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Cash payment will be processed offline. Subscriber can upgrade to card payments from their dashboard.
                      </p>
                    </div>



                    {selectedPlan && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Selected Plan: {selectedPlan.name}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <p>Monthly: ${selectedPlan.monthlyPrice}</p>
                          <p>Yearly: ${selectedPlan.yearlyPrice}</p>
                          <p>Billing Cycle: {formData.billingCycle}</p>
                          <p>Payment Method: Cash Payment</p>
                          <p className="text-green-600 dark:text-green-400 font-medium">
                            💰 This will create an active subscription with offline payment confirmation.
                          </p>
                          {selectedPlan.features && (
                            <div className="mt-2">
                              <p className="font-medium">Monthly Limits:</p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                {selectedPlan.features.maxPatients !== undefined && (
                                  <li>Max Patients: {selectedPlan.features.maxPatients === -1 ? 'Unlimited per month' : `${selectedPlan.features.maxPatients} per month`}</li>
                                )}
                                {selectedPlan.features.maxAppointments !== undefined && (
                                  <li>Max Appointments: {selectedPlan.features.maxAppointments === -1 ? 'Unlimited per month' : `${selectedPlan.features.maxAppointments} per month`}</li>
                                )}
                              </ul>
                              <p className="text-xs text-gray-500 mt-1">All plans have same features - limits reset monthly</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Ready to add this subscriber?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.subscriptionType === 'trial' 
                      ? `This will create a ${formData.trialDays}-day trial account. Subscriber can upgrade to paid plans from their dashboard.`
                      : formData.subscriptionType === 'unlimited'
                      ? 'This will create an unlimited access account with full features forever, no subscription required.'
                      : 'This will create an active subscription with offline payment confirmation. Subscriber can manage payments from their dashboard.'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/super-admin/subscribers')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !!emailError || emailCheckLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Subscriber...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add Subscriber
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </SuperAdminLayout>
  );
}

// Wrapper component with Stripe Elements
export default function CreateSubscriberPage() {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripe = await initializeStripe();
        setStripePromise(Promise.resolve(stripe));
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        // Set a rejected promise to handle the error
        setStripePromise(Promise.reject(error));
      }
    };
    initStripe();
  }, []);

  if (!stripePromise) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading payment system...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CreateSubscriberForm />
    </Elements>
  );
} 