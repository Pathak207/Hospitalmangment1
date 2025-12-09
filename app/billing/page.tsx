'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useModal } from '@/components/ui/modal-provider';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import jsPDF from 'jspdf';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  ExternalLink,
  Zap,
  Shield,
  Star,
  ArrowUpRight,
  FileText,
  Receipt
} from 'lucide-react';

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { openModal } = useModal();
  const { formatAmount } = useGlobalCurrency();
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billingData, setBillingData] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    fetchSubscriptionInfo();
    fetchSubscriptionPlans();
    fetchBillingData();
  }, [session, router]);

  const fetchSubscriptionInfo = async () => {
    try {
      if (session?.user && (session.user as any)?.organization) {
        const response = await fetch(`/api/subscription-status?organizationId=${(session.user as any).organization}`);
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
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
      const response = await fetch('/api/subscription-plans?active=true');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchBillingData = async () => {
    try {
      setInvoicesLoading(true);
      if (session?.user && (session.user as any)?.organization) {
        console.log('🔍 FRONTEND: Fetching billing data for org:', (session.user as any).organization);
        const response = await fetch(`/api/billing/history?organizationId=${(session.user as any).organization}`);
        console.log('🔍 FRONTEND: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 FRONTEND: Received billing data:', {
            success: data.success,
            billingHistoryCount: data.billingHistory?.length || 0,
            billingHistory: data.billingHistory
          });
          setBillingData(data);
          setInvoices(data.billingHistory || []);
        } else {
          const errorData = await response.json();
          console.error('🔍 FRONTEND: API error:', errorData);
        }
      } else {
        console.log('🔍 FRONTEND: No organization in session:', session?.user);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/billing/upgrade');
  };

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      console.log('🔍 DOWNLOAD: Generating PDF invoice for:', invoice);
      
      // Create new PDF document
      const pdf = new jsPDF();
      
      // Set up document properties
      pdf.setProperties({
        title: `Invoice ${invoice.id || 'INV-' + Date.now()}`,
        subject: 'Invoice',
        author: 'DoctorCare',
        creator: 'DoctorCare Practice Management'
      });
      
      // Company header with logo area
      pdf.setFontSize(28);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text('INVOICE', 20, 30);
      
      // Company information
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('DoctorCare Practice Management', 20, 45);
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text('Professional Healthcare Management Platform', 20, 55);
      pdf.text('support@doctorcare.com | www.doctorcare.com', 20, 65);
      
      // Invoice details box
      const invoiceDate = new Date(invoice.date || Date.now()).toLocaleDateString();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoice.id || Math.floor(Math.random() * 10000)).toString().padStart(6, '0')}`;
      
      // Invoice info box
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.rect(120, 25, 70, 45, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(120, 25, 70, 45);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Invoice Number:', 125, 35);
      pdf.setFont(undefined, 'bold');
      pdf.text(invoiceNumber, 125, 45);
      
      pdf.setFont(undefined, 'normal');
      pdf.text('Invoice Date:', 125, 55);
      pdf.setFont(undefined, 'bold');
      pdf.text(invoiceDate, 125, 65);
      
      // Organization details (if available)
      let yPosition = 85;
      if (session?.user?.organization) {
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(14);
        pdf.setTextColor(51, 51, 51);
        pdf.text('Bill To:', 20, yPosition);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        // Use organization name from session or default
        const orgName = (session.user as any).name || 'Organization';
        pdf.text(orgName, 20, yPosition + 12);
        
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(102, 102, 102);
        const email = (session.user as any).email || 'organization@example.com';
        pdf.text(email, 20, yPosition + 22);
        
        yPosition += 40;
      }
      
      // Service details section
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Service Details', 20, yPosition);
      yPosition += 15;
      
      // Table header
      pdf.setFillColor(37, 99, 235); // Blue background
      pdf.rect(20, yPosition, 170, 15, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Description', 25, yPosition + 10);
      pdf.text('Billing Cycle', 100, yPosition + 10);
      pdf.text('Amount', 160, yPosition + 10);
      
      yPosition += 15;
      
      // Service row
      pdf.setFillColor(248, 250, 252); // Light gray
      pdf.rect(20, yPosition, 170, 15, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoice.plan || 'Subscription Plan', 25, yPosition + 10);
      pdf.text(invoice.billingCycle || 'Monthly', 100, yPosition + 10);
      pdf.text(`${formatAmount(invoice.amount || 0)}`, 160, yPosition + 10);
      
      yPosition += 25;
      
      // Total section
      pdf.setFillColor(220, 252, 231); // Light green background
      pdf.rect(120, yPosition, 70, 20, 'F');
      pdf.setDrawColor(34, 197, 94);
      pdf.rect(120, yPosition, 70, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(22, 101, 52);
      pdf.text('Total Amount:', 125, yPosition + 8);
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(14);
      pdf.text(`${formatAmount(invoice.amount || 0)}`, 125, yPosition + 16);
      
      // Payment status
      yPosition += 35;
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Payment Status:', 20, yPosition);
      
      // Status badge
      const status = (invoice.status || 'Paid').toUpperCase();
      const statusColor = status === 'PAID' ? [34, 197, 94] : [239, 68, 68]; // Green or Red
      const statusBgColor = status === 'PAID' ? [220, 252, 231] : [254, 226, 226]; // Light green or light red
      
      pdf.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
      pdf.rect(65, yPosition - 8, 25, 12, 'F');
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.setFont(undefined, 'bold');
      pdf.text(status, 67, yPosition);
      
      // Footer section
      yPosition = 250; // Fixed position for footer
      pdf.setDrawColor(229, 231, 235);
      pdf.line(20, yPosition, 190, yPosition); // Horizontal line
      
      yPosition += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(102, 102, 102);
      pdf.setFont(undefined, 'normal');
      pdf.text('Thank you for choosing DoctorCare Practice Management!', 20, yPosition);
      pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition + 10);
      
      pdf.setFontSize(8);
      pdf.text('For support and inquiries, please contact us at support@doctorcare.com', 20, yPosition + 25);
      pdf.text('© 2024 DoctorCare. All rights reserved.', 20, yPosition + 35);
      
      // Download the PDF
      const fileName = `invoice-${invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF invoice generated successfully:', fileName);
      
    } catch (error) {
      console.error('Error generating PDF invoice:', error);
      alert('Error generating PDF invoice. Please try again.');
    }
  };

  const handleOpenBillingPortal = () => {
    openModal('billingPortal', {
      billingHistory: (billingData as any)?.billingHistory || [],
      currentSubscription: (billingData as any)?.currentSubscription || null,
      paymentMethods: (billingData as any)?.paymentMethods || [],
      organization: (billingData as any)?.organization || null
    });
  };

  const getStatusIcon = () => {
    // Check for unlimited subscription first
    if ((subscriptionInfo as any)?.organization?.subscriptionType === 'unlimited' || 
        (subscriptionInfo as any)?.subscription?.status === 'unlimited') {
      return <Star className="h-5 w-5 text-purple-500" />;
    }
    if (!(subscriptionInfo as any)?.isActive) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if ((subscriptionInfo as any).subscription?.status === 'trialing') {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = () => {
    // Check for unlimited subscription first
    if ((subscriptionInfo as any)?.organization?.subscriptionType === 'unlimited' || 
        (subscriptionInfo as any)?.subscription?.status === 'unlimited') {
      return 'Unlimited';
    }
    if (!(subscriptionInfo as any)?.isActive) {
      return 'Inactive';
    }
    if ((subscriptionInfo as any).subscription?.status === 'trialing') {
      return 'Trial';
    }
    return 'Active';
  };

  const getStatusColor = () => {
    // Check for unlimited subscription first
    if ((subscriptionInfo as any)?.organization?.subscriptionType === 'unlimited' || 
        (subscriptionInfo as any)?.subscription?.status === 'unlimited') {
      return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
    }
    if (!(subscriptionInfo as any)?.isActive) {
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    }
    if ((subscriptionInfo as any).subscription?.status === 'trialing') {
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    }
    return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading billing information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bill & Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your subscription and billing information
            </p>
          </div>
        </div>

        {/* Current Subscription Status */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>
              
              {/* Show unlimited subscription info */}
              {((subscriptionInfo as any)?.organization?.subscriptionType === 'unlimited' || 
                (subscriptionInfo as any)?.subscription?.status === 'unlimited') && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                    <p className="font-semibold text-purple-600 dark:text-purple-400 mt-1">
                      Unlimited Subscriber
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Billing</p>
                    <p className="font-semibold text-green-600 dark:text-green-400 mt-1">
                      No Payment Required
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lifetime access included
                    </p>
                  </div>
                </>
              )}

              {/* Show regular subscription info for non-unlimited accounts */}
              {(subscriptionInfo as any)?.organization?.subscriptionType !== 'unlimited' && 
               (subscriptionInfo as any)?.subscription?.status !== 'unlimited' && 
               subscriptionInfo && (subscriptionInfo as any).subscription && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {(subscriptionInfo as any).subscription.plan || 'Trial Account'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(subscriptionInfo as any).subscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {(subscriptionInfo as any).subscription.endDate 
                        ? new Date((subscriptionInfo as any).subscription.endDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                    {(subscriptionInfo as any).subscription.daysRemaining !== undefined && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(subscriptionInfo as any).subscription.daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {((subscriptionInfo as any)?.organization?.subscriptionType === 'unlimited' || 
                (subscriptionInfo as any)?.subscription?.status === 'unlimited') ? (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg w-full">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-purple-500" />
                    <div>
                      <h3 className="font-semibold text-purple-800 dark:text-purple-300">
                        Unlimited Access Account
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        You have lifetime access to all features with no payment required. No subscription management needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleUpgrade}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {subscriptionInfo && (subscriptionInfo as any).subscription?.status === 'trialing' ? 'Upgrade Now' : 'Change Plan'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>



        {/* Recent Invoices */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {/* Skeleton loaders */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                </div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
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
                          {formatAmount(invoice.amount)}
                        </p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400 capitalize">
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownloadInvoice(invoice)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Button
                    onClick={handleOpenBillingPortal}
                    variant="outline"
                  >
                    View All Invoices
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices available</p>
                <p className="text-sm">Your billing history will appear here once you have an active subscription</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Need Help with Billing?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Our support team is here to help with any billing questions or issues you may have.
                </p>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  onClick={() => {
                    // In a real app, this would open a support chat or email
                    window.open('mailto:support@doctorcare.com?subject=Billing Support Request', '_blank');
                  }}
                >
                  Contact Support
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 