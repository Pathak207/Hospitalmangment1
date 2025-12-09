'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { AlertCircle, CreditCard, Clock, LogOut } from 'lucide-react';

export default function SubscriptionExpiredPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    fetchSubscriptionPlans();
    fetchSubscriptionInfo();
  }, [session, router]);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans?active=true');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      if (session?.user?.organization) {
        const response = await fetch(`/api/subscription-status?organizationId=${session.user.organization}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  const handleSubscribe = (plan, billingCycle) => {
    // Redirect to payment page with plan and billing cycle
    router.push(`/subscription/payment?planId=${plan._id}&billingCycle=${billingCycle}`);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Required
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your subscription has expired. Please renew your subscription to continue using the platform.
          </p>
        </div>

        {/* Subscription Info */}
        {subscriptionInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold text-red-600">{subscriptionInfo.reason}</p>
                </div>
                {subscriptionInfo.expiredAt && (
                  <div>
                    <p className="text-sm text-gray-600">Expired On</p>
                    <p className="font-semibold">
                      {new Date(subscriptionInfo.expiredAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {subscriptionPlans.map((plan) => (
            <Card key={plan._id} className="relative">
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.description && (
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Monthly Pricing */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Monthly</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatAmount(plan.monthlyPrice)}
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleSubscribe(plan, 'monthly')}
                      className="w-full"
                      variant="outline"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe Monthly
                    </Button>
                  </div>

                  {/* Yearly Pricing */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Yearly</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">
                          {formatAmount(plan.yearlyPrice)}
                        </span>
                        <div className="text-sm text-green-600">
                          Save {formatAmount(plan.monthlyPrice * 12 - plan.yearlyPrice)}
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSubscribe(plan, 'yearly')}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe Yearly
                    </Button>
                  </div>

                  {/* Features */}
                  {plan.features && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.maxPatients !== -1 && (
                          <li>• Up to {plan.features.maxPatients} patients</li>
                        )}
                        {plan.features.maxUsers !== -1 && (
                          <li>• Up to {plan.features.maxUsers} users</li>
                        )}
                        {plan.features.customBranding && (
                          <li>• Custom branding</li>
                        )}
                        {plan.features.prioritySupport && (
                          <li>• Priority support</li>
                        )}
                        {plan.features.advancedReports && (
                          <li>• Advanced reports</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sign Out Option */}
        <div className="text-center">
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="text-gray-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
} 