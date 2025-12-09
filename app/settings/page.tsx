'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useModal } from '@/components/ui/modal-provider';
import { useSettings } from '@/lib/settings-context';
import { User, Shield, Save, Building, Phone, Mail, MapPin, Clock, CheckSquare, Search, ChevronDown, Check, X, Palette, Download, FileText, Database, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DataBackupSettings from '@/components/settings/data-backup-settings';

// Define currency data with regions
const CURRENCY_DATA = [
  // Major World Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'Major Currencies' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Major Currencies' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'Major Currencies' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Major Currencies' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', region: 'Major Currencies' },
  
  // North America
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'North America' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', region: 'North America' },
  
  // Oceania
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Oceania' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', region: 'Oceania' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', region: 'Oceania' },
  
  // Asia
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'Asia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'Asia' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', region: 'Asia' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', region: 'Asia' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', region: 'Asia' },
  { code: 'TWD', name: 'Taiwan New Dollar', symbol: 'NT$', region: 'Asia' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', region: 'Asia' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', region: 'Asia' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', region: 'Asia' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', region: 'Asia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', region: 'Asia' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', region: 'Asia' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', region: 'Asia' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', region: 'Asia' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', region: 'Asia' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', region: 'Asia' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', region: 'Asia' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', region: 'Asia' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', region: 'Asia' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', region: 'Asia' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', region: 'Asia' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', region: 'Asia' },
  
  // Europe
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', region: 'Europe' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', region: 'Europe' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', region: 'Europe' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', region: 'Europe' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', region: 'Europe' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', region: 'Europe' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', region: 'Europe' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', region: 'Europe' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', region: 'Europe' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', region: 'Europe' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', region: 'Europe' },
  { code: 'BAM', name: 'Bosnia Convertible Mark', symbol: 'KM', region: 'Europe' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', region: 'Europe' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', region: 'Europe' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', region: 'Europe' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', region: 'Europe' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', region: 'Europe' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', region: 'Europe' },
  
  // Middle East
  { code: 'AED', name: 'UAE Dirham', symbol: 'DH', region: 'Middle East' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', region: 'Middle East' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', region: 'Middle East' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', region: 'Middle East' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', region: 'Middle East' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', region: 'Middle East' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD', region: 'Middle East' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: '£', region: 'Middle East' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', region: 'Middle East' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', region: 'Middle East' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', region: 'Middle East' },
  
  // Caucasus & Central Asia
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', region: 'Caucasus & Central Asia' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', region: 'Caucasus & Central Asia' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', region: 'Caucasus & Central Asia' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', region: 'Caucasus & Central Asia' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', region: 'Caucasus & Central Asia' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'сом', region: 'Caucasus & Central Asia' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', region: 'Caucasus & Central Asia' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', region: 'Caucasus & Central Asia' },
  
  // South America
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', region: 'South America' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', region: 'South America' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', region: 'South America' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', region: 'South America' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', region: 'South America' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', region: 'South America' },
  
  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'Africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', region: 'Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Africa' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', region: 'Africa' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', region: 'Africa' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', region: 'Africa' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'Africa' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'Africa' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', region: 'Africa' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', region: 'Africa' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', region: 'Africa' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', region: 'Africa' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', region: 'Africa' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', region: 'Africa' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', region: 'Africa' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', region: 'Africa' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', region: 'Africa' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD', region: 'Africa' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA', region: 'Africa' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: '£', region: 'Africa' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'F', region: 'Africa' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'F', region: 'Africa' },
];

// Searchable Currency Component
function CurrencySearch({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(CURRENCY_DATA);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get current currency info
  const currentCurrency = CURRENCY_DATA.find(currency => currency.code === value) || CURRENCY_DATA[0];
  
  // Filter currencies based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCurrencies(CURRENCY_DATA);
    } else {
      const filtered = CURRENCY_DATA.filter(currency =>
        currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        currency.symbol.includes(searchQuery)
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchQuery]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Group filtered currencies by region
  const groupedCurrencies = filteredCurrencies.reduce((acc, currency) => {
    if (!acc[currency.region]) {
      acc[currency.region] = [];
    }
    acc[currency.region].push(currency);
    return acc;
  }, {} as Record<string, typeof CURRENCY_DATA>);
  
  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 text-left flex items-center justify-between focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentCurrency.code} - {currentCurrency.name} ({currentCurrency.symbol})</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                placeholder="Search currencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          {/* Currency List */}
          <div className="max-h-64 overflow-y-auto">
            {Object.keys(groupedCurrencies).length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No currencies found matching "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedCurrencies).map(([region, currencies]) => (
                <div key={region}>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-700 sticky top-0">
                    {region}
                  </div>
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                        currency.code === value ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => handleSelect(currency.code)}
                    >
                      <span>{currency.code} - {currency.name} ({currency.symbol})</span>
                      {currency.code === value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SettingsComponentProps {
  openModal: ReturnType<typeof useModal>['openModal'];
}

// Add appointment type interface
interface AppointmentType {
  _id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  isActive?: boolean;
  sortOrder?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SettingsPage() {
  const { openModal } = useModal();
  const [activeMenu, setActiveMenu] = useState('practice');

  // Function to save all settings
  const saveAllSettings = () => {
    console.log("Saving all settings...");
    
    // Show loading toast
    const loadingToast = toast.loading('Saving settings...');
    
    // Trigger a save event that components can listen to
    const saveEvent = new CustomEvent('saveSettings');
    document.dispatchEvent(saveEvent);
    
    // Simulate saving process
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success('Settings saved successfully!');
      console.log("Save event dispatched!");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-gray-900/20 h-40 rounded-xl z-0"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pt-10 pb-8 relative z-10">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1 max-w-md">
                Configure your practice preferences, user profile, and system settings
              </p>
        </div>
            <Button variant="primary" className="shadow-md hover:shadow-lg flex items-center px-5 py-2.5" onClick={saveAllSettings}>
              <Save size={18} className="mr-2" />
            Save Changes
          </Button>
          </div>
        </div>
      </div>
      
      {/* Settings Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        <Card className="lg:col-span-1 overflow-hidden shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative z-10">
          <CardContent className="p-0">
            <div className="p-4 mb-2 bg-primary-500/10 dark:bg-primary-900/20">
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                Settings Menu
              </h3>
            </div>
            <nav className="flex flex-col">
              <button 
                className={`flex items-center gap-2 p-3 text-left transition-all duration-200 ease-in-out ${
                  activeMenu === 'practice' 
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-400 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                }`}
                onClick={() => setActiveMenu('practice')}
              >
                <div className={`p-1.5 rounded-lg ${
                  activeMenu === 'practice' 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <Building size={16} />
                </div>
                <div>
                  <span className="font-medium block">Practice Information</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Manage practice details</span>
                </div>
              </button>
              
              <button 
                className={`flex items-center gap-2 p-3 text-left transition-all duration-200 ease-in-out ${
                  activeMenu === 'branding' 
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-400 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                }`}
                onClick={() => setActiveMenu('branding')}
              >
                <div className={`p-1.5 rounded-lg ${
                  activeMenu === 'branding' 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <Palette size={16} />
                </div>
                <div>
                  <span className="font-medium block">Branding</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Customize appearance</span>
                </div>
              </button>
              
              <button 
                className={`flex items-center gap-2 p-3 text-left transition-all duration-200 ease-in-out ${
                  activeMenu === 'schedule' 
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-400 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                }`}
                onClick={() => setActiveMenu('schedule')}
              >
                <div className={`p-1.5 rounded-lg ${
                  activeMenu === 'schedule' 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <Clock size={16} />
                </div>
                <div>
                  <span className="font-medium block">Schedule</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Working hours & breaks</span>
                </div>
              </button>
              
              <button 
                className={`flex items-center gap-2 p-3 text-left transition-all duration-200 ease-in-out ${
                  activeMenu === 'appointments' 
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-400 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                }`}
                onClick={() => setActiveMenu('appointments')}
              >
                <div className={`p-1.5 rounded-lg ${
                  activeMenu === 'appointments' 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <CheckSquare size={16} />
                </div>
                <div>
                  <span className="font-medium block">Appointment Types & Pricing</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Manage appointment types</span>
                </div>
              </button>
              

              <button 
                className={`flex items-center gap-2 p-3 text-left transition-all duration-200 ease-in-out ${
                  activeMenu === 'backup' 
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-400 dark:text-primary-400 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                }`}
                onClick={() => setActiveMenu('backup')}
              >
                <div className={`p-1.5 rounded-lg ${
                  activeMenu === 'backup' 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  <Shield size={16} />
                </div>
                <div>
                  <span className="font-medium block">Data Backup</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Export your data</span>
                </div>
              </button>
            </nav>
          </CardContent>
        </Card>
        
        {/* Main Settings Content */}
        <Card className="lg:col-span-3 shadow-lg border-0 bg-white dark:bg-gray-900 overflow-hidden relative z-10">
          <CardContent className="p-0">
            {activeMenu === 'practice' && <PracticeInformation openModal={openModal} />}
            {activeMenu === 'branding' && <BrandingSettings openModal={openModal} />}
            {activeMenu === 'schedule' && <ScheduleSettings openModal={openModal} />}
            {activeMenu === 'appointments' && <AppointmentTypes openModal={openModal} />}

            {activeMenu === 'backup' && <DataBackupSettings openModal={openModal} />}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
        
// Practice Information Component
function PracticeInformation({ openModal }: SettingsComponentProps) {
  const { settings, updateSettings, formatCurrency } = useSettings();
  
  // Local state for form inputs (controlled components)
  const [localSettings, setLocalSettings] = useState({
    practiceName: settings.practiceName,
    taxId: settings.taxId,
    siteTitle: settings.siteTitle,
    dateFormat: settings.dateFormat,
    currency: settings.currency,
    phone: settings.phone,
    email: settings.email
  });
  
  // Update local state when context settings change
  useEffect(() => {
    setLocalSettings({
      practiceName: settings.practiceName,
      taxId: settings.taxId,
      siteTitle: settings.siteTitle,
      dateFormat: settings.dateFormat,
      currency: settings.currency,
      phone: settings.phone,
      email: settings.email
    });
  }, [settings]);
  
  // Ref to store current settings
  const practiceSettingsRef = useRef(localSettings);
  
  // Update ref when state changes
  useEffect(() => {
    practiceSettingsRef.current = localSettings;
  }, [localSettings]);
  
  // Update local settings
  const updateLocalSettings = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };
  
  // Listen for save events from the parent component
  useEffect(() => {
    const handleSaveEvent = () => {
      // Update the global settings context
      updateSettings(practiceSettingsRef.current);
      console.log('Practice settings saved:', practiceSettingsRef.current);
    };
    
    document.addEventListener('saveSettings', handleSaveEvent);
    
    return () => {
      document.removeEventListener('saveSettings', handleSaveEvent);
    };
  }, [updateSettings]);
  
  return (
    <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            <Building size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Practice Information</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your practice details and contact information</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Practice Name
                      </label>
              <Input 
                className="w-full" 
                placeholder="Enter practice name" 
                value={localSettings.practiceName}
                onChange={(e) => updateLocalSettings('practiceName', e.target.value)}
              />
                    </div>
                    <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tax ID / EIN
                      </label>
              <Input 
                className="w-full" 
                placeholder="Enter Tax ID" 
                value={localSettings.taxId}
                onChange={(e) => updateLocalSettings('taxId', e.target.value)}
              />
                    </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2 mr-2">
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              System Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Site Title
                      </label>
                <Input 
                  className="w-full" 
                  placeholder="Enter site title" 
                  value={localSettings.siteTitle}
                  onChange={(e) => updateLocalSettings('siteTitle', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Appears in browser tab and system emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Format
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={localSettings.dateFormat}
                  onChange={(e) => updateLocalSettings('dateFormat', e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Format for all dates across the system</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <CurrencySearch value={localSettings.currency} onChange={(value) => updateLocalSettings('currency', value)} />
                <p className="text-xs text-gray-500 mt-1">Used for billing and financial reports</p>
              </div>
                    </div>
                  </div>
                  
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Practice Type
            </label>
            <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
              <option value="family-practice">Family Practice</option>
              <option value="internal-medicine">Internal Medicine</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="cardiology">Cardiology</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="obgyn">Obstetrics & Gynecology</option>
              <option value="multi-specialty">Multi-Specialty Group</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
                      </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-gray-400" />
                </div>
                <Input 
                  className="pl-10" 
                  placeholder="Enter phone number" 
                  value={localSettings.phone}
                  onChange={(e) => updateLocalSettings('phone', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <Input 
                  className="pl-10" 
                  placeholder="Enter email address" 
                  value={localSettings.email}
                  onChange={(e) => updateLocalSettings('email', e.target.value)}
                />
              </div>
            </div>
          </div>
          
                    <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Practice Address
                      </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin size={16} className="text-gray-400" />
              </div>
              <Input 
                className="pl-10" 
                placeholder="Enter street address" 
                defaultValue="123 Medical Center Dr."
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Input 
                placeholder="City" 
                defaultValue="Healthville"
              />
              <Input 
                placeholder="State/Province" 
                defaultValue="CA"
              />
              <Input 
                placeholder="Zip/Postal Code" 
                defaultValue="12345"
                      />
                    </div>
                  </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Schedule Settings Component
function ScheduleSettings({ openModal }: SettingsComponentProps) {
  // Default settings state
  const [settings, setSettings] = useState({
    interval: 30,
    workDays: [1, 2, 3, 4, 5], // Monday to Friday by default
    daySettings: {
      0: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Sunday
      1: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Monday
      2: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Tuesday
      3: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Wednesday
      4: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Thursday
      5: { startTime: '08:30 AM', endTime: '05:00 PM' }, // Friday
      6: { startTime: '08:30 AM', endTime: '05:00 PM' }  // Saturday
    },
    lunchBreak: {
      start: '12:30 PM',
      end: '01:30 PM',
      enabled: true
    }
  });
  
  // Ref to store current settings
  const settingsRef = useRef(settings);
  
  // Update ref when state changes
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  // Load saved settings on component mount
  useEffect(() => {
    // Load schedule settings from localStorage
    const savedSettings = localStorage.getItem('scheduleSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        
        // Handle migration from old format to new format
        if (!parsed.daySettings) {
          // Create daySettings from old startTime/endTime
          const daySettings = {
            0: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            1: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            2: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            3: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            4: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            5: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' },
            6: { startTime: parsed.startTime || '08:30 AM', endTime: parsed.endTime || '05:00 PM' }
          };
          
          const newSettings = {
            ...parsed,
            daySettings
          };
          
          // Remove old properties
          delete newSettings.startTime;
          delete newSettings.endTime;
          
          setSettings(newSettings);
        } else {
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
    
    // Listen for save events from the parent component
    const handleSaveEvent = () => {
      // Save all current settings to localStorage
      localStorage.setItem('scheduleSettings', JSON.stringify(settingsRef.current));
      console.log("Schedule settings saved:", settingsRef.current);
    };
    
    document.addEventListener('saveSettings', handleSaveEvent);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('saveSettings', handleSaveEvent);
    };
  }, []); // Remove settings dependency
  
  // Toggle a day in the workDays array
  const toggleWorkDay = (dayIndex: number) => {
    const updatedWorkDays = [...settings.workDays];
    
    if (updatedWorkDays.includes(dayIndex)) {
      // Remove day if it's already in the array
      const index = updatedWorkDays.indexOf(dayIndex);
      updatedWorkDays.splice(index, 1);
    } else {
      // Add day if it's not in the array
      updatedWorkDays.push(dayIndex);
      // Sort the array to keep days in order
      updatedWorkDays.sort();
    }
    
    updateSettings('workDays', updatedWorkDays);
  };
  
  // Update a specific setting and save to localStorage
  const updateSettings = (key: string, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    localStorage.setItem('scheduleSettings', JSON.stringify(updatedSettings));
  };
  
  // Update a day's time settings
  const updateDaySettings = (dayIndex: number, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      daySettings: {
        ...prev.daySettings,
      [dayIndex]: {
          ...prev.daySettings[dayIndex],
        [field]: value
      }
      }
    }));
  };
  
  return (
    <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            <Clock size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Schedule Settings</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure working hours and breaks</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Working Hours
            </h3>
            
            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => {
                // Add 1 because our workDays array uses 1 for Monday, etc.
                const dayIndex = index + 1;
                const isDayEnabled = settings.workDays.includes(dayIndex);
                const daySettings = settings.daySettings[dayIndex];
                
                return (
                  <div key={day} className="flex items-center justify-between">
                    <span className="w-28">{day}</span>
                    <div className="flex items-center">
                      <select 
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        disabled={!isDayEnabled}
                        value={daySettings.startTime}
                        onChange={(e) => updateDaySettings(dayIndex, 'startTime', e.target.value)}
                      >
                        <option value="08:00 AM">8:00 AM</option>
                        <option value="08:30 AM">8:30 AM</option>
                        <option value="09:00 AM">9:00 AM</option>
                        <option value="09:30 AM">9:30 AM</option>
                      </select>
                      <span className="mx-2">—</span>
                      <select 
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        disabled={!isDayEnabled}
                        value={daySettings.endTime}
                        onChange={(e) => updateDaySettings(dayIndex, 'endTime', e.target.value)}
                      >
                        <option value="05:00 PM">5:00 PM</option>
                        <option value="05:30 PM">5:30 PM</option>
                        <option value="06:00 PM">6:00 PM</option>
                        <option value="06:30 PM">6:30 PM</option>
                      </select>
                      <div className="flex items-center ml-4">
                        <input
                          type="checkbox"
                          id={`enabled-${day}`}
                          className="h-4 w-4 text-primary-600 rounded border-gray-300"
                          checked={isDayEnabled}
                          onChange={() => toggleWorkDay(dayIndex)}
                        />
                        <label htmlFor={`enabled-${day}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Enabled
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {['Saturday', 'Sunday'].map((day, index) => {
                // Add index of 6 for Saturday, 0 for Sunday to match Date.getDay() values
                const dayIndex = day === 'Saturday' ? 6 : 0;
                const isDayEnabled = settings.workDays.includes(dayIndex);
                const daySettings = settings.daySettings[dayIndex];
                
                return (
                  <div key={day} className="flex items-center justify-between">
                    <span className="w-28">{day}</span>
                    <div className="flex items-center">
                      <select 
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        disabled={!isDayEnabled}
                        value={daySettings.startTime}
                        onChange={(e) => updateDaySettings(dayIndex, 'startTime', e.target.value)}
                      >
                        <option value="08:00 AM">8:00 AM</option>
                        <option value="08:30 AM">8:30 AM</option>
                        <option value="09:00 AM">9:00 AM</option>
                        <option value="09:30 AM">9:30 AM</option>
                      </select>
                      <span className="mx-2">—</span>
                      <select 
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        disabled={!isDayEnabled}
                        value={daySettings.endTime}
                        onChange={(e) => updateDaySettings(dayIndex, 'endTime', e.target.value)}
                      >
                        <option value="05:00 PM">5:00 PM</option>
                        <option value="05:30 PM">5:30 PM</option>
                        <option value="06:00 PM">6:00 PM</option>
                        <option value="06:30 PM">6:30 PM</option>
                      </select>
                      <div className="flex items-center ml-4">
                        <input
                          type="checkbox"
                          id={`enabled-${day}`}
                          className="h-4 w-4 text-primary-600 rounded border-gray-300"
                          checked={isDayEnabled}
                          onChange={() => toggleWorkDay(dayIndex)}
                        />
                        <label htmlFor={`enabled-${day}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Enabled
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Appointment Duration Default</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Default time slot duration for appointments</p>
              </div>
              <select 
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={settings.interval.toString()}
                onChange={(e) => updateSettings('interval', parseInt(e.target.value))}
              >
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Lunch Break</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Set a lunch break time in the schedule</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lunch-break-enabled"
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                  checked={settings.lunchBreak.enabled}
                  onChange={(e) => updateSettings('lunchBreak', {...settings.lunchBreak, enabled: e.target.checked})}
                />
                <label htmlFor="lunch-break-enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable lunch break
                </label>
              </div>
            </div>
            
            {settings.lunchBreak.enabled && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <select 
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      value={settings.lunchBreak.start}
                      onChange={(e) => updateSettings('lunchBreak', {...settings.lunchBreak, start: e.target.value})}
                    >
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="12:30 PM">12:30 PM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="01:30 PM">01:30 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <select 
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      value={settings.lunchBreak.end}
                      onChange={(e) => updateSettings('lunchBreak', {...settings.lunchBreak, end: e.target.value})}
                    >
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      </Card>
  );
}

// Branding Settings Component
function BrandingSettings({ openModal }: SettingsComponentProps) {
  // State to store branding settings
  const [brandingSettings, setBrandingSettings] = useState({
    appName: '',
    appTagline: '',
    logoText: '',
    footerText: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasSettings, setHasSettings] = useState(false);
  
  // Ref to store current settings
  const brandingSettingsRef = useRef(brandingSettings);
  
  // Update ref when state changes
  useEffect(() => {
    brandingSettingsRef.current = brandingSettings;
  }, [brandingSettings]);
  
  // Listen for save events from the parent component
  useEffect(() => {
    const handleSaveEvent = async () => {
      try {
        const response = await fetch('/api/settings/branding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(brandingSettingsRef.current),
        });
        
        if (response.ok) {
          console.log('Branding settings saved successfully');
          // Trigger a custom event to notify components to refresh
          window.dispatchEvent(new CustomEvent('brandingUpdated'));
        } else {
          console.error('Failed to save branding settings');
        }
      } catch (error) {
        console.error('Error saving branding settings:', error);
      }
    };
    
    document.addEventListener('saveSettings', handleSaveEvent);
    
    return () => {
      document.removeEventListener('saveSettings', handleSaveEvent);
    };
  }, []);
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings/branding');
        if (response.ok) {
          const settings = await response.json();
          setBrandingSettings({
            appName: settings.appName || 'DoctorCare',
            appTagline: settings.appTagline || 'Practice Management',
            logoText: settings.logoText || 'DC',
            footerText: settings.footerText || 'DoctorCare. All rights reserved.'
          });
          setHasSettings(true);
        } else {
          console.error('Failed to load branding settings');
          setHasSettings(false);
        }
      } catch (error) {
        console.error('Error loading branding settings:', error);
        setHasSettings(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const createNewSettings = () => {
    setBrandingSettings({
      appName: 'DoctorCare',
      appTagline: 'Practice Management',
      logoText: 'DC',
      footerText: 'DoctorCare. All rights reserved.'
    });
    setHasSettings(true);
  };
  
  return (
    <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            <Palette size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Branding & Appearance</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Customize the app title, tagline, and footer text</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading branding settings...</p>
            </div>
          </div>
        ) : !hasSettings ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Branding Settings Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Create your branding settings to customize the app appearance.</p>
              <button 
                onClick={createNewSettings}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Branding Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard mr-2">
                  <rect width="7" height="9" x="3" y="3" rx="1"/>
                  <rect width="7" height="5" x="14" y="3" rx="1"/>
                  <rect width="7" height="9" x="14" y="12" rx="1"/>
                  <rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
                Sidebar Branding
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Name
                  </label>
                  <Input 
                    className="w-full" 
                    placeholder="Enter app name" 
                    value={brandingSettings.appName}
                    onChange={(e) => setBrandingSettings(prev => ({ ...prev, appName: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Main title displayed in the sidebar</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Tagline
                  </label>
                  <Input 
                    className="w-full" 
                    placeholder="Enter tagline" 
                    value={brandingSettings.appTagline}
                    onChange={(e) => setBrandingSettings(prev => ({ ...prev, appTagline: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Subtitle shown below the app name</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Logo Text
                  </label>
                  <Input 
                    className="w-full" 
                    placeholder="Enter logo text" 
                    value={brandingSettings.logoText}
                    onChange={(e) => setBrandingSettings(prev => ({ ...prev, logoText: e.target.value }))}
                    maxLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Short text shown in the logo (max 4 chars)</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-footer mr-2">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M3 15h18"/>
                </svg>
                Footer Settings
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Footer Text
                </label>
                <Input 
                  className="w-full" 
                  placeholder="Enter footer text" 
                  value={brandingSettings.footerText}
                  onChange={(e) => setBrandingSettings(prev => ({ ...prev, footerText: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Text displayed at the bottom of each page. Year will be added automatically.</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info text-blue-600 dark:text-blue-400 mt-0.5 mr-3">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Preview Changes</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Changes will be reflected immediately in the sidebar and footer after saving. The year in the footer is added automatically.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 

// Appointment Types Component
function AppointmentTypes({ openModal }: SettingsComponentProps) {
  const { formatCurrency } = useSettings();
  
  // Appointment types state - loaded from database
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(true);

  // State for appointment type modal
  const [showAppointmentTypeModal, setShowAppointmentTypeModal] = useState(false);
  const [editingAppointmentType, setEditingAppointmentType] = useState<AppointmentType | null>(null);
  const [appointmentTypeForm, setAppointmentTypeForm] = useState({
    name: '',
    duration: 30,
    price: 0,
    color: '#3B82F6'
  });

  // Load appointment types from database
  const loadAppointmentTypes = async () => {
    try {
      setAppointmentTypesLoading(true);
      const response = await fetch('/api/appointment-types');
      if (response.ok) {
        const types = await response.json();
        setAppointmentTypes(types);
      } else {
        console.error('Failed to load appointment types');
        toast.error('Failed to load appointment types');
      }
    } catch (error) {
      console.error('Error loading appointment types:', error);
      toast.error('Failed to load appointment types');
    } finally {
      setAppointmentTypesLoading(false);
    }
  };

  // Load appointment types on component mount
  useEffect(() => {
    loadAppointmentTypes();
  }, []);

  // Appointment type management functions
  const openAppointmentTypeModal = (type: AppointmentType | null = null) => {
    if (type) {
      setEditingAppointmentType(type);
      setAppointmentTypeForm({
        name: type.name,
        duration: type.duration,
        price: type.price || 0,
        color: type.color
      });
    } else {
      setEditingAppointmentType(null);
      setAppointmentTypeForm({
        name: '',
        duration: 30,
        price: 0,
        color: '#3B82F6'
      });
    }
    setShowAppointmentTypeModal(true);
  };

  const closeAppointmentTypeModal = () => {
    setShowAppointmentTypeModal(false);
    setEditingAppointmentType(null);
    setAppointmentTypeForm({
      name: '',
      duration: 30,
      price: 0,
      color: '#3B82F6'
    });
  };

  const saveAppointmentType = async () => {
    if (!appointmentTypeForm.name.trim()) {
      toast.error('Please enter an appointment type name');
      return;
    }

    try {
      const method = editingAppointmentType ? 'PUT' : 'POST';
      const url = editingAppointmentType 
        ? `/api/appointment-types/${editingAppointmentType._id}` 
        : '/api/appointment-types';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentTypeForm),
      });

      if (response.ok) {
        toast.success(`Appointment type ${editingAppointmentType ? 'updated' : 'created'} successfully`);
        closeAppointmentTypeModal();
        loadAppointmentTypes(); // Reload the list
        
        // Dispatch event to refresh appointment forms
        const event = new CustomEvent('appointmentTypesUpdated');
        document.dispatchEvent(event);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save appointment type');
      }
    } catch (error) {
      console.error('Error saving appointment type:', error);
      toast.error('Failed to save appointment type');
    }
  };

  const deleteAppointmentType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this appointment type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointment-types/${typeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Appointment type deleted successfully');
        loadAppointmentTypes(); // Reload the list
        
        // Dispatch event to refresh appointment forms
        const event = new CustomEvent('appointmentTypesUpdated');
        document.dispatchEvent(event);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete appointment type');
      }
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      toast.error('Failed to delete appointment type');
    }
  };

  return (
    <Card className="shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <div className="p-2 mr-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            <CheckSquare size={20} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Appointment Types & Pricing</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage appointment types, durations, and pricing</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Appointment Types
              </h3>
              <Button 
                onClick={() => openAppointmentTypeModal()}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="M12 5v14"/>
                </svg>
                Add Appointment Type
              </Button>
            </div>
            
            <div className="space-y-3">
              {appointmentTypesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading appointment types...</p>
                </div>
              ) : appointmentTypes.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <CheckSquare size={48} className="mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No appointment types yet</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first appointment type to get started with scheduling.</p>
                  <Button 
                    onClick={() => openAppointmentTypeModal()}
                    className="inline-flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/>
                      <path d="M12 5v14"/>
                    </svg>
                    Add Your First Appointment Type
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {appointmentTypes.map((type) => (
                    <div key={type._id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: type.color }}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{type.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock size={14} />
                                {type.duration} minutes
                              </span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(type.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAppointmentTypeModal(type)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteAppointmentType(type._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Appointment Type Modal */}
      {showAppointmentTypeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeAppointmentTypeModal}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingAppointmentType ? 'Edit Appointment Type' : 'Add Appointment Type'}
                  </h3>
                  <button
                    onClick={closeAppointmentTypeModal}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={appointmentTypeForm.name}
                      onChange={(e) => setAppointmentTypeForm({...appointmentTypeForm, name: e.target.value})}
                      placeholder="e.g., Consultation, Follow-up"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (minutes)
                      </label>
                      <Input
                        type="number"
                        value={appointmentTypeForm.duration}
                        onChange={(e) => setAppointmentTypeForm({...appointmentTypeForm, duration: parseInt(e.target.value) || 30})}
                        min="5"
                        max="480"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price
                      </label>
                      <Input
                        type="number"
                        value={appointmentTypeForm.price}
                        onChange={(e) => setAppointmentTypeForm({...appointmentTypeForm, price: parseFloat(e.target.value) || 0})}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={appointmentTypeForm.color}
                        onChange={(e) => setAppointmentTypeForm({...appointmentTypeForm, color: e.target.value})}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={appointmentTypeForm.color}
                        onChange={(e) => setAppointmentTypeForm({...appointmentTypeForm, color: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeAppointmentTypeModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveAppointmentType}
                    className="flex-1"
                  >
                    {editingAppointmentType ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}