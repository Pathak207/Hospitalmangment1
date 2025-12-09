'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { CreditCard, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// We'll initialize stripePromise dynamically
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

function CheckoutForm({ plan, billingCycle, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements) {
      setError('Payment system not properly initialized. Please contact support.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan._id,
          billingCycle,
          organizationId: (session?.user as any)?.organization || '',
        }),
      });

      const paymentData = await response.json();

      if (paymentData.error) {
        setError(paymentData.error || 'Payment failed');
        setLoading(false);
        return;
      }

      if (!paymentData.clientSecret) {
        setError('Payment system not properly configured. Please contact support.');
        setLoading(false);
        return;
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(paymentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Complete the subscription creation
        try {
          const subscriptionResponse = await fetch('/api/subscription-payment-complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id
            }),
          });

          const subscriptionData = await subscriptionResponse.json();

          if (subscriptionData.success) {
        onSuccess();
          } else {
            setError(subscriptionData.error || 'Failed to activate subscription');
          }
        } catch (subscriptionError) {
          console.error('Subscription completion error:', subscriptionError);
          setError('Payment succeeded but subscription activation failed. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="border rounded-lg p-4 bg-white">
        <CardElement
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
          <p className="text-xs text-gray-500 mt-2">
            Your payment information is encrypted and secure
          </p>
        </div>
      </div>
      
      {error && (
        <div className="flex items-start space-x-3 text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing Payment...
          </div>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-3" />
            Pay {formatAmount(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
          </>
        )}
      </Button>
      
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Powered by <span className="font-medium">Stripe</span> - Secure payment processing
        </p>
      </div>
    </form>
  );
}

function SubscriptionPaymentContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatAmount } = useGlobalCurrency();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [configError, setConfigError] = useState('');

  const planId = searchParams?.get('planId');
  const billingCycle = searchParams?.get('billingCycle') || 'monthly';

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    if (!planId) {
      router.push('/subscription/expired');
      return;
    }

    fetchPlanAndInitializeStripe();
  }, [session, router, planId]);

  const fetchPlanAndInitializeStripe = async () => {
    try {
      // Fetch plan details
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        const selectedPlan = data.plans.find(p => p._id === planId);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          router.push('/subscription/expired');
          return;
        }
      }

      // Initialize Stripe
      const stripe = await initializeStripe();
      if (stripe) {
        setStripeReady(true);
      } else {
        setConfigError('Payment system not configured. Please contact your administrator.');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      setConfigError('Failed to initialize payment system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard?subscription=success');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="flex items-center justify-center mb-4">
              <Check className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your subscription to {plan?.name} has been activated successfully.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">Plan not found</p>
            <Button 
              onClick={() => router.push('/subscription/expired')}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Configuration Required
            </h2>
            <p className="text-gray-600 mb-4">
              {configError}
            </p>
            <Button 
              onClick={() => router.push('/subscription/expired')}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => router.push('/billing/upgrade')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-600">
            You're subscribing to {plan.name} - {billingCycle} billing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle</span>
                  <span className="font-semibold capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">
                    {formatAmount(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="flex justify-between text-green-600">
                    <span>Annual Savings</span>
                    <span className="font-semibold">
                      -{formatAmount(plan.monthlyPrice * 12 - plan.yearlyPrice)}
                    </span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {formatAmount(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                  </span>
                </div>
                
                {/* Plan Features */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {plan.features?.maxPatients !== -1 && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Up to {plan.features.maxPatients} patients
                      </li>
                    )}
                    {plan.features?.maxPatients === -1 && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Unlimited patients
                      </li>
                    )}
                    {plan.features?.customBranding && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Custom branding
                      </li>
                    )}
                    {plan.features?.prioritySupport && (
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Priority support
                      </li>
                    )}
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Secure data storage
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      24/7 system monitoring
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {stripeReady ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  plan={plan}
                  billingCycle={billingCycle}
                  onSuccess={handleSuccess}
                />
              </Elements>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing payment system...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionPaymentContent />
    </Suspense>
  );
} 