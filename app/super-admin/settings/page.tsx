'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Save,
  Globe,
  Mail,
  Shield,
  Database,
  Bell,
  Key,
  Users,
  CreditCard,
  Zap
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const [settings, setSettings] = useState({
    general: {
      platformName: 'DoctorCare',
      platformDescription: 'Practice Management System',
      supportEmail: 'support@doctorcare.com',
      timezone: 'UTC',
      currency: 'USD',
    },
    login: {
      pageTitle: 'Welcome to DoctorCare',
      subtitle: 'Your comprehensive practice management solution',
      buttonText: 'Sign In',
      footerText: 'DoctorCare. All rights reserved.',
      sidePanelTitle: 'Modern Healthcare Management',
      sidePanelDescription: 'Streamline your practice with our comprehensive management system designed for modern healthcare providers.',
      features: [
        'Patient Management',
        'Appointment Scheduling',
        'Medical Records',
        'Billing & Payments'
      ],
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      paymentAlerts: true,
      systemAlerts: true,
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      allowPasswordReset: true,
    },
    paymentGateway: {
      mode: 'test', // 'test' or 'live'
      test: {
        stripePublicKey: '',
        stripeSecretKey: '',
        webhookSecret: '',
      },
      live: {
        stripePublicKey: '',
        stripeSecretKey: '',
        webhookSecret: '',
      },
      taxRate: 0,
    },
    email: {
      enabled: true,
      provider: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromName: 'DoctorCare',
      fromEmail: 'noreply@doctorcare.com',
      providerSettings: {
        sendgrid: {
          apiKey: '',
        },
        mailgun: {
          apiKey: '',
          domain: '',
        },
      },
      // Provider-specific configurations
      providers: {
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
        },
        gmail: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
        },
        outlook: {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
        },
        sendgrid: {
          apiKey: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
        },
        mailgun: {
          apiKey: '',
          domain: '',
          fromName: 'DoctorCare',
          fromEmail: 'noreply@doctorcare.com',
        },
      },
    }
  });

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
      loadSettings();
    }
  }, [session, status, router]);

  const loadSettings = async () => {
    try {
      // Load login settings
      const loginResponse = await fetch('/api/settings/login');
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData) {
          setSettings(prev => ({
            ...prev,
            login: {
              pageTitle: loginData.pageTitle || 'Welcome to DoctorCare',
              subtitle: loginData.subtitle || 'Your comprehensive practice management solution',
              buttonText: loginData.buttonText || 'Sign In',
              footerText: loginData.footerText || 'DoctorCare. All rights reserved.',
              sidePanelTitle: loginData.sidePanelTitle || 'Modern Healthcare Management',
              sidePanelDescription: loginData.sidePanelDescription || 'Streamline your practice with our comprehensive management system designed for modern healthcare providers.',
              features: loginData.features || [
                'Patient Management',
                'Appointment Scheduling',
                'Medical Records',
                'Billing & Payments'
              ],
            }
          }));
        }
      }
      
      // Load payment gateway and other settings
      const paymentGatewayResponse = await fetch('/api/settings/payment-gateway');
      if (paymentGatewayResponse.ok) {
        const gatewayData = await paymentGatewayResponse.json();
        setSettings(prev => ({
          ...prev,
          general: gatewayData.general || prev.general,
          notifications: gatewayData.notifications || prev.notifications,
          security: gatewayData.security || prev.security,
          paymentGateway: gatewayData.paymentGateway || prev.paymentGateway,
          email: {
            ...prev.email,
            ...gatewayData.email,
            // Ensure providers structure exists
            providers: gatewayData.email?.providers || prev.email.providers,
          },
        }));
        console.log('Payment gateway settings loaded successfully');
        console.log('Loaded email settings:', gatewayData.email);
      }
      
      console.log('All settings loaded successfully');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('handleSave called with activeTab:', activeTab);
      
      // Save login settings
      if (activeTab === 'login') {
        const loginResponse = await fetch('/api/settings/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings.login),
        });
        
        if (loginResponse.ok) {
          alert('Login settings saved successfully!');
        } else {
          alert('Error saving login settings');
        }
      } 
      else {
        // Save payment gateway and other settings
        console.log('Saving settings...', settings);
        console.log('Email settings being saved:', settings.email);
        
        const paymentGatewayResponse = await fetch('/api/settings/payment-gateway', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            general: settings.general,
            notifications: settings.notifications,
            security: settings.security,
            paymentGateway: settings.paymentGateway,
            email: settings.email,
          }),
        });
        
        if (paymentGatewayResponse.ok) {
          const result = await paymentGatewayResponse.json();
          console.log('Payment gateway settings saved:', result);
        alert('Settings saved successfully!');
        } else {
          const error = await paymentGatewayResponse.json().catch(() => ({}));
          console.error('Error saving payment gateway settings:', error);
          alert('Error saving settings: ' + (error.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => {
      const newSettings = {
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      }
      };

      // Handle email provider change - save current settings and load new provider settings
      if (category === 'email' && key === 'provider') {
        const currentProvider = prev.email.provider;
        
        // Initialize providers if not exists (for data loaded from API)
        if (!newSettings.email.providers) {
          newSettings.email.providers = {
            smtp: {
              host: 'smtp.example.com',
              port: 587,
              secure: false,
              username: '',
              password: '',
              fromName: 'DoctorCare',
              fromEmail: 'noreply@doctorcare.com',
            },
            gmail: {
              host: 'smtp.gmail.com',
              port: 587,
              secure: false,
              username: '',
              password: '',
              fromName: 'DoctorCare',
              fromEmail: 'noreply@doctorcare.com',
            },
            outlook: {
              host: 'smtp-mail.outlook.com',
              port: 587,
              secure: false,
              username: '',
              password: '',
              fromName: 'DoctorCare',
              fromEmail: 'noreply@doctorcare.com',
            },
            sendgrid: {
              apiKey: '',
              fromName: 'DoctorCare',
              fromEmail: 'noreply@doctorcare.com',
            },
            mailgun: {
              apiKey: '',
              domain: '',
              fromName: 'DoctorCare',
              fromEmail: 'noreply@doctorcare.com',
            },
          };
        }
        
                 // Save current settings to the current provider's configuration
         if (currentProvider && newSettings.email.providers[currentProvider]) {
           if (['smtp', 'gmail', 'outlook'].includes(currentProvider)) {
             newSettings.email.providers[currentProvider] = {
               ...newSettings.email.providers[currentProvider],
               host: prev.email.host,
               port: prev.email.port,
               secure: prev.email.secure,
               username: prev.email.username,
               password: prev.email.password,
               fromName: prev.email.fromName,
               fromEmail: prev.email.fromEmail,
             };
           } else if (currentProvider === 'sendgrid') {
             newSettings.email.providers[currentProvider] = {
               ...newSettings.email.providers[currentProvider],
               apiKey: prev.email.providerSettings?.sendgrid?.apiKey || '',
               fromName: prev.email.fromName,
               fromEmail: prev.email.fromEmail,
             };
           } else if (currentProvider === 'mailgun') {
             newSettings.email.providers[currentProvider] = {
               ...newSettings.email.providers[currentProvider],
               apiKey: prev.email.providerSettings?.mailgun?.apiKey || '',
               domain: prev.email.providerSettings?.mailgun?.domain || '',
               fromName: prev.email.fromName,
               fromEmail: prev.email.fromEmail,
             };
           }
         }

        // Load settings for the new provider
        const newProviderSettings = newSettings.email.providers[value];
        if (newProviderSettings) {
          if (['smtp', 'gmail', 'outlook'].includes(value)) {
            newSettings.email.host = newProviderSettings.host;
            newSettings.email.port = newProviderSettings.port;
            newSettings.email.secure = newProviderSettings.secure;
            newSettings.email.username = newProviderSettings.username;
            newSettings.email.password = newProviderSettings.password;
            newSettings.email.fromName = newProviderSettings.fromName;
            newSettings.email.fromEmail = newProviderSettings.fromEmail;
          } else if (value === 'sendgrid') {
            newSettings.email.host = '';
            newSettings.email.port = 587;
            newSettings.email.secure = false;
            newSettings.email.username = '';
            newSettings.email.password = '';
            newSettings.email.fromName = newProviderSettings.fromName;
            newSettings.email.fromEmail = newProviderSettings.fromEmail;
            newSettings.email.providerSettings.sendgrid.apiKey = newProviderSettings.apiKey;
          } else if (value === 'mailgun') {
            newSettings.email.host = '';
            newSettings.email.port = 587;
            newSettings.email.secure = false;
            newSettings.email.username = '';
            newSettings.email.password = '';
            newSettings.email.fromName = newProviderSettings.fromName;
            newSettings.email.fromEmail = newProviderSettings.fromEmail;
            newSettings.email.providerSettings.mailgun.apiKey = newProviderSettings.apiKey;
            newSettings.email.providerSettings.mailgun.domain = newProviderSettings.domain;
          }
        }
      }

             // Update provider-specific settings when individual fields change
       if (category === 'email' && key !== 'provider') {
         // Initialize providers if not exists
         if (!newSettings.email.providers) {
           newSettings.email.providers = {
             smtp: { host: 'smtp.example.com', port: 587, secure: false, username: '', password: '', fromName: 'DoctorCare', fromEmail: 'noreply@doctorcare.com' },
             gmail: { host: 'smtp.gmail.com', port: 587, secure: false, username: '', password: '', fromName: 'DoctorCare', fromEmail: 'noreply@doctorcare.com' },
             outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false, username: '', password: '', fromName: 'DoctorCare', fromEmail: 'noreply@doctorcare.com' },
             sendgrid: { apiKey: '', fromName: 'DoctorCare', fromEmail: 'noreply@doctorcare.com' },
             mailgun: { apiKey: '', domain: '', fromName: 'DoctorCare', fromEmail: 'noreply@doctorcare.com' },
           };
         }
         
         const currentProvider = newSettings.email.provider;
         if (currentProvider && newSettings.email.providers[currentProvider]) {
          if (['smtp', 'gmail', 'outlook'].includes(currentProvider)) {
            if (['host', 'port', 'secure', 'username', 'password', 'fromName', 'fromEmail'].includes(key)) {
              newSettings.email.providers[currentProvider][key] = value;
            }
          } else if (currentProvider === 'sendgrid') {
            if (['fromName', 'fromEmail'].includes(key)) {
              newSettings.email.providers[currentProvider][key] = value;
            }
          } else if (currentProvider === 'mailgun') {
            if (['fromName', 'fromEmail'].includes(key)) {
              newSettings.email.providers[currentProvider][key] = value;
            }
          }
        }
      }

      return newSettings;
    });
  };

  const updatePaymentGatewaySetting = (mode: 'test' | 'live', key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      paymentGateway: {
        ...prev.paymentGateway,
        [mode]: {
          ...prev.paymentGateway[mode],
          [key]: value,
        }
      }
    }));
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    
    setIsSendingTest(true);
    setTestEmailResult(null);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestEmailResult({
          success: true,
          message: result.message,
          testDetails: result.testDetails,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: result.error || 'Failed to send test email',
          details: result.details,
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestEmailResult({
        success: false,
        message: 'Network error: Could not send test email',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const updateLoginFeature = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      login: {
        ...prev.login,
        features: prev.login.features.map((feature, i) => i === index ? value : feature)
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'login', label: 'Login Page Content', icon: Key },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'paymentGateway', label: 'Setup Payment Gateway', icon: CreditCard },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure platform settings and preferences
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {activeTab === 'general' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Settings size={20} />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Platform Name
                      </label>
                      <Input
                        value={settings.general.platformName}
                        onChange={(e) => updateSetting('general', 'platformName', e.target.value)}
                        placeholder="Enter platform name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Support Email
                      </label>
                      <Input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                        placeholder="Enter support email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        {/* Major World Currencies */}
                        <option value="USD">🇺🇸 USD ($) - US Dollar</option>
                        <option value="EUR">🇪🇺 EUR (€) - Euro</option>
                        <option value="GBP">🇬🇧 GBP (£) - British Pound</option>
                        <option value="JPY">🇯🇵 JPY (¥) - Japanese Yen</option>
                        <option value="CAD">🇨🇦 CAD ($) - Canadian Dollar</option>
                        <option value="AUD">🇦🇺 AUD ($) - Australian Dollar</option>
                        <option value="CHF">🇨🇭 CHF (Fr) - Swiss Franc</option>
                        <option value="CNY">🇨🇳 CNY (¥) - Chinese Yuan</option>
                        
                        {/* Asian Currencies */}
                        <option value="INR">🇮🇳 INR (₹) - Indian Rupee</option>
                        <option value="KRW">🇰🇷 KRW (₩) - South Korean Won</option>
                        <option value="SGD">🇸🇬 SGD ($) - Singapore Dollar</option>
                        <option value="HKD">🇭🇰 HKD ($) - Hong Kong Dollar</option>
                        <option value="TWD">🇹🇼 TWD ($) - Taiwan Dollar</option>
                        <option value="THB">🇹🇭 THB (฿) - Thai Baht</option>
                        <option value="MYR">🇲🇾 MYR (RM) - Malaysian Ringgit</option>
                        <option value="IDR">🇮🇩 IDR (Rp) - Indonesian Rupiah</option>
                        <option value="PHP">🇵🇭 PHP (₱) - Philippine Peso</option>
                        <option value="VND">🇻🇳 VND (₫) - Vietnamese Dong</option>
                        <option value="PKR">🇵🇰 PKR (₨) - Pakistani Rupee</option>
                        <option value="BDT">🇧🇩 BDT (৳) - Bangladeshi Taka</option>
                        <option value="LKR">🇱🇰 LKR (Rs) - Sri Lankan Rupee</option>
                        
                        {/* Middle East & Africa */}
                        <option value="AED">🇦🇪 AED (د.إ) - UAE Dirham</option>
                        <option value="SAR">🇸🇦 SAR (﷼) - Saudi Riyal</option>
                        <option value="QAR">🇶🇦 QAR (﷼) - Qatari Riyal</option>
                        <option value="KWD">🇰🇼 KWD (د.ك) - Kuwaiti Dinar</option>
                        <option value="BHD">🇧🇭 BHD (.د.ب) - Bahraini Dinar</option>
                        <option value="OMR">🇴🇲 OMR (﷼) - Omani Rial</option>
                        <option value="JOD">🇯🇴 JOD (د.ا) - Jordanian Dinar</option>
                        <option value="ILS">🇮🇱 ILS (₪) - Israeli Shekel</option>
                        <option value="TRY">🇹🇷 TRY (₺) - Turkish Lira</option>
                        <option value="EGP">🇪🇬 EGP (£) - Egyptian Pound</option>
                        <option value="ZAR">🇿🇦 ZAR (R) - South African Rand</option>
                        <option value="NGN">🇳🇬 NGN (₦) - Nigerian Naira</option>
                        <option value="KES">🇰🇪 KES (Sh) - Kenyan Shilling</option>
                        <option value="GHS">🇬🇭 GHS (₵) - Ghanaian Cedi</option>
                        
                        {/* European Currencies */}
                        <option value="NOK">🇳🇴 NOK (kr) - Norwegian Krone</option>
                        <option value="SEK">🇸🇪 SEK (kr) - Swedish Krona</option>
                        <option value="DKK">🇩🇰 DKK (kr) - Danish Krone</option>
                        <option value="PLN">🇵🇱 PLN (zł) - Polish Zloty</option>
                        <option value="CZK">🇨🇿 CZK (Kč) - Czech Koruna</option>
                        <option value="HUF">🇭🇺 HUF (Ft) - Hungarian Forint</option>
                        <option value="RON">🇷🇴 RON (lei) - Romanian Leu</option>
                        <option value="BGN">🇧🇬 BGN (лв) - Bulgarian Lev</option>
                        <option value="RUB">🇷🇺 RUB (₽) - Russian Ruble</option>
                        <option value="UAH">🇺🇦 UAH (₴) - Ukrainian Hryvnia</option>
                        
                        {/* Americas */}
                        <option value="MXN">🇲🇽 MXN ($) - Mexican Peso</option>
                        <option value="BRL">🇧🇷 BRL (R$) - Brazilian Real</option>
                        <option value="ARS">🇦🇷 ARS ($) - Argentine Peso</option>
                        <option value="CLP">🇨🇱 CLP ($) - Chilean Peso</option>
                        <option value="COP">🇨🇴 COP ($) - Colombian Peso</option>
                        <option value="PEN">🇵🇪 PEN (S/) - Peruvian Sol</option>
                        <option value="UYU">🇺🇾 UYU ($) - Uruguayan Peso</option>
                        
                        {/* Oceania */}
                        <option value="NZD">🇳🇿 NZD ($) - New Zealand Dollar</option>
                        <option value="FJD">🇫🇯 FJD ($) - Fijian Dollar</option>
                        
                        {/* Cryptocurrency (Popular) */}
                        <option value="BTC">₿ BTC - Bitcoin</option>
                        <option value="ETH">Ξ ETH - Ethereum</option>
                        <option value="USDT">₮ USDT - Tether</option>
                        <option value="USDC">◉ USDC - USD Coin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Platform Description
                    </label>
                    <textarea
                      value={settings.general.platformDescription}
                      onChange={(e) => updateSetting('general', 'platformDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Enter platform description"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'login' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Key size={20} />
                    Login Page Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Configure the content that appears on the login page for all organizations. This is a global setting that affects all users.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Page Title
                      </label>
                      <Input
                        value={settings.login.pageTitle}
                        onChange={(e) => updateSetting('login', 'pageTitle', e.target.value)}
                        placeholder="Enter page title"
                      />
                      <p className="text-xs text-gray-500 mt-1">Main heading displayed on the login page</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subtitle / Welcome Message
                      </label>
                      <Input
                        value={settings.login.subtitle}
                        onChange={(e) => updateSetting('login', 'subtitle', e.target.value)}
                        placeholder="Enter welcome message"
                      />
                      <p className="text-xs text-gray-500 mt-1">Secondary text displayed below the title</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Login Button Text
                      </label>
                      <Input
                        value={settings.login.buttonText}
                        onChange={(e) => updateSetting('login', 'buttonText', e.target.value)}
                        placeholder="Enter button text"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Footer Text
                      </label>
                      <Input
                        value={settings.login.footerText}
                        onChange={(e) => updateSetting('login', 'footerText', e.target.value)}
                        placeholder="Enter footer text"
                      />
                      <p className="text-xs text-gray-500 mt-1">Text displayed at the bottom of the login page</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Side Panel Title
                      </label>
                      <Input
                        value={settings.login.sidePanelTitle}
                        onChange={(e) => updateSetting('login', 'sidePanelTitle', e.target.value)}
                        placeholder="Enter side panel title"
                      />
                      <p className="text-xs text-gray-500 mt-1">Title displayed on the left side panel</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Side Panel Description
                      </label>
                      <textarea
                        value={settings.login.sidePanelDescription}
                        onChange={(e) => updateSetting('login', 'sidePanelDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Enter side panel description"
                      />
                      <p className="text-xs text-gray-500 mt-1">Description displayed below the side panel title</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Feature Bullets
                    </h3>
                    <div className="space-y-3">
                      {settings.login.features.map((feature, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Feature {index + 1}
                          </label>
                          <Input
                            value={feature}
                            onChange={(e) => updateLoginFeature(index, e.target.value)}
                            placeholder="Enter feature"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'email' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Mail size={20} />
                    Email Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Global Email Configuration</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Configure email settings for welcome emails, notifications, and other system communications.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Email Enable/Disable */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">Enable Email Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Turn email system on or off globally</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.email.enabled}
                          onChange={(e) => updateSetting('email', 'enabled', e.target.checked)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {settings.email.enabled && (
                      <>
                        {/* Email Provider */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Provider
                          </label>
                          <select
                            value={settings.email.provider}
                            onChange={(e) => updateSetting('email', 'provider', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="smtp">Custom SMTP Server</option>
                            <option value="gmail">Gmail (requires App Password)</option>
                            <option value="outlook">Outlook/Hotmail</option>
                            <option value="sendgrid">SendGrid (API)</option>
                            <option value="mailgun">Mailgun (API)</option>
                          </select>
                        </div>

                        {/* From Address Settings - Apply to current provider */}
                        <div className="mb-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📧 These settings will be saved for <strong>{settings.email.provider.toUpperCase()}</strong> provider
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              From Name
                            </label>
                            <Input
                              value={settings.email.fromName || 'DoctorCare'}
                              onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                              placeholder="DoctorCare"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              From Email
                            </label>
                            <Input
                              type="email"
                              value={settings.email.fromEmail || 'noreply@doctorcare.com'}
                              onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                              placeholder="noreply@doctorcare.com"
                            />
                          </div>
                        </div>

                        {/* SMTP Settings (for custom SMTP and Gmail/Outlook) */}
                        {['smtp', 'gmail', 'outlook'].includes(settings.email.provider) && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">
                              {settings.email.provider === 'gmail' ? 'Gmail Configuration' :
                               settings.email.provider === 'outlook' ? 'Outlook Configuration' :
                               'Custom SMTP Configuration'}
                            </h4>
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  SMTP Host
                                </label>
                                <Input
                                  value={settings.email.host || 'smtp.gmail.com'}
                                  onChange={(e) => updateSetting('email', 'host', e.target.value)}
                                  placeholder={
                                    settings.email.provider === 'gmail' ? 'smtp.gmail.com' :
                                    settings.email.provider === 'outlook' ? 'smtp-mail.outlook.com' :
                                    'smtp.example.com'
                                  }
                                  disabled={!['smtp', 'gmail', 'outlook'].includes(settings.email.provider)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Port
                                </label>
                                <Input
                                  type="number"
                                  value={settings.email.port || 587}
                                  onChange={(e) => updateSetting('email', 'port', parseInt(e.target.value))}
                                  placeholder="587"
                                  disabled={!['smtp', 'gmail', 'outlook'].includes(settings.email.provider)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Username/Email
                                </label>
                                <Input
                                  value={settings.email.username || ''}
                                  onChange={(e) => updateSetting('email', 'username', e.target.value)}
                                  placeholder={
                                    settings.email.provider === 'gmail' ? 'your-email@gmail.com' :
                                    settings.email.provider === 'outlook' ? 'your-email@outlook.com' :
                                    'your-email@domain.com'
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Password/App Password
                                </label>
                                <Input
                                  type="password"
                                  value={settings.email.password || ''}
                                  onChange={(e) => updateSetting('email', 'password', e.target.value)}
                                  placeholder="••••••••"
                                />
                                {settings.email.provider === 'gmail' && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Use App Password, not your regular Google password
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.email.secure}
                                onChange={(e) => updateSetting('email', 'secure', e.target.checked)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Use SSL/TLS (typically for port 465)
                              </label>
                            </div>
                          </>
                          </div>
                        )}

                        {/* SendGrid Settings */}
                        {settings.email.provider === 'sendgrid' && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">SendGrid API Configuration</h4>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              SendGrid API Key
                            </label>
                                                         <Input
                               type="password"
                               value={settings.email.providerSettings.sendgrid.apiKey || ''}
                               onChange={(e) => {
                                 updateSetting('email', 'providerSettings', {
                                   ...settings.email.providerSettings,
                                   sendgrid: { apiKey: e.target.value }
                                 });
                                 // Also update the provider-specific config
                                 setSettings(prev => ({
                                   ...prev,
                                   email: {
                                     ...prev.email,
                                     providers: {
                                       ...prev.email.providers,
                                       sendgrid: {
                                         ...prev.email.providers.sendgrid,
                                         apiKey: e.target.value
                                       }
                                     }
                                   }
                                 }));
                               }}
                               placeholder="SG.••••••••"
                             />
                          </div>
                        )}

                        {/* Mailgun Settings */}
                        {settings.email.provider === 'mailgun' && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-3">Mailgun API Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Mailgun API Key
                                </label>
                                                             <Input
                                 type="password"
                                 value={settings.email.providerSettings.mailgun.apiKey || ''}
                                 onChange={(e) => {
                                   updateSetting('email', 'providerSettings', {
                                     ...settings.email.providerSettings,
                                     mailgun: { 
                                       ...settings.email.providerSettings.mailgun,
                                       apiKey: e.target.value 
                                     }
                                   });
                                   // Also update the provider-specific config
                                   setSettings(prev => ({
                                     ...prev,
                                     email: {
                                       ...prev.email,
                                       providers: {
                                         ...prev.email.providers,
                                         mailgun: {
                                           ...prev.email.providers.mailgun,
                                           apiKey: e.target.value
                                         }
                                       }
                                     }
                                   }));
                                 }}
                                 placeholder="key-••••••••"
                               />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Domain
                              </label>
                                                             <Input
                                 value={settings.email.providerSettings.mailgun.domain || ''}
                                 onChange={(e) => {
                                   updateSetting('email', 'providerSettings', {
                                     ...settings.email.providerSettings,
                                     mailgun: { 
                                       ...settings.email.providerSettings.mailgun,
                                       domain: e.target.value 
                                     }
                                   });
                                   // Also update the provider-specific config
                                   setSettings(prev => ({
                                     ...prev,
                                     email: {
                                       ...prev.email,
                                       providers: {
                                         ...prev.email.providers,
                                         mailgun: {
                                           ...prev.email.providers.mailgun,
                                           domain: e.target.value
                                         }
                                       }
                                     }
                                   }));
                                 }}
                                 placeholder="mg.yourdomain.com"
                               />
                            </div>
                            </div>
                          </div>
                        )}

                        {/* Test Email Section */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Test Email Configuration</h3>
                          <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                            Send a test email to verify your configuration is working correctly.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <Input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter test email address"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                onClick={handleSendTestEmail}
                                disabled={isSendingTest || !testEmail}
                              >
                                {isSendingTest ? 'Sending...' : 'Send Test Email'}
                              </Button>
                            </div>
                          </div>
                          {testEmailResult && (
                            <div className={`mt-3 p-3 rounded-md ${
                              testEmailResult.success 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              <p className="text-sm">
                                {testEmailResult.success ? '✅' : '❌'} {testEmailResult.message}
                              </p>
                              {testEmailResult.testDetails && (
                                <div className="text-xs mt-2 space-y-1">
                                  <p><strong>Provider:</strong> {testEmailResult.testDetails.provider}</p>
                                  <p><strong>From:</strong> {testEmailResult.testDetails.fromName} &lt;{testEmailResult.testDetails.fromEmail}&gt;</p>
                                  {testEmailResult.testDetails.messageId && (
                                    <p><strong>Message ID:</strong> {testEmailResult.testDetails.messageId}</p>
                                  )}
                                  {testEmailResult.testDetails.response && (
                                    <p><strong>Server Response:</strong> {testEmailResult.testDetails.response}</p>
                                  )}
                                  <p><strong>Sent:</strong> {new Date(testEmailResult.testDetails.timestamp).toLocaleString()}</p>
                                </div>
                              )}
                              {!testEmailResult.success && testEmailResult.details && (
                                <div className="text-xs mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                  <p><strong>Error Details:</strong></p>
                                  <p className="font-mono text-red-700 dark:text-red-300">{testEmailResult.details}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Bell size={20} />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enable {key.toLowerCase().replace(/([A-Z])/g, ' $1')} for the platform
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Shield size={20} />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password Min Length
                      </label>
                      <Input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                        placeholder="8"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Require Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Require 2FA for all users
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requireTwoFactor}
                          onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Allow Password Reset
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow users to reset their passwords
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.allowPasswordReset}
                          onChange={(e) => updateSetting('security', 'allowPasswordReset', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'paymentGateway' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CreditCard size={20} />
                    Setup Payment Gateway
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mode Selection */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Payment Gateway Mode
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          settings.paymentGateway.mode === 'test' 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => updateSetting('paymentGateway', 'mode', 'test')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            settings.paymentGateway.mode === 'test' 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {settings.paymentGateway.mode === 'test' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Test Mode</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Safe testing environment with fake transactions
                            </p>
                          </div>
                        </div>
                      </div>
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          settings.paymentGateway.mode === 'live' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => updateSetting('paymentGateway', 'mode', 'live')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            settings.paymentGateway.mode === 'live' 
                              ? 'border-red-500 bg-red-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {settings.paymentGateway.mode === 'live' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Live Mode</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Production environment with real transactions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Credentials */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {settings.paymentGateway.mode === 'test' ? 'Test' : 'Live'} API Credentials
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        settings.paymentGateway.mode === 'test' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {settings.paymentGateway.mode === 'test' ? 'TEST' : 'LIVE'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stripe Public Key
                        </label>
                        <Input
                          type="password"
                          value={settings.paymentGateway[settings.paymentGateway.mode].stripePublicKey}
                          onChange={(e) => {
                            const mode = settings.paymentGateway.mode;
                            setSettings(prev => ({
                              ...prev,
                              paymentGateway: {
                                ...prev.paymentGateway,
                                [mode]: {
                                  ...prev.paymentGateway[mode],
                                  stripePublicKey: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder={settings.paymentGateway.mode === 'test' ? 'pk_test_...' : 'pk_live_...'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {settings.paymentGateway.mode === 'test' ? 'Test publishable key from Stripe Dashboard' : 'Live publishable key from Stripe Dashboard'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stripe Secret Key
                        </label>
                        <Input
                          type="password"
                          value={settings.paymentGateway[settings.paymentGateway.mode].stripeSecretKey}
                          onChange={(e) => {
                            const mode = settings.paymentGateway.mode;
                            setSettings(prev => ({
                              ...prev,
                              paymentGateway: {
                                ...prev.paymentGateway,
                                [mode]: {
                                  ...prev.paymentGateway[mode],
                                  stripeSecretKey: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder={settings.paymentGateway.mode === 'test' ? 'sk_test_...' : 'sk_live_...'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {settings.paymentGateway.mode === 'test' ? 'Test secret key from Stripe Dashboard' : 'Live secret key from Stripe Dashboard'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Webhook Secret {settings.paymentGateway.mode === 'live' && <span className="text-red-500">*</span>}
                          {settings.paymentGateway.mode === 'test' && <span className="text-gray-500">(Optional)</span>}
                        </label>
                        <Input
                          type="password"
                          value={settings.paymentGateway[settings.paymentGateway.mode].webhookSecret}
                          onChange={(e) => {
                            const mode = settings.paymentGateway.mode;
                            setSettings(prev => ({
                              ...prev,
                              paymentGateway: {
                                ...prev.paymentGateway,
                                [mode]: {
                                  ...prev.paymentGateway[mode],
                                  webhookSecret: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder="whsec_..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {settings.paymentGateway.mode === 'test' 
                            ? 'Optional for test mode. Use for signature verification security. Get from Stripe CLI with "stripe listen" command.'
                            : 'Required for live mode. Webhook endpoint secret for secure payment event notifications.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Additional Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax Rate (%)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={settings.paymentGateway.taxRate}
                          onChange={(e) => updateSetting('paymentGateway', 'taxRate', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default tax rate applied to subscriptions
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning for Live Mode */}
                  {settings.paymentGateway.mode === 'live' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-800 dark:text-red-400">
                            Live Mode Warning
                          </h4>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            You are in live mode. Real transactions will be processed and real money will be charged. 
                            Make sure all settings are correct before activating live mode.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Mode Info */}
                  {settings.paymentGateway.mode === 'test' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-green-800 dark:text-green-400">
                            Test Mode Active
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            You are in test mode. No real transactions will be processed. Use test card numbers for testing payments.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
} 