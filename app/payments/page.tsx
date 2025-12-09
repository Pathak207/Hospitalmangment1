'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { useSettings } from '@/lib/settings-context';
import { Search, Plus, CreditCard, DollarSign, FileText, TrendingUp, Calendar, Filter, Download, Receipt, MoreHorizontal, Trash2, FileDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import toast from 'react-hot-toast';

interface PaymentData {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  amount: number;
  method: string;
  description: string;
  status: string;
  appointmentId: string;
  paid: boolean;
}

interface MethodSummary {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

export default function PaymentsPage() {
  const { openModal } = useModal();
  const { formatDate, formatCurrency } = useSettings();
  
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const [paymentMethodSummary, setPaymentMethodSummary] = useState<MethodSummary[]>([]);
  
  // Fetch payments data when component mounts
  useEffect(() => {
    fetchPayments();
  }, []);
  
  // Function to fetch payments from the API
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      
      // Format the payments data
      const formattedPayments: PaymentData[] = data.payments.map((payment, index) => {
        const formattedPayment = {
          id: payment.transactionId || payment._id,
          patientName: payment.patient?.name || 'Unknown Patient',
          patientId: payment.patient?.patientId || 'Unknown ID',
          date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: payment.amount,
          method: payment.paymentMethod || 'Card',
          description: payment.description || 'Payment',
          status: payment.status || 'Pending',
          appointmentId: payment.appointment ? `APT-${payment.appointment._id.toString().slice(-4).toUpperCase()}` : 'N/A',
          paid: payment.status === 'Paid' || payment.status === 'Completed' || payment.status === 'paid'
        };
        
        // Debug logging to understand payment structure and catch issues
        if (!formattedPayment.id || formattedPayment.id.startsWith('temp-')) {
          console.warn('Payment missing proper ID:', {
            rawPayment: payment,
            formattedId: formattedPayment.id,
            method: formattedPayment.method
          });
        }
        
        console.log('Formatted payment:', {
          rawId: payment._id,
          transactionId: payment.transactionId,
          finalId: formattedPayment.id,
          method: formattedPayment.method,
          status: formattedPayment.status
        });
        
        return formattedPayment;
      });
      
      setPayments(formattedPayments);
      
      // Calculate payment summary
      calculateSummary(formattedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Use sample data as fallback
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate payment method summary
  const calculateSummary = (paymentsData: PaymentData[]) => {
    const methodTotals = paymentsData.reduce((acc, payment) => {
      if (!acc[payment.method]) {
        acc[payment.method] = { total: 0, count: 0 };
      }
      acc[payment.method].total += payment.amount;
      acc[payment.method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    const totalAmount = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    
    const summary = Object.entries(methodTotals).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0
    }));
    
    setPaymentMethodSummary(summary.sort((a, b) => b.total - a.total));
  };
  
  // Filter payments based on search and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod;
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const paymentDate = new Date(payment.date);
      const today = new Date();
      
      switch (dateRange) {
        case 'today':
          matchesDate = paymentDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesMethod && matchesStatus && matchesDate;
  });
  
  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCount = filteredPayments.length;
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
  
  // Calculate this month's payments
  const thisMonthAmount = payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const currentDate = new Date();
    return paymentDate.getMonth() === currentDate.getMonth() && 
           paymentDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, payment) => sum + payment.amount, 0);
  
  // Get unique payment methods for filter
  const paymentMethods = [...new Set(payments.map(p => p.method))];
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-gray-900/20 h-40 rounded-xl z-0"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pt-10 pb-8 relative z-10">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 mr-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-300">
                  <DollarSign size={24} />
                </div>
                Payments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1 max-w-md">
                Track and manage payment transactions
              </p>
            </div>
            <Button variant="primary" className="shadow-md hover:shadow-lg flex items-center px-5 py-2.5" onClick={() => openModal('processPayment')}>
              <Plus size={18} className="mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(totalAmount)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalCount}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Average Payment</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(averageAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">This Month</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(thisMonthAmount)}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payments Table */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Payment Transactions</CardTitle>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="all">All Methods</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm dark:border-gray-600 dark:bg-gray-800"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-1/6 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredPayments.map((payment, index) => {
                        // Create a unique key to avoid React conflicts
                        const uniqueKey = `payment-${index}-${payment.id}`;
                        
                        return (
                          <tr key={uniqueKey} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
                                    {payment.patientName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {payment.patientName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    ID: {payment.patientId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(payment.date)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(payment.amount)}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                {payment.method === 'Card' ? (
                                  <CreditCard size={12} className="text-blue-500 mr-1" />
                                ) : payment.method === 'Cash' ? (
                                  <DollarSign size={12} className="text-green-500 mr-1" />
                                ) : payment.method === 'Check' ? (
                                  <FileText size={12} className="text-purple-500 mr-1" />
                                ) : (
                                  <CreditCard size={12} className="text-gray-400 mr-1" />
                                )}
                                <span>{payment.method}</span>
                                {payment.description && payment.description !== 'Payment' && (
                                  <span className="ml-2 truncate">• {payment.description}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {payment.paid ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <Popover open={openPopoverId === uniqueKey} onOpenChange={(open) => {
                                if (open) {
                                  setOpenPopoverId(uniqueKey);
                                } else {
                                  setOpenPopoverId(null);
                                }
                              }}>
                                <PopoverTrigger asChild>
                                  <button 
                                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 p-1 rounded"
                                  >
                                    <MoreHorizontal size={16} />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-0" align="end">
                                  <div className="py-1">
                                    {!payment.paid && (
                                      <>
                                        <button 
                                          className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-green-600 dark:text-green-400"
                                          onClick={() => {
                                            setOpenPopoverId(null);
                                            openModal('processPayment', {
                                              patientName: payment.patientName,
                                              patientId: payment.patientId,
                                              amount: payment.amount,
                                              appointmentId: payment.id,
                                              description: payment.description
                                            });
                                          }}
                                        >
                                          <DollarSign className="mr-2 h-4 w-4" />
                                          Pay Now
                                        </button>
                                        <hr className="my-1" />
                                      </>
                                    )}
                                    <button 
                                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                      onClick={() => {
                                        setOpenPopoverId(null);
                                        openModal('viewInvoice', {
                                          id: payment.id,
                                          patientName: payment.patientName,
                                          patientId: payment.patientId,
                                          amount: payment.amount,
                                          date: payment.date,
                                          method: payment.method,
                                          description: payment.description,
                                          paid: payment.paid
                                        });
                                      }}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Details
                                    </button>
                                    <button 
                                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                      onClick={() => {
                                        setOpenPopoverId(null);
                                        // Generate PDF receipt functionality
                                        const generatePaymentPDF = (payment) => {
                                          const receiptDate = new Date().toLocaleDateString();
                                          const receiptNumber = `RCP-${new Date().getFullYear()}-${payment.id || Math.floor(Math.random() * 10000)}`;
                                          const formattedAmount = formatCurrency(payment.amount);
                                          
                                          // Create a new window for PDF generation
                                          const pdfWindow = window.open('', '_blank');
                                          if (!pdfWindow) {
                                            toast.error('Please allow popups to download the receipt');
                                            return;
                                          }
                                          
                                          // Write PDF content to the new window
                                          pdfWindow.document.write(`
                                            <!DOCTYPE html>
                                            <html>
                                              <head>
                                                <title>Payment Receipt - ${payment.patientName}</title>
                                                <meta charset="utf-8">
                                                <style>
                                                  body {
                                                    font-family: Arial, sans-serif;
                                                    color: #333;
                                                    line-height: 1.5;
                                                    margin: 0;
                                                    padding: 20px;
                                                  }
                                                  .container {
                                                    max-width: 600px;
                                                    margin: 0 auto;
                                                    padding: 20px;
                                                    border: 1px solid #ddd;
                                                  }
                                                  .header {
                                                    text-align: center;
                                                    margin-bottom: 30px;
                                                    padding-bottom: 20px;
                                                    border-bottom: 2px solid #0066cc;
                                                  }
                                                  .receipt-label {
                                                    background-color: #0066cc;
                                                    color: white;
                                                    padding: 8px 16px;
                                                    border-radius: 4px;
                                                    font-weight: bold;
                                                    display: inline-block;
                                                    margin-bottom: 10px;
                                                  }
                                                  .details {
                                                    display: flex;
                                                    justify-content: space-between;
                                                    margin-bottom: 30px;
                                                  }
                                                  .amount-section {
                                                    text-align: center;
                                                    background-color: #f8f9fa;
                                                    padding: 20px;
                                                    border-radius: 8px;
                                                    margin: 20px 0;
                                                  }
                                                  .amount {
                                                    font-size: 36px;
                                                    font-weight: bold;
                                                    color: #28a745;
                                                    margin: 10px 0;
                                                  }
                                                  .payment-method {
                                                    background-color: #e3f2fd;
                                                    padding: 15px;
                                                    border-radius: 4px;
                                                    margin: 15px 0;
                                                  }
                                                  #loading {
                                                    position: fixed;
                                                    top: 0;
                                                    left: 0;
                                                    right: 0;
                                                    bottom: 0;
                                                    background-color: rgba(255,255,255,0.9);
                                                    display: flex;
                                                    flex-direction: column;
                                                    justify-content: center;
                                                    align-items: center;
                                                    z-index: 9999;
                                                  }
                                                  .spinner {
                                                    border: 6px solid #f3f3f3;
                                                    border-top: 6px solid #3498db;
                                                    border-radius: 50%;
                                                    width: 50px;
                                                    height: 50px;
                                                    animation: spin 1s linear infinite;
                                                    margin-bottom: 15px;
                                                  }
                                                  @keyframes spin {
                                                    0% { transform: rotate(0deg); }
                                                    100% { transform: rotate(360deg); }
                                                  }
                                                </style>
                                                <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
                                                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                                              </head>
                                              <body>
                                                <div id="loading">
                                                  <div class="spinner"></div>
                                                  <p>Generating your receipt...</p>
                                                </div>
                                                
                                                <div id="receipt" class="container">
                                                  <div class="header">
                                                    <h1>DoctorCare Medical Center</h1>
                                                    <p>123 Medical Center Dr.<br>Healthville, CA 12345<br>(555) 123-4567</p>
                                                    <div class="receipt-label">PAYMENT RECEIPT</div>
                                                    <p><strong>Receipt #:</strong> ${receiptNumber}<br>
                                                    <strong>Date:</strong> ${receiptDate}</p>
                                                  </div>
                                                  
                                                  <div class="details">
                                                    <div>
                                                      <h3>Patient Information</h3>
                                                      <p><strong>${payment.patientName}</strong><br>
                                                      Patient ID: ${payment.patientId}</p>
                                                    </div>
                                                    <div style="text-align: right;">
                                                      <h3>Payment Details</h3>
                                                      <p>Date: ${payment.date}<br>
                                                      Status: ${payment.paid ? 'Paid' : 'Pending'}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div class="amount-section">
                                                    <h3>Amount Paid</h3>
                                                    <div class="amount">${formattedAmount}</div>
                                                  </div>
                                                  
                                                  <div class="payment-method">
                                                    <h4>Payment Method</h4>
                                                    <p><strong>${payment.method}</strong></p>
                                                    ${payment.description ? `<p>Description: ${payment.description}</p>` : ''}
                                                  </div>
                                                  
                                                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                                                    <p><strong>Thank you for your payment!</strong></p>
                                                    <p style="font-size: 12px; color: #666;">This receipt serves as proof of payment for services rendered.</p>
                                                  </div>
                                                </div>
                                                
                                                <script>
                                                  function downloadPDF() {
                                                    const { jsPDF } = window.jspdf;
                                                    const receipt = document.getElementById('receipt');
                                                    
                                                    window.html2canvas(receipt, {
                                                      scale: 2,
                                                      useCORS: true,
                                                      logging: false,
                                                      backgroundColor: '#ffffff'
                                                    }).then(canvas => {
                                                      const imgData = canvas.toDataURL('image/png');
                                                      const pdf = new jsPDF({
                                                        orientation: 'portrait',
                                                        unit: 'mm',
                                                        format: 'a4'
                                                      });
                                                      
                                                      const imgWidth = 210;
                                                      const pageHeight = 297;
                                                      const imgHeight = canvas.height * imgWidth / canvas.width;
                                                      
                                                      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                                                      
                                                      if (imgHeight > pageHeight) {
                                                        let heightLeft = imgHeight - pageHeight;
                                                        let position = -pageHeight;
                                                        
                                                        while (heightLeft > 0) {
                                                          position = position - pageHeight;
                                                          pdf.addPage();
                                                          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                                                          heightLeft -= pageHeight;
                                                        }
                                                      }
                                                      
                                                      pdf.save('Payment-Receipt-${payment.patientName?.replace(/\s+/g, '-')}-${receiptNumber}.pdf');
                                                      
                                                      document.getElementById('loading').style.display = 'none';
                                                      setTimeout(() => {
                                                        window.close();
                                                      }, 500);
                                                    });
                                                  }
                                                  
                                                  window.onload = function() {
                                                    setTimeout(downloadPDF, 1000);
                                                  };
                                                </script>
                                              </body>
                                            </html>
                                          `);
                                          
                                          pdfWindow.document.close();
                                        };
                                        
                                        generatePaymentPDF(payment);
                                      }}
                                    >
                                      <FileDown className="mr-2 h-4 w-4" />
                                      Download PDF
                                    </button>
                                    <hr className="my-1" />
                                    <button 
                                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                      onClick={async () => {
                                        setOpenPopoverId(null);
                                        if (confirm(`Are you sure you want to delete the payment record for ${payment.patientName}? This action cannot be undone.`)) {
                                          try {
                                            console.log('Attempting to delete payment with ID:', payment.id);
                                            
                                            const response = await fetch(`/api/payments/${payment.id}`, {
                                              method: 'DELETE'
                                            });
                                            
                                            if (!response.ok) {
                                              const errorData = await response.json();
                                              console.error('Delete request failed:', errorData);
                                              throw new Error(errorData.error || `Failed to delete payment (${response.status})`);
                                            }
                                            
                                            const result = await response.json();
                                            console.log('Payment deleted successfully:', result);
                                            
                                            // Refresh the payments list
                                            await fetchPayments();
                                            
                                            // Show success message
                                            toast.success('Payment record deleted successfully');
                                          } catch (error) {
                                            console.error('Error deleting payment:', error);
                                            toast.error(`Failed to delete payment record: ${error.message}`);
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Entry
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {filteredPayments.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by recording your first payment.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Summary */}
        <div className="space-y-6">
          <Card className="shadow-lg border border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardTitle className="text-lg font-semibold">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paymentMethodSummary.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {method.method === 'Card' ? (
                        <CreditCard size={16} className="text-blue-500 mr-3" />
                      ) : method.method === 'Cash' ? (
                        <DollarSign size={16} className="text-green-500 mr-3" />
                      ) : (
                        <FileText size={16} className="text-purple-500 mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{method.method}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{method.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(method.total)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{method.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border border-gray-100 dark:border-gray-800">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => openModal('processPayment')}>
                  <Plus size={16} className="mr-2" />
                  Record New Payment
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => {
                  // Export payments data as CSV
                  const headers = ['Patient Name', 'Patient ID', 'Date', 'Amount', 'Method', 'Description'];
                  const csvContent = [
                    headers.join(','),
                    ...filteredPayments.map(payment => [
                      payment.patientName,
                      payment.patientId,
                      payment.date,
                      payment.amount,
                      payment.method,
                      payment.description
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}>
                  <Download size={16} className="mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 