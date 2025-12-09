'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Star, 
  Zap,
  Shield,
  Users,
  BarChart3,
  Palette,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Receipt
} from 'lucide-react';

export default function UpgradePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    fetchSubscriptionInfo();
    fetchSubscriptionPlans();
  }, [session, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      if (session?.user && (session.user as any)?.organization) {
        const response = await fetch(`/api/subscription-status?organizationId=${(session.user as any).organization}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
          
          // Get current plan details if available
          if (data.subscription?.id) {
            const subResponse = await fetch(`/api/subscriptions/${data.subscription.id}`);
            if (subResponse.ok) {
              const subData = await subResponse.json();
              setCurrentPlan(subData.subscription);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      console.log('Fetching subscription plans...');
      console.log('Session:', session);
      
      const response = await fetch('/api/subscription-plans?active=true');
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription plans data:', data);
        const plans = data.plans || [];
        console.log('Plans found:', plans.length);
        setSubscriptionPlans(plans);
        
        // Set default selected plan
        if (plans.length > 0) {
          // If user has a current plan, select the next tier up, otherwise select Professional
          const professionalPlan = plans.find(p => p.name.toLowerCase().includes('professional'));
          const currentPlanName = subscriptionInfo?.subscription?.plan?.toLowerCase();
          
          if (currentPlanName) {
            // Find a higher tier plan
            const currentPlanIndex = plans.findIndex(p => p.name.toLowerCase().includes(currentPlanName));
            const nextPlan = plans[currentPlanIndex + 1] || professionalPlan || plans[0];
            setSelectedPlan(nextPlan);
            console.log('Selected next tier plan:', nextPlan?.name);
          } else {
            setSelectedPlan(professionalPlan || plans[0]);
            console.log('Selected default plan:', (professionalPlan || plans[0])?.name);
          }
        }
      } else {
        console.error('Failed to fetch subscription plans:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        
        // Check if it's a redirect to login
        if (response.status === 307 || errorData.includes('login')) {
          console.error('Authentication issue - user might not be logged in properly');
        }
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const handleUpgrade = () => {
    if (selectedPlan && !isCurrentPlan(selectedPlan)) {
      router.push(`/subscription/payment?planId=${selectedPlan._id}&billingCycle=${selectedBilling}`);
    } else if (selectedPlan && isCurrentPlan(selectedPlan)) {
      // Extra safety: alert user if they somehow try to upgrade to current plan
      alert('You cannot upgrade to your current plan. Please select a different plan.');
    }
  };

  const getFeatureIcon = (feature) => {
    switch (feature) {
      case 'maxPatients':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'maxUsers':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'customBranding':
        return <Palette className="h-4 w-4 text-purple-500" />;
      case 'prioritySupport':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'advancedReports':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default:
        return <Check className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusInfo = () => {
    if (!subscriptionInfo) return null;

    if (!subscriptionInfo.isActive) {
      return {
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        text: 'Subscription Expired',
        color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
      };
    }

    if (subscriptionInfo.subscription?.status === 'trialing') {
      return {
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        text: `Trial (${subscriptionInfo.subscription.daysRemaining || 0} days left)`,
        color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
      };
    }

    return {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: 'Active Subscription',
      color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
    };
  };

  const isCurrentPlan = (plan) => {
    console.log('🔍 DEBUG: isCurrentPlan check', {
      currentPlan,
      plan,
      hasCurrentPlan: !!currentPlan,
      hasCurrentPlanPlan: !!(currentPlan && currentPlan.plan),
      currentPlanId: currentPlan?.plan?._id,
      planId: plan._id,
      isMatch: currentPlan?.plan?._id === plan._id
    });
    
    if (!currentPlan || !currentPlan.plan) return false;
    return currentPlan.plan._id === plan._id;
  };

  const getPlanRecommendation = (plan) => {
    const currentPlanName = subscriptionInfo?.subscription?.plan?.toLowerCase() || '';
    const planName = plan.name.toLowerCase();
    
    if (planName.includes('professional') && !currentPlanName.includes('professional')) {
      return 'Most Popular';
    }
    if (planName.includes('enterprise') && currentPlanName.includes('basic')) {
      return 'Best Value';
    }
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading upgrade options...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              onClick={() => router.push('/billing')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upgrade Your Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose the perfect plan for your practice
            </p>
          </div>
          {statusInfo && (
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          )}
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Current Plan: {currentPlan.plan?.name || 'Trial Account'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ${currentPlan.amount}/{currentPlan.billingCycle} • 
                    {subscriptionInfo.subscription?.daysRemaining && (
                      <span className="ml-1">
                        {subscriptionInfo.subscription.daysRemaining} days remaining
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next billing</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {subscriptionInfo.subscription?.endDate 
                      ? new Date(subscriptionInfo.subscription.endDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Toggle */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedBilling === 'monthly'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    selectedBilling === 'yearly'
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Yearly
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.length > 0 ? (
            subscriptionPlans.map((plan) => {
              const isSelected = selectedPlan?._id === plan._id;
              const isCurrent = isCurrentPlan(plan);
              const recommendation = getPlanRecommendation(plan);
              
              console.log('🎯 DEBUG: Rendering plan', {
                planName: plan.name,
                planId: plan._id,
                isSelected,
                isCurrent,
                recommendation,
                features: plan.features
              });
              
              return (
                <Card 
                  key={plan._id} 
                  className={`relative transition-all duration-200 ${
                    isCurrent
                      ? 'border-2 border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 cursor-not-allowed opacity-75 pointer-events-none'
                      : isSelected 
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg ring-2 ring-blue-500/20 cursor-pointer' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                  }`}
                  onClick={() => !isCurrent && setSelectedPlan(plan)}
                >
                  {recommendation && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {recommendation}
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-3">
                      <span className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border-2 border-white dark:border-gray-800">
                        ✓ CURRENT PLAN
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center pb-4 ${isCurrent ? 'opacity-70' : ''}`}>
                    <CardTitle className={`text-xl flex items-center justify-center gap-2 ${isCurrent ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                      {plan.name}
                      {isSelected && <Check className="h-5 w-5 text-blue-500" />}
                      {isCurrent && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </CardTitle>
                    {plan.description && (
                      <p className={`text-sm ${isCurrent ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>{plan.description}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className={isCurrent ? 'opacity-70' : ''}>
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatAmount(selectedBilling === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        per {selectedBilling === 'monthly' ? 'month' : 'year'}
                      </div>
                      {selectedBilling === 'yearly' && (
                        <div className="text-green-600 text-sm font-medium mt-1">
                          Save {formatAmount(plan.monthlyPrice * 12 - plan.yearlyPrice)} annually
                        </div>
                      )}
                    </div>

                    {/* Plan Details & Features - Simplified to only show limits */}
                    <div className="space-y-4">
                      {/* Core Capacity Features - Only Patient and Appointment Limits */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Plan Limits
                        </h4>
                        
                        {/* Patient Limit */}
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.features?.maxPatients === -1 ? 'Unlimited patients per month' : 
                             plan.features?.maxPatients ? `Up to ${plan.features.maxPatients} patients per month` : 'Unlimited patients per month'}
                          </span>
                        </div>

                        {/* Appointments Limit */}
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.features?.maxAppointments === -1 || !plan.features?.maxAppointments ? 'Unlimited appointments per month' : 
                             `Up to ${plan.features.maxAppointments} appointments per month`}
                          </span>
                        </div>
                      </div>

                      {/* All Features Included */}
                      <div className="space-y-3 border-t pt-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          All Features Included
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Patient Management</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Appointment Scheduling</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Medical Records</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Digital Prescriptions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Lab Results</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Billing & Invoicing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Reports & Analytics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">HIPAA Compliant</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center border-2 border-green-300 dark:border-green-700">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-700 dark:text-green-400 font-bold">
                            ✓ THIS IS YOUR CURRENT ACTIVE PLAN
                          </p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                          🚫 SELECTION DISABLED - You cannot select or pay for this plan again
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No subscription plans available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Subscription plans are currently being configured. Please check back later or contact support.
                  </p>
                  <Button 
                    onClick={() => router.push('/billing')}
                    variant="outline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Billing
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {selectedPlan && !isCurrentPlan(selectedPlan) && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Ready to upgrade to {selectedPlan.name}?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {selectedBilling === 'monthly' 
                      ? `$${selectedPlan.monthlyPrice}/month` 
                      : `$${selectedPlan.yearlyPrice}/year (Save $${(selectedPlan.monthlyPrice * 12 - selectedPlan.yearlyPrice).toFixed(0)})`
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Section */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-center">Why Upgrade?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">More Patients Monthly</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Higher monthly patient limits that reset each month - no lifetime restrictions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">More Appointments Monthly</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedule more appointments each month with limits that reset monthly
                </p>
              </div>
            </div>
            
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All plans include the same comprehensive features - only monthly patient and appointment limits differ
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Monthly limits reset on the 1st of each month. Previous months' usage doesn't affect current limits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 