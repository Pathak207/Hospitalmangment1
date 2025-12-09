'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Check, AlertCircle, Package, DollarSign, Settings, Zap } from 'lucide-react';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: any) => void;
  plan?: any;
  isLoading?: boolean;
}

export default function SubscriptionPlanModal({ 
  isOpen, 
  onClose, 
  onSave, 
  plan, 
  isLoading = false 
}: SubscriptionPlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyPrice: '',
    yearlyPrice: '',
    features: {
      maxPatients: -1,
      maxAppointments: -1,
      // All other features are always included, no toggles needed
    },
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        monthlyPrice: plan.monthlyPrice?.toString() || '',
        yearlyPrice: plan.yearlyPrice?.toString() || '',
        features: {
          maxPatients: plan.features?.maxPatients ?? -1,
          maxAppointments: plan.features?.maxAppointments ?? -1,
        },
        stripePriceIdMonthly: plan.stripePriceIdMonthly || '',
        stripePriceIdYearly: plan.stripePriceIdYearly || '',
        isActive: plan.isActive ?? true,
        isDefault: plan.isDefault ?? false,
        sortOrder: plan.sortOrder ?? 0,
      });
    } else {
      // Reset form for new plan
      setFormData({
        name: '',
        description: '',
        monthlyPrice: '',
        yearlyPrice: '',
        features: {
          maxPatients: -1,
          maxAppointments: -1,
        },
        stripePriceIdMonthly: '',
        stripePriceIdYearly: '',
        isActive: true,
        isDefault: false,
        sortOrder: 0,
      });
    }
    setErrors({});
  }, [plan, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.monthlyPrice || parseFloat(formData.monthlyPrice) < 0) {
      newErrors.monthlyPrice = 'Valid monthly price is required';
    }

    if (!formData.yearlyPrice || parseFloat(formData.yearlyPrice) < 0) {
      newErrors.yearlyPrice = 'Valid yearly price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const planData = {
      ...formData,
      monthlyPrice: parseFloat(formData.monthlyPrice),
      yearlyPrice: parseFloat(formData.yearlyPrice),
      sortOrder: parseInt(formData.sortOrder.toString()) || 0,
    };

    onSave(planData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFeatureChange = (feature: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xs sm:max-w-lg md:max-w-3xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {plan ? 'Edit Plan' : 'Create Plan'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-60px)] sm:max-h-[calc(90vh-70px)] md:max-h-[calc(85vh-80px)]">
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Basic Plan"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the plan..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-gray-100 resize-none text-sm"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Price ($) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={(e) => handleInputChange('monthlyPrice', e.target.value)}
                    placeholder="0.00"
                    className={errors.monthlyPrice ? 'border-red-500' : ''}
                  />
                  {errors.monthlyPrice && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.monthlyPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yearly Price ($) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.yearlyPrice}
                    onChange={(e) => handleInputChange('yearlyPrice', e.target.value)}
                    placeholder="0.00"
                    className={errors.yearlyPrice ? 'border-red-500' : ''}
                  />
                  {errors.yearlyPrice && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.yearlyPrice}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stripe Monthly Price ID
                  </label>
                  <Input
                    value={formData.stripePriceIdMonthly}
                    onChange={(e) => handleInputChange('stripePriceIdMonthly', e.target.value)}
                    placeholder="price_xxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stripe Yearly Price ID
                  </label>
                  <Input
                    value={formData.stripePriceIdYearly}
                    onChange={(e) => handleInputChange('stripePriceIdYearly', e.target.value)}
                    placeholder="price_xxx"
                  />
                </div>
              </div>
            </div>

            {/* Plan Limits */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Plan Limits</h3>
              </div>
              
              <div className="mb-3 sm:mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> All plans include the same comprehensive features (Patient Management, Appointments, Medical Records, Prescriptions, Lab Results, Billing, Reports, etc.). Only monthly patient and appointment limits differ between plans.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  <strong>Monthly Limits:</strong> Limits reset on the 1st of each month. Patients and appointments created in previous months don't count toward current month limits.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Patients (per month)
                  </label>
                  <Input
                    type="number"
                    value={formData.features.maxPatients}
                    onChange={(e) => handleFeatureChange('maxPatients', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited patients per month</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Appointments (per month)
                  </label>
                  <Input
                    type="number"
                    value={formData.features.maxAppointments}
                    onChange={(e) => handleFeatureChange('maxAppointments', parseInt(e.target.value) || -1)}
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited appointments per month</p>
                </div>
              </div>
            </div>

            {/* Plan Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Plan Settings</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 p-2 sm:p-3 bg-white dark:bg-gray-700 rounded border">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Active Plan
                  </label>
                </div>

                <div className="flex items-center space-x-2 p-2 sm:p-3 bg-white dark:bg-gray-700 rounded border">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isDefault" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Most Popular Plan
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 sm:px-6 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 sm:px-6 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {plan ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {plan ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
} 