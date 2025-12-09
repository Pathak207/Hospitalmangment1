'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Calendar, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Clock,
  X,
  ExternalLink
} from 'lucide-react';

interface BillingPortalProps {
  isOpen: boolean;
  onClose: () => void;
  billingData?: any;
}

export default function BillingPortal({ isOpen, onClose, billingData }: BillingPortalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const billingHistory = billingData?.billingHistory || [];
  const paymentMethods = billingData?.paymentMethods || [];

  const handleDownloadInvoice = async (invoiceUrl: string, invoiceId: string) => {
    try {
      if (invoiceUrl && invoiceUrl !== '#') {
        window.open(invoiceUrl, '_blank');
      } else {
        const response = await fetch(`/api/billing/invoice/${invoiceId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.invoice?.downloadUrl) {
            window.open(data.invoice.downloadUrl, '_blank');
          } else {
            alert('Invoice download functionality will be implemented with real billing system');
          }
        } else {
          alert('Unable to download invoice. Please contact support.');
        }
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };

  const handleUpdatePaymentMethod = () => {
    // In a real app, this would open Stripe's payment method update flow
    alert('Payment method update functionality will be implemented with Stripe');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'trial':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400';
      case 'trial':
        return 'text-blue-600 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Billing Portal
          </h2>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {method.brand.toUpperCase()} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Expires {method.expMonth}/{method.expYear}
                          </p>
                        </div>
                        {method.isDefault && (
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded text-xs">
                            Default
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={handleUpdatePaymentMethod}
                        variant="outline"
                        size="sm"
                      >
                        Update
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods found</p>
                  <Button
                    onClick={handleUpdatePaymentMethod}
                    className="mt-4"
                  >
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading billing history...</p>
                </div>
              ) : billingHistory.length > 0 ? (
                <div className="space-y-3">
                  {billingHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {invoice.plan} - {invoice.billingCycle}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            ${invoice.amount}
                          </p>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(invoice.status)}
                            <span className={`text-xs capitalize ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDownloadInvoice(invoice.downloadUrl, invoice.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No billing history available</p>
                  <p className="text-sm">Your billing history will appear here once you have transactions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Info */}
          {billingData?.organization && (
            <Card className="bg-gray-50 dark:bg-gray-700/50">
              <CardHeader>
                <CardTitle className="text-sm">Organization Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Organization</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {billingData.organization.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {billingData.organization.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* External Billing Portal */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Need More Options?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Access our full billing portal for advanced billing management, tax documents, and detailed usage reports.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // In a real app, this would redirect to Stripe's customer portal
                    if (billingData?.organization?.stripeCustomerId) {
                      alert('Redirecting to Stripe Customer Portal...');
                    } else {
                      alert('External billing portal will be implemented with Stripe Customer Portal');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 