'use client';

import { useState, useEffect } from 'react';
import { formatCurrencyDisplay, formatCurrencyIntl, getCurrencySymbol } from './currency-utils';

// Custom hook for super admin global currency settings
export function useGlobalCurrency() {
  const [currency, setCurrency] = useState('USD'); // Default to USD
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch global currency settings
  useEffect(() => {
    const fetchGlobalCurrency = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/global-currency');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.currency) {
            setCurrency(data.currency);
          }
        } else {
          console.warn('Failed to fetch global currency settings, using default');
        }
      } catch (err) {
        console.error('Error fetching global currency:', err);
        setError('Failed to load currency settings');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalCurrency();
  }, []);

  // Format currency using the global currency setting
  const formatAmount = (amount, options = {}) => {
    const { useIntl = false, locale = 'en-US', showDecimals = 'auto' } = options;
    
    if (useIntl) {
      return formatCurrencyIntl(amount, currency, locale);
    } else {
      return formatCurrencyDisplay(amount, currency);
    }
  };

  // Get currency symbol for the global currency
  const getSymbol = () => {
    return getCurrencySymbol(currency);
  };

  // Format amount with billing cycle (for subscriptions)
  const formatWithBilling = (amount, billingCycle = 'monthly') => {
    const formattedAmount = formatAmount(amount);
    const suffix = billingCycle === 'yearly' ? '/yr' : '/mo';
    return `${formattedAmount}${suffix}`;
  };

  return {
    currency,
    loading,
    error,
    formatAmount,
    getSymbol,
    formatWithBilling,
    setCurrency // Allow manual override if needed
  };
}

export default useGlobalCurrency;
