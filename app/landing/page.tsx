'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGlobalCurrency } from '@/lib/useGlobalCurrency';
import { 
  ArrowRight, 
  Check, 
  Star, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard,
  Shield,
  Zap,
  Heart,
  Activity,
  BarChart,
  Clock,
  Globe,
  Smartphone,
  ChevronRight,
  Award,
  TrendingUp,
  Lock,
  Headphones,
  Sparkles,
  CheckCircle,
  DollarSign,
  ArrowLeft
} from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formatAmount } = useGlobalCurrency();
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [landingContent, setLandingContent] = useState<any>(null);



  useEffect(() => {
    console.log('Landing page useEffect triggered');
    
    // Load subscription plans and landing content
    const loadData = async () => {
      try {
        console.log('Starting to load data...');
        
        // Set default content first
        const defaultContent = {
          hero: {
            title: "Modern Practice Management Made Simple",
            subtitle: "Streamline your healthcare practice with our comprehensive management system.",
            ctaText: "Start 14-Day Free Trial",
            ctaSecondaryText: "Watch Demo",
          },
          stats: [
            { number: "10,000+", label: "Healthcare Providers" },
            { number: "500,000+", label: "Patients Managed" },
            { number: "99.9%", label: "Uptime Guarantee" },
            { number: "24/7", label: "Customer Support" }
          ],
          features: {
            title: "Everything You Need to Run Your Practice",
            subtitle: "Our comprehensive platform provides all the tools healthcare providers need.",
          },
          pricing: {
            title: "Simple, Transparent Pricing",
            subtitle: "Choose the plan that fits your practice.",
          },
          testimonials: {
            title: "Trusted by Healthcare Providers",
            subtitle: "See what doctors are saying about DoctorCare",
            items: [
              {
                name: "Dr. Sarah Johnson",
                role: "Family Medicine",
                avatar: "SJ",
                content: "DoctorCare has revolutionized how I manage my practice.",
                rating: 5
              },
              {
                name: "Dr. Michael Chen",
                role: "Pediatrics",
                avatar: "MC",
                content: "The patient management features are incredible.",
                rating: 5
              },
              {
                name: "Dr. Emily Rodriguez",
                role: "Internal Medicine",
                avatar: "ER",
                content: "Best investment I have made for my practice.",
                rating: 5
              }
            ]
          },
          cta: {
            title: "Ready to Transform Your Practice?",
            subtitle: "Join thousands of healthcare providers who trust DoctorCare.",
            buttonText: "Start Your Free Trial Today"
          }
        };

        setLandingContent(defaultContent);
        
        // Load subscription plans with public access
        console.log('Fetching subscription plans...');
        try {
          const plansResponse = await fetch('/api/subscription-plans?public=true', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          console.log('Plans response status:', plansResponse.status);
          
          if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            console.log('Plans data:', plansData);
            setSubscriptionPlans(plansData.plans || []);
          } else {
            console.error('Failed to load subscription plans:', plansResponse.status, plansResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching subscription plans:', error);
        }

        // Load landing page content with cache busting
        console.log('Fetching landing content...');
        try {
          const timestamp = new Date().getTime();
          const contentResponse = await fetch(`/api/settings/landing?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          console.log('Landing content response status:', contentResponse.status);
          
          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            console.log('Landing content loaded:', contentData);
            setLandingContent(contentData);
          } else {
            console.error('Failed to load landing content:', contentResponse.status, contentResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching landing content:', error);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const features = [
    {
      icon: Users,
      title: "Patient Management",
      description: "Comprehensive patient records, medical history, and contact management in one place.",
      color: "blue"
    },
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description: "Smart scheduling system with automated reminders and calendar integration.",
      color: "green"
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Digital medical records with secure storage and easy access to patient information.",
      color: "purple"
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description: "Integrated billing system with payment processing and insurance claim management.",
      color: "yellow"
    },
    {
      icon: BarChart,
      title: "Analytics & Reports",
      description: "Detailed insights into your practice performance with customizable reports.",
      color: "indigo"
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security ensuring all patient data is protected and compliant.",
      color: "red"
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "Access your practice management tools anywhere with our mobile-responsive platform.",
      color: "cyan"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you get the most out of your practice.",
      color: "orange"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
    };
    return colors[color] || colors.blue;
  };

  if (status === 'loading' || loading || !landingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-purple-600 animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg">DC</span>
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  DoctorCare
                </span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">Reviews</a>
              {status === 'authenticated' ? (
                <>
                  <Link 
                    href={session?.user?.role === 'super_admin' ? '/super-admin' : '/dashboard'} 
                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Welcome, {session?.user?.name}</span>
                </>
              ) : (
                <>
                  <a href="/login" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium">
                    Sign In
                  </a>
                  <Link href="#pricing" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-medium">
                    Start Free Trial
                  </Link>
                </> 
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Most trusted by healthcare providers
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                {landingContent?.hero?.title?.includes('\n') ? (
                  landingContent.hero.title.split('\n').map((line, index) => (
                    <span key={index} className="block">
                      {index === 0 ? (
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {line}
                        </span>
                      ) : (
                        line
                      )}
                    </span>
                  ))
                ) : (
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {landingContent?.hero?.title || "Modern Practice Management Made Simple"}
                  </span>
                )}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                {landingContent?.hero?.subtitle || "Streamline your healthcare practice with our comprehensive management system."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link href="#pricing" className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center">
                  {landingContent?.hero?.ctaText || "Start 14-Day Free Trial"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="/login" target="_blank" rel="noopener noreferrer" className="group border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-purple-600 hover:text-purple-600 dark:hover:border-purple-400 dark:hover:text-purple-400 transition-all flex items-center justify-center backdrop-blur-sm">
                  <ArrowRight className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Sign In
                </a>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Cancel anytime
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  HIPAA compliant
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Schedule</h3>
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">12 appointments</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { time: "9:00 AM", patient: "John Smith", type: "Checkup", color: "green" },
                      { time: "10:30 AM", patient: "Sarah Johnson", type: "Consultation", color: "blue" },
                      { time: "2:00 PM", patient: "Mike Wilson", type: "Follow-up", color: "purple" }
                    ].map((appointment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            appointment.color === 'green' ? 'bg-green-500' :
                            appointment.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{appointment.patient}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.type}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{appointment.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg animate-float animation-delay-2000">
                <Activity className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {(landingContent?.stats || []).map((stat, index) => (
              <div key={index} className="group">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">
                  {stat.number}
                </div>
                <div className="text-purple-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {landingContent?.features?.title || "Everything You Need to Run Your Practice"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {landingContent?.features?.subtitle || "Our comprehensive platform provides all the tools healthcare providers need."}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${getColorClasses(feature.color)}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <DollarSign className="h-4 w-4" />
              Transparent Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {landingContent?.pricing?.title || "Simple, Transparent Pricing"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {landingContent?.pricing?.subtitle || "Choose the plan that fits your practice."}
            </p>
          </div>
          
          {subscriptionPlans.length === 0 ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {subscriptionPlans.map((plan, index) => (
                <div key={plan._id} className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 p-8 transition-all duration-300 hover:scale-105 ${
                  plan.isDefault 
                    ? 'border-purple-500 ring-4 ring-purple-200 dark:ring-purple-900/30 scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }`}>
                  {plan.isDefault && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">{plan.description}</p>
                    
                    <div className="mb-8">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">{formatAmount(plan.monthlyPrice)}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-lg">/month</span>
                      {plan.yearlyPrice && (
                        <div className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                          Save {formatAmount(plan.monthlyPrice * 12 - plan.yearlyPrice)} yearly
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      href={`/signup?plan=${plan._id}`}
                      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all block text-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        plan.isDefault
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Start Free Trial
                    </Link>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    {plan.features && typeof plan.features === 'object' && Object.keys(plan.features).length > 0 && (
                      <>
                        {plan.features.maxPatients && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {plan.features.maxPatients === -1 ? 'Unlimited Patients' : `Up to ${plan.features.maxPatients} Patients`}
                            </span>
                          </div>
                        )}
                        {plan.features.maxUsers && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {plan.features.maxUsers === -1 ? 'Unlimited Users' : `Up to ${plan.features.maxUsers} Users`}
                            </span>
                          </div>
                        )}
                        {plan.features.maxAppointments && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {plan.features.maxAppointments === -1 ? 'Unlimited Appointments' : `Up to ${plan.features.maxAppointments} Appointments`}
                            </span>
                          </div>
                        )}
                        {plan.features.customBranding && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Custom Branding</span>
                          </div>
                        )}
                        {plan.features.apiAccess && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">API Access</span>
                          </div>
                        )}
                        {plan.features.prioritySupport && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Priority Support</span>
                          </div>
                        )}
                        {plan.features.advancedReports && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Advanced Reports</span>
                          </div>
                        )}
                        {plan.features.dataBackup && (
                          <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">Data Backup</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              Customer Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {landingContent?.testimonials?.title || "Trusted by Healthcare Providers"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {landingContent?.testimonials?.subtitle || "See what doctors are saying about DoctorCare"}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(landingContent?.testimonials?.items || []).map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {landingContent?.cta?.title || "Ready to Transform Your Practice?"}
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            {landingContent?.cta?.subtitle || "Join thousands of healthcare providers who trust DoctorCare."}
          </p>
          <Link href="#pricing" className="inline-flex items-center bg-white text-purple-600 px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105">
            {landingContent?.cta?.buttonText || "Start Your Free Trial Today"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">DC</span>
                </div>
                <span className="ml-3 text-xl font-bold">DoctorCare</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The most trusted healthcare practice management system. Streamline your practice, 
                improve patient care, and grow your business with our comprehensive solution.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
                <li><a href="/login" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Login</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DoctorCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 