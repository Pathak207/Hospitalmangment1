'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Mail, Calendar, Users, Settings } from 'lucide-react';

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to DoctorCare!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your account has been successfully created. You can now start managing your practice 
            with our comprehensive healthcare management platform.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Check Your Email</h3>
                  <p className="text-gray-600 text-sm">
                    We've sent you a welcome email with important information about your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
                  <p className="text-gray-600 text-sm">
                    Add your practice details, upload your logo, and customize your settings.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Add Your First Patient</h3>
                  <p className="text-gray-600 text-sm">
                    Start by adding patient records and scheduling your first appointments.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mt-1 mr-4">
                  <span className="text-primary-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Invite Your Team</h3>
                  <p className="text-gray-600 text-sm">
                    Add staff members and assign roles to collaborate effectively.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Your Trial Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-primary-100" />
                  <span>14 days free trial</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-primary-100" />
                  <span>Full access to all features</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-primary-100" />
                  <span>No setup fees</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-primary-100" />
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-3 text-primary-100" />
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Patient Management</h3>
            <p className="text-gray-600 text-sm">
              Add and manage patient records, medical history, and contact information.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Appointment Scheduling</h3>
            <p className="text-gray-600 text-sm">
              Schedule appointments, set reminders, and manage your calendar efficiently.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Practice Settings</h3>
            <p className="text-gray-600 text-sm">
              Customize your practice settings, branding, and workflow preferences.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link 
            href="/login"
            className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center shadow-lg hover:shadow-xl"
          >
            Sign In to Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          
          <div className="mt-6">
            <p className="text-gray-600 mb-4">Need help getting started?</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                Contact Support
              </a>
              <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">
                View Documentation
              </a>
              <a href="#" className="text-primary-600 hover:text-primary-700 transition-colors">
                Watch Tutorials
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 