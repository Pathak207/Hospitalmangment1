'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building, 
  CreditCard, 
  DollarSign,
  Check,
  Users
} from 'lucide-react';

export default function UpgradeSubscriberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || (session && session.user?.role !== 'super_admin')) {
      router.push('/login');
      return;
    }

    if (params?.id) {
      fetchSubscriber();
      fetchSubscriptionPlans();
    }
  }, [status, session, params?.id]);

  const fetchSubscriber = async () => {
    if (!params?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriber(data);
      } else {
        alert('Failed to fetch subscriber details');
      }
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      alert('Error fetching subscriber details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        // Extract plans from the response object
        setSubscriptionPlans(Array.isArray(data.plans) ? data.plans : []);
      } else {
        console.error('Failed to fetch subscription plans');
        setSubscriptionPlans([]);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setSubscriptionPlans([]);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }

    setUpgrading(true);
    try {
      // Update subscription with new plan
      const response = await fetch(`/api/subscriptions/${subscriber.subscription._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan,
          status: 'active',
          paymentMethod: 'cash'
        }),
      });

      if (response.ok) {
        alert('Subscription upgraded successfully!');
        router.push('/super-admin/subscribers');
      } else {
        const error = await response.text();
        alert('Failed to upgrade subscription: ' + error);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Error upgrading subscription');
    } finally {
      setUpgrading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading subscriber details...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!subscriber) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Subscriber not found</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/super-admin/subscribers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Subscribers
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Upgrade Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upgrade subscription plan for {subscriber.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscriber Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subscriber Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization Name</label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{subscriber.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-gray-100">{subscriber.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(subscriber.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Status</label>
                  <div className="mt-1">
                    {subscriber.subscription ? (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Trial Account
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        No Subscription
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Select Subscription Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans.map((plan) => (
                  <div
                    key={plan._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === plan._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedPlan(plan._id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {plan.name}
                          </h3>
                          {selectedPlan === plan._id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {plan.description}
                        </p>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {formatAmount(plan.monthlyPrice || 0)}
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            /month
                          </span>
                        </div>
                        {plan.yearlyPrice && plan.yearlyPrice > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {formatAmount(plan.yearlyPrice)}/year
                          </div>
                        )}
                        {plan.features && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Limits:</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {plan.features.maxPatients !== undefined && (
                                <li className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-500" />
                                  {plan.features.maxPatients === -1 ? 'Unlimited Patients per month' : `${plan.features.maxPatients} Patients per month`}
                                </li>
                              )}
                              {plan.features.maxAppointments !== undefined && (
                                <li className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-500" />
                                  {plan.features.maxAppointments === -1 ? 'Unlimited Appointments per month' : `${plan.features.maxAppointments} Appointments per month`}
                                </li>
                              )}
                            </ul>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              All plans have same features - limits reset monthly on 1st of each month
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No subscription plans available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-300">Cash Payment</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Payment will be processed manually by super admin
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Button */}
            <Button
              onClick={handleUpgrade}
              disabled={!selectedPlan || upgrading}
              className="w-full"
              size="lg"
            >
              {upgrading ? 'Upgrading...' : 'Upgrade Subscription'}
            </Button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 