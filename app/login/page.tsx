"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AtSign, Lock, ArrowRight, CheckCircle, Heart, Activity, Calendar, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // State for login settings - initialize with empty values
  const [loginSettings, setLoginSettings] = useState({
    pageTitle: "",
    subtitle: "",
    buttonText: "",
    footerText: "",
    sidePanelTitle: "",
    sidePanelDescription: "",
    features: [] as string[]
  });

  const [settingsLoading, setSettingsLoading] = useState(true);

  // State for branding settings
  const [brandingSettings, setBrandingSettings] = useState({
    appName: '',
    appTagline: '',
    logoText: '',
    footerText: ''
  });

  const [brandingLoading, setBrandingLoading] = useState(true);

  // Check if app is in demo mode
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'demo';

  // Demo credentials
  const demoCredentials = {
    superadmin: {
      email: 'superadmin@dms.com',
      password: '12345',
      role: 'Super Admin'
    },
    admin: {
      email: 'admin@dms.com', 
      password: '12345',
      role: 'Admin'
    }
  };

  // Function to fill demo credentials
  const fillDemoCredentials = (role) => {
    const credentials = demoCredentials[role];
    if (credentials) {
      setFormData(prev => ({
        ...prev,
        email: credentials.email,
        password: credentials.password
      }));
      setError(''); // Clear any existing errors
    }
  };





  // Load login settings from API on component mount
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        setSettingsLoading(true);
        setBrandingLoading(true);

        // Load both settings in parallel for faster loading
        const [loginResponse, brandingResponse] = await Promise.all([
          fetch('/api/settings/login'),
          fetch('/api/settings/branding')
        ]);

        // Process login settings
        if (loginResponse.ok) {
          const settings = await loginResponse.json();
          if (settings) {
            setLoginSettings(settings);
          } else {
            // Set fallback values if no settings are configured
            setLoginSettings({
              pageTitle: "Welcome to DoctorCare",
              subtitle: "Your comprehensive practice management solution",
              buttonText: "Sign In",
              footerText: "DoctorCare. All rights reserved.",
              sidePanelTitle: "Modern Healthcare Management",
              sidePanelDescription: "Streamline your practice with our comprehensive management system designed for modern healthcare providers.",
              features: [
                "Patient Management",
                "Appointment Scheduling",
                "Medical Records",
                "Billing & Payments"
              ]
            });
          }
        } else {
          // Set fallback values on error
          setLoginSettings({
            pageTitle: "Welcome to DoctorCare",
            subtitle: "Your comprehensive practice management solution",
            buttonText: "Sign In",
            footerText: "DoctorCare. All rights reserved.",
            sidePanelTitle: "Modern Healthcare Management",
            sidePanelDescription: "Streamline your practice with our comprehensive management system designed for modern healthcare providers.",
            features: [
              "Patient Management",
              "Appointment Scheduling",
              "Medical Records",
              "Billing & Payments"
            ]
          });
        }

        // Process branding settings
        if (brandingResponse.ok) {
          const settings = await brandingResponse.json();
          setBrandingSettings({
            appName: settings.appName || 'DoctorCare',
            appTagline: settings.appTagline || 'Practice Management',
            logoText: settings.logoText || 'DC',
            footerText: settings.footerText || 'DoctorCare. All rights reserved.'
          });
        } else {
          // Set fallback values on error
          setBrandingSettings({
            appName: 'DoctorCare',
            appTagline: 'Practice Management',
            logoText: 'DC',
            footerText: 'DoctorCare. All rights reserved.'
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Set fallback values on error
        setLoginSettings({
          pageTitle: "Welcome to DoctorCare",
          subtitle: "Your comprehensive practice management solution",
          buttonText: "Sign In",
          footerText: "DoctorCare. All rights reserved.",
          sidePanelTitle: "Modern Healthcare Management",
          sidePanelDescription: "Streamline your practice with our comprehensive management system designed for modern healthcare providers.",
          features: [
            "Patient Management",
            "Appointment Scheduling",
            "Medical Records",
            "Billing & Payments"
          ]
        });
        setBrandingSettings({
          appName: 'DoctorCare',
          appTagline: 'Practice Management',
          logoText: 'DC',
          footerText: 'DoctorCare. All rights reserved.'
        });
      } finally {
        setSettingsLoading(false);
        setBrandingLoading(false);
      }
    };
    
    loadAllSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      if (result?.ok) {
        // Use router.push for faster navigation and let middleware handle role-based redirects
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Illustration & branding */}
      <div className="md:w-5/12 lg:w-6/12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 relative overflow-hidden">
        {/* Abstract patterns */}
        <div className="absolute inset-0 z-0">
          <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 800 800">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <rect width="80" height="80" fill="url(#smallGrid)" />
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute top-[-15%] right-[-15%] w-[70%] h-[70%] rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[90%] h-[90%] rounded-full bg-secondary-500/10 blur-3xl animate-pulse-slow [animation-delay:2s]" />
        
        {/* Floating icons */}
        <div className="absolute top-[20%] right-[15%] p-3 bg-white/10 backdrop-blur-xl rounded-xl animate-float-slow">
          <Heart className="text-white h-6 w-6" />
        </div>
        <div className="absolute top-[50%] right-[25%] p-3 bg-white/10 backdrop-blur-xl rounded-xl animate-float-slow [animation-delay:1s]">
          <Activity className="text-white h-6 w-6" />
        </div>
        <div className="absolute bottom-[30%] right-[35%] p-3 bg-white/10 backdrop-blur-xl rounded-xl animate-float-slow [animation-delay:2s]">
          <Calendar className="text-white h-6 w-6" />
        </div>
        <div className="absolute bottom-[15%] left-[20%] p-3 bg-white/10 backdrop-blur-xl rounded-xl animate-float-slow [animation-delay:3s]">
          <Users className="text-white h-6 w-6" />
        </div>

        <div className="relative h-full flex flex-col justify-between p-8 md:p-12 z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-primary-600 font-bold text-xl">
                {!brandingLoading && brandingSettings.logoText}
              </span>
            </div>
            <h1 className="text-white text-2xl font-bold">
              {!brandingLoading && brandingSettings.appName}
            </h1>
          </div>
          
          {/* Main content */}
          <div className="my-auto py-12">
            <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 animate-fade-in [animation-delay:0.2s]">
              {loginSettings.sidePanelTitle || "Modern Healthcare Management"}
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-md animate-fade-in [animation-delay:0.4s]">
              {loginSettings.sidePanelDescription || "Streamline your practice with our comprehensive management system designed for modern healthcare providers."}
            </p>
            
            {/* Features */}
            <div className="space-y-4 mb-8">
              {(loginSettings.features && loginSettings.features.length > 0 ? loginSettings.features : [
                "Patient Management",
                "Appointment Scheduling", 
                "Medical Records",
                "Billing & Payments"
              ]).map((feature, i) => (
                feature && (
                  <div key={i} className={`flex items-center gap-3 animate-slide-up [animation-delay:${0.6 + i * 0.1}s]`}>
                    <CheckCircle size={20} className="text-white/90" />
                    <span className="text-white/90">{feature}</span>
                  </div>
                )
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-white/60 text-sm animate-fade-in">
            {loginSettings.footerText || "DoctorCare. All rights reserved."}
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="md:w-7/12 lg:w-6/12 flex items-center justify-center p-6 md:p-12 bg-white dark:bg-gray-900 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-gray-800 dark:via-gray-900 dark:to-black">
        <div className="w-full max-w-md animate-fade-in animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {loginSettings.pageTitle || "Welcome to DoctorCare"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {loginSettings.subtitle || "Your comprehensive practice management solution"}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1 animate-slide-up [animation-delay:0.2s]">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign size={18} className="text-gray-500 dark:text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="doctor@example.com"
                  className="pl-10 pr-3 py-3 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 transition-colors"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-1 animate-slide-up [animation-delay:0.3s]">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500 dark:text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pl-10 pr-3 py-3 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 transition-colors"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex items-center animate-slide-up [animation-delay:0.4s]">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            
            <div className="block w-full animate-slide-up [animation-delay:0.5s]">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-all shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Signing in...' : (loginSettings.buttonText || "Sign In")}
                {!loading && <ArrowRight size={18} className="animate-pulse-slow" />}
              </button>
            </div>
          </form>

          {/* Demo Login Buttons */}
          {isDemoMode && (
            <div className="mt-6 animate-fade-in animate-slide-up [animation-delay:0.6s]">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    🧪 Demo Mode
                  </span>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Quick login for testing:
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Super Admin Demo Button */}
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('superadmin')}
                    className="flex flex-col items-center justify-center w-full px-3 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/30"
                    disabled={loading}
                  >
                   
                    <div className="text-center">
                      <div className="font-semibold text-sm">Super Admin</div>
                      <div className="text-xs text-purple-200 mt-1">👑 Full Access</div>
                    </div>
                  </button>

                  {/* Admin Demo Button */}
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="flex flex-col items-center justify-center w-full px-3 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/30"
                    disabled={loading}
                  >
                   
                    <div className="text-center">
                      <div className="font-semibold text-sm">Doctor Login</div>
                      <div className="text-xs text-blue-200 mt-1">🏥 Practice</div>
                    </div>
                  </button>
                </div>

                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                    💡 <strong>Demo Mode:</strong> Click a button to auto-fill credentials, then sign in
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
} 