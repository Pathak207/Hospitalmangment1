'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SubscriptionPlanModal from '@/components/modals/subscription-plan-modal';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Check,
  X,
  MoreVertical
} from 'lucide-react';

export default function SubscriptionPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

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
      setLoading(true);
      const response = await fetch('/api/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleEditPlan = async (id: string) => {
    try {
      const response = await fetch(`/api/subscription-plans/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEditingPlan(data.plan);
        setModalOpen(true);
      } else {
        console.error('Error fetching plan details');
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const handleSavePlan = async (planData: any) => {
    try {
      setModalLoading(true);
      
      const url = editingPlan 
        ? `/api/subscription-plans/${editingPlan._id}`
        : '/api/subscription-plans';
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        await fetchPlans(); // Refresh the plans list
        setModalOpen(false);
        setEditingPlan(null);
      } else {
        const errorData = await response.json();
        console.error('Error saving plan:', errorData);
        alert('Error saving plan: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan: ' + (error as any).message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
  };

  const getFeatureIcon = (enabled: boolean) => {
    return enabled ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-gray-400" />
    );
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Subscription Plans
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure pricing and features for subscription plans
            </p>
          </div>
          <Button 
            onClick={handleCreatePlan}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </div>

        {/* Plans Grid */}
        {plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan._id} 
                className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 relative ${
                  plan.isDefault ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                }`}
              >
                {plan.isDefault && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.name}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatAmount(plan.monthlyPrice)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {formatAmount(plan.yearlyPrice)}/year (save {Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)}%)
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(plan.features?.maxPatients !== 0)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {plan.features?.maxPatients === -1 ? 'Unlimited' : plan.features?.maxPatients} Patients
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(plan.features?.maxUsers !== 0)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {plan.features?.maxUsers === -1 ? 'Unlimited' : plan.features?.maxUsers} Users
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(plan.features?.customBranding)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Custom Branding
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(plan.features?.prioritySupport)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Priority Support
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(plan.features?.advancedReports)}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Advanced Reports
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPlan(plan._id)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Sort: {plan.sortOrder}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No subscription plans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first subscription plan to get started
              </p>
              <Button onClick={handleCreatePlan} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        <SubscriptionPlanModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSavePlan}
          plan={editingPlan}
          isLoading={modalLoading}
        />
      </div>
    </SuperAdminLayout>
  );
} 