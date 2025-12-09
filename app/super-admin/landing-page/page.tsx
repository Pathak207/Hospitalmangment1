'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/super-admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { 
  Globe,
  Save,
  Eye,
  Edit,
  RefreshCw,
  Plus,
  Trash2,
  Star,
  Home,
  BarChart3,
  Grid3X3,
  DollarSign,
  MessageSquare,
  Megaphone
} from 'lucide-react';

export default function LandingPageManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [landingContent, setLandingContent] = useState({
    hero: {
      title: 'Modern Practice Management Made Simple',
      subtitle: 'Streamline your healthcare practice with our comprehensive management system. From patient records to billing, everything you need in one place.',
      ctaText: 'Start 14-Day Free Trial',
      ctaSecondaryText: 'Watch Demo',
    },
    stats: [
      { number: '10,000+', label: 'Healthcare Providers' },
      { number: '500,000+', label: 'Patients Managed' },
      { number: '99.9%', label: 'Uptime Guarantee' },
      { number: '24/7', label: 'Customer Support' }
    ],
    features: {
      title: 'Everything You Need to Run Your Practice',
      subtitle: 'Our comprehensive platform provides all the tools healthcare providers need to deliver exceptional patient care while streamlining operations.',
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that fits your practice. All plans include a 14-day free trial with no setup fees or long-term commitments.'
    },
    testimonials: {
      title: 'Trusted by Healthcare Providers',
      subtitle: 'See what doctors are saying about DoctorCare',
      items: [
        {
          name: 'Dr. Sarah Johnson',
          role: 'Family Medicine',
          avatar: 'SJ',
          content: 'DoctorCare has revolutionized how I manage my practice. The scheduling system alone has saved me hours every week.',
          rating: 5
        },
        {
          name: 'Dr. Michael Chen',
          role: 'Pediatrics',
          avatar: 'MC',
          content: 'The patient management features are incredible. I can access complete medical histories instantly.',
          rating: 5
        },
        {
          name: 'Dr. Emily Rodriguez',
          role: 'Internal Medicine',
          avatar: 'ER',
          content: 'Best investment I have made for my practice. The billing integration has streamlined everything.',
          rating: 5
        }
      ]
    },
    cta: {
      title: 'Ready to Transform Your Practice?',
      subtitle: 'Join thousands of healthcare providers who trust DoctorCare to manage their practice efficiently.',
      buttonText: 'Start Your Free Trial Today'
    }
  });

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: Home, description: 'Main banner and call-to-action' },
    { id: 'stats', label: 'Statistics', icon: BarChart3, description: 'Key metrics and numbers' },
    { id: 'features', label: 'Features', icon: Grid3X3, description: 'Product features section' },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, description: 'Pricing section headers' },
    { id: 'testimonials', label: 'Reviews', icon: MessageSquare, description: 'Customer testimonials' },
    { id: 'cta', label: 'Call-to-Action', icon: Megaphone, description: 'Final conversion section' },
  ];

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
      loadLandingContent();
    }
  }, [session, status, router]);

  const loadLandingContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/landing');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setLandingContent(data);
        }
      } else {
        toast.error('Failed to load landing page content', {
          duration: 4000,
          icon: '⚠️',
        });
      }
    } catch (error) {
      console.error('Error loading landing content:', error);
      toast.error('Network error while loading content', {
        duration: 4000,
        icon: '🌐',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Saving landing page content...');
      
      const response = await fetch('/api/settings/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(landingContent),
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.ok) {
        toast.success('Landing page content saved successfully! 🎉', {
          duration: 4000,
          icon: '✅',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to save landing page content', {
          duration: 5000,
          icon: '❌',
        });
      }
    } catch (error) {
      console.error('Error saving landing content:', error);
      toast.error('Network error. Please check your connection and try again.', {
        duration: 5000,
        icon: '🌐',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (key: string, value: string) => {
    setLandingContent(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value
      }
    }));
  };

  const updateStats = (index: number, field: string, value: string) => {
    setLandingContent(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const updateSection = (section: string, key: string, value: string) => {
    setLandingContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addTestimonial = () => {
    setLandingContent(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: [
          ...prev.testimonials.items,
          {
            name: '',
            role: '',
            avatar: '',
            content: '',
            rating: 5
          }
        ]
      }
    }));
    
    toast.success('New review added! Fill in the details below.', {
      duration: 3000,
      icon: '➕',
    });
  };

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    setLandingContent(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: prev.testimonials.items.map((testimonial, i) => 
          i === index ? { ...testimonial, [field]: value } : testimonial
        )
      }
    }));
  };

  const removeTestimonial = (index: number) => {
    const testimonialName = landingContent.testimonials.items[index]?.name || `Review #${index + 1}`;
    
    setLandingContent(prev => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: prev.testimonials.items.filter((_, i) => i !== index)
      }
    }));
    
    toast.success(`${testimonialName} review removed`, {
      duration: 3000,
      icon: '🗑️',
    });
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-gray-600">Loading landing page content...</span>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hero':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Home size={20} className="text-purple-600" />
                Hero Section
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure the main banner section that visitors see first
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Main Title
                </label>
                <Input
                  value={landingContent.hero.title}
                  onChange={(e) => updateHero('title', e.target.value)}
                  placeholder="Enter main title"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtitle
                </label>
                <textarea
                  value={landingContent.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter subtitle"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary CTA Button
                  </label>
                  <Input
                    value={landingContent.hero.ctaText}
                    onChange={(e) => updateHero('ctaText', e.target.value)}
                    placeholder="Start Free Trial"
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secondary CTA Button
                  </label>
                  <Input
                    value={landingContent.hero.ctaSecondaryText}
                    onChange={(e) => updateHero('ctaSecondaryText', e.target.value)}
                    placeholder="Watch Demo"
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'stats':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-600" />
                Statistics Section
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showcase key metrics and achievements
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {landingContent.stats.map((stat, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Statistic #{index + 1}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Number
                        </label>
                        <Input
                          value={stat.number}
                          onChange={(e) => updateStats(index, 'number', e.target.value)}
                          placeholder="10,000+"
                          className="text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Label
                        </label>
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStats(index, 'label', e.target.value)}
                          placeholder="Healthcare Providers"
                          className="text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'features':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Grid3X3 size={20} className="text-purple-600" />
                Features Section
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure the features section headers
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Title
                </label>
                <Input
                  value={landingContent.features.title}
                  onChange={(e) => updateSection('features', 'title', e.target.value)}
                  placeholder="Everything You Need to Run Your Practice"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Subtitle
                </label>
                <textarea
                  value={landingContent.features.subtitle}
                  onChange={(e) => updateSection('features', 'subtitle', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter features section subtitle"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'pricing':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DollarSign size={20} className="text-purple-600" />
                Pricing Section
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure the pricing section headers
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Title
                </label>
                <Input
                  value={landingContent.pricing.title}
                  onChange={(e) => updateSection('pricing', 'title', e.target.value)}
                  placeholder="Simple, Transparent Pricing"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Subtitle
                </label>
                <textarea
                  value={landingContent.pricing.subtitle}
                  onChange={(e) => updateSection('pricing', 'subtitle', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter pricing section subtitle"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'testimonials':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-purple-600" />
                  Customer Reviews
                </div>
                <Button 
                  onClick={addTestimonial}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Review
                </Button>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage customer testimonials and reviews
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Section Title
                  </label>
                  <Input
                    value={landingContent.testimonials.title}
                    onChange={(e) => updateSection('testimonials', 'title', e.target.value)}
                    placeholder="Trusted by Healthcare Providers"
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Section Subtitle
                  </label>
                  <Input
                    value={landingContent.testimonials.subtitle}
                    onChange={(e) => updateSection('testimonials', 'subtitle', e.target.value)}
                    placeholder="See what doctors are saying about DoctorCare"
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Customer Reviews</h3>
                <div className="space-y-6">
                  {landingContent.testimonials.items.map((testimonial, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Review #{index + 1}
                        </h4>
                        <Button
                          onClick={() => removeTestimonial(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Doctor Name
                          </label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                            placeholder="Dr. Sarah Johnson"
                            className="text-gray-900 dark:text-gray-100"
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Specialty
                          </label>
                          <Input
                            value={testimonial.role}
                            onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                            placeholder="Family Medicine"
                            className="text-gray-900 dark:text-gray-100"
                            size="sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Avatar (Initials)
                          </label>
                          <Input
                            value={testimonial.avatar}
                            onChange={(e) => updateTestimonial(index, 'avatar', e.target.value.toUpperCase())}
                            placeholder="SJ"
                            maxLength={3}
                            className="text-gray-900 dark:text-gray-100"
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Review Content
                        </label>
                        <textarea
                          value={testimonial.content}
                          onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Enter the customer's review..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rating
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateTestimonial(index, 'rating', star)}
                              className={`p-1 rounded ${
                                star <= testimonial.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              } hover:text-yellow-400 transition-colors`}
                            >
                              <Star 
                                className={`h-5 w-5 ${
                                  star <= testimonial.rating ? 'fill-current' : ''
                                }`} 
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            {testimonial.rating}/5 stars
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {landingContent.testimonials.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews yet. Click "Add Review" to create your first testimonial.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'cta':
        return (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Megaphone size={20} className="text-purple-600" />
                Call-to-Action Section
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure the final conversion section
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Title
                </label>
                <Input
                  value={landingContent.cta.title}
                  onChange={(e) => updateSection('cta', 'title', e.target.value)}
                  placeholder="Ready to Transform Your Practice?"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Subtitle
                </label>
                <textarea
                  value={landingContent.cta.subtitle}
                  onChange={(e) => updateSection('cta', 'subtitle', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter CTA section subtitle"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Text
                </label>
                <Input
                  value={landingContent.cta.buttonText}
                  onChange={(e) => updateSection('cta', 'buttonText', e.target.value)}
                  placeholder="Start Your Free Trial Today"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Globe className="h-7 w-7 text-purple-600" />
              Landing Page Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize the content that appears on your platform's landing page
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.open('/', '_blank')}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Landing Page
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vertical Tab Menu */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Landing Page Content Management
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Changes made here will be reflected on your platform's landing page immediately after saving. 
                  Use the "Preview Landing Page" button to see how your changes look before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
} 