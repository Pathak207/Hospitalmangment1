'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PracticeSettings {
  practiceName: string;
  taxId: string;
  siteTitle: string;
  dateFormat: string;
  currency: string;
  phone: string;
  email: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  timezone?: string;
  website?: string;
}

interface SettingsContextType {
  settings: PracticeSettings;
  updateSettings: (newSettings: Partial<PracticeSettings>) => Promise<void>;
  formatDate: (date: string | Date) => string;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  getDateFormatPattern: () => string;
  isLoading: boolean;
  error: string | null;
}

const defaultSettings: PracticeSettings = {
  practiceName: "DoctorCare Medical Center",
  taxId: "XX-XXXXXXX",
  siteTitle: "DoctorCare Portal",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
  phone: "(555) 123-4567",
  email: "info@doctorcare.com",
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  timezone: 'UTC',
  website: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PracticeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from API on mount and when session changes
  useEffect(() => {
    if (session?.user && session.user.role !== 'super_admin') {
      loadSettings();
    } else if (session?.user?.role === 'super_admin') {
      // Super admin uses default settings
      setSettings(defaultSettings);
      setIsLoading(false);
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings/practice');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      } else {
        console.error('Failed to load practice settings');
        setError('Failed to load practice settings');
        // Keep default settings on error
      }
    } catch (error) {
      console.error('Error loading practice settings:', error);
      setError('Error loading practice settings');
      // Keep default settings on error
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings via API
  const updateSettings = async (newSettings: Partial<PracticeSettings>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/settings/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings({ ...defaultSettings, ...updatedSettings });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating practice settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to update settings');
      throw error; // Re-throw so calling component can handle it
    }
  };

  // Currency symbol mapping
  const getCurrencySymbol = (): string => {
    const currencySymbols: { [key: string]: string } = {
      // Major World Currencies
      'USD': '$',     // US Dollar
      'EUR': '€',     // Euro
      'GBP': '£',     // British Pound
      'JPY': '¥',     // Japanese Yen
      'CHF': 'CHF',   // Swiss Franc
      'CAD': 'C$',    // Canadian Dollar
      'AUD': 'A$',    // Australian Dollar
      'NZD': 'NZ$',   // New Zealand Dollar
      'CNY': '¥',     // Chinese Yuan
      'INR': '₹',     // Indian Rupee
      'KRW': '₩',     // South Korean Won
      'SGD': 'S$',    // Singapore Dollar
      'HKD': 'HK$',   // Hong Kong Dollar
      'NOK': 'kr',    // Norwegian Krone
      'SEK': 'kr',    // Swedish Krona
      'DKK': 'kr',    // Danish Krone
      'PLN': 'zł',    // Polish Zloty
      'CZK': 'Kč',    // Czech Koruna
      'HUF': 'Ft',    // Hungarian Forint
      'RUB': '₽',     // Russian Ruble
      'BRL': 'R$',    // Brazilian Real
      'MXN': '$',     // Mexican Peso
      'ARS': '$',     // Argentine Peso
      'CLP': '$',     // Chilean Peso
      'COP': '$',     // Colombian Peso
      'PEN': 'S/',    // Peruvian Sol
      'UYU': '$U',    // Uruguayan Peso
      'ZAR': 'R',     // South African Rand
      'EGP': '£',     // Egyptian Pound
      'NGN': '₦',     // Nigerian Naira
      'GHS': '₵',     // Ghanaian Cedi
      'KES': 'KSh',   // Kenyan Shilling
      'MAD': 'DH',    // Moroccan Dirham
      'TND': 'DT',    // Tunisian Dinar
      'AED': 'DH',    // UAE Dirham
      'SAR': '﷼',     // Saudi Riyal
      'QAR': '﷼',     // Qatari Riyal
      'KWD': 'KD',    // Kuwaiti Dinar
      'BHD': 'BD',    // Bahraini Dinar
      'OMR': '﷼',     // Omani Rial
      'JOD': 'JD',    // Jordanian Dinar
      'LBP': '£',     // Lebanese Pound
      'ILS': '₪',     // Israeli Shekel
      'TRY': '₺',     // Turkish Lira
      'IRR': '﷼',     // Iranian Rial
      'PKR': '₨',     // Pakistani Rupee
      'BDT': '৳',     // Bangladeshi Taka
      'LKR': '₨',     // Sri Lankan Rupee
      'NPR': '₨',     // Nepalese Rupee
      'AFN': '؋',     // Afghan Afghani
      'MMK': 'K',     // Myanmar Kyat
      'THB': '฿',     // Thai Baht
      'VND': '₫',     // Vietnamese Dong
      'LAK': '₭',     // Lao Kip
      'KHR': '៛',     // Cambodian Riel
      'MYR': 'RM',    // Malaysian Ringgit
      'IDR': 'Rp',    // Indonesian Rupiah
      'PHP': '₱',     // Philippine Peso
      'TWD': 'NT$',   // Taiwan New Dollar
      'MOP': 'MOP$',  // Macanese Pataca
      'BND': 'B$',    // Brunei Dollar
      'FJD': 'FJ$',   // Fijian Dollar
      'PGK': 'K',     // Papua New Guinea Kina
      'WST': 'WS$',   // Samoan Tala
      'TOP': 'T$',    // Tongan Paanga
      'VUV': 'VT',    // Vanuatu Vatu
      'SBD': 'SI$',   // Solomon Islands Dollar
      'NCL': 'F',     // New Caledonian Franc
      'XPF': 'F',     // CFP Franc
      'ETB': 'Br',    // Ethiopian Birr
      'UGX': 'USh',   // Ugandan Shilling
      'TZS': 'TSh',   // Tanzanian Shilling
      'RWF': 'RF',    // Rwandan Franc
      'BIF': 'FBu',   // Burundian Franc
      'DJF': 'Fdj',   // Djiboutian Franc
      'SOS': 'S',     // Somali Shilling
      'ERN': 'Nfk',   // Eritrean Nakfa
      'SDG': '£',     // Sudanese Pound
      'SSP': '£',     // South Sudanese Pound
      'LYD': 'LD',    // Libyan Dinar
      'DZD': 'DA',    // Algerian Dinar
      'AOA': 'Kz',    // Angolan Kwanza
      'BWP': 'P',     // Botswana Pula
      'SZL': 'E',     // Swazi Lilangeni
      'LSL': 'M',     // Lesotho Loti
      'NAD': 'N$',    // Namibian Dollar
      'ZMW': 'ZK',    // Zambian Kwacha
      'ZWL': 'Z$',    // Zimbabwean Dollar
      'MWK': 'MK',    // Malawian Kwacha
      'MZN': 'MT',    // Mozambican Metical
      'SCR': '₨',     // Seychellois Rupee
      'MUR': '₨',     // Mauritian Rupee
      'GMD': 'D',     // Gambian Dalasi
      'SLE': 'Le',    // Sierra Leonean Leone
      'LRD': 'L$',    // Liberian Dollar
      'CVE': '$',     // Cape Verdean Escudo
      'GNF': 'FG',    // Guinean Franc
      'MLI': 'F',     // Malian Franc
      'BFA': 'F',     // Burkinabé Franc
      'NER': 'F',     // West African CFA Franc
      'CIV': 'F',     // Ivorian Franc
      'SEN': 'F',     // Senegalese Franc
      'MRT': 'UM',    // Mauritanian Ouguiya
      'XOF': 'F',     // West African CFA Franc
      'XAF': 'F',     // Central African CFA Franc
      'KMF': 'CF',    // Comorian Franc
      'MGA': 'Ar',    // Malagasy Ariary
      'STN': 'Db',    // São Tomé and Príncipe Dobra
      // European Currencies
      'ISK': 'kr',    // Icelandic Krona
      'RON': 'lei',   // Romanian Leu
      'BGN': 'лв',    // Bulgarian Lev
      'HRK': 'kn',    // Croatian Kuna
      'RSD': 'дин',   // Serbian Dinar
      'BAM': 'KM',    // Bosnia and Herzegovina Convertible Mark
      'MKD': 'ден',   // Macedonian Denar
      'ALL': 'L',     // Albanian Lek
      'MDL': 'L',     // Moldovan Leu
      'UAH': '₴',     // Ukrainian Hryvnia
      'BYN': 'Br',    // Belarusian Ruble
      'GEL': '₾',     // Georgian Lari
      'AMD': '֏',     // Armenian Dram
      'AZN': '₼',     // Azerbaijani Manat
      'KZT': '₸',     // Kazakhstani Tenge
      'UZS': 'soʻm',  // Uzbekistani Som
      'KGS': 'сом',   // Kyrgyzstani Som
      'TJS': 'SM',    // Tajikistani Somoni
      'TMT': 'T',     // Turkmenistani Manat
      'MNT': '₮',     // Mongolian Tugrik
    };
    return currencySymbols[settings.currency] || '$';
  };

  // Format currency based on settings
  const formatCurrency = (amount: number): string => {
    const symbol = getCurrencySymbol();
    
    // Use Intl.NumberFormat for proper currency formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting if currency is not supported
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  // Format date based on settings
  const formatDate = (date: string | Date): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      
      // Month names for MMM format
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      switch (settings.dateFormat) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MMM DD, YYYY':
          return `${monthNames[dateObj.getMonth()]} ${day}, ${year}`;
        case 'MM/DD/YYYY':
        default:
          return `${month}/${day}/${year}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Get date format pattern for input placeholders
  const getDateFormatPattern = (): string => {
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return 'DD/MM/YYYY';
      case 'YYYY-MM-DD':
        return 'YYYY-MM-DD';
      case 'MMM DD, YYYY':
        return 'MMM DD, YYYY';
      case 'MM/DD/YYYY':
      default:
        return 'MM/DD/YYYY';
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    formatDate,
    formatCurrency,
    getCurrencySymbol,
    getDateFormatPattern,
    isLoading,
    error
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 