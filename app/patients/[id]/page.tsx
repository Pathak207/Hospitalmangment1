"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { 
  User, Phone, Mail, Heart, Pill, FileText, ArrowLeft, 
  Clipboard, Calendar, Activity, FlaskConical, FileCheck2, AlertCircle, CalendarPlus, PlusCircle, PencilIcon, AlertTriangle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/ui/modal-provider';
import { AppointmentsTab, VitalsTab, PrescriptionsTab, LabsTab, NotesTab } from '@/components/patients/tabs';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/patients/${params?.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        } else {
          console.error('Failed to fetch patient');
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchPatient();
    }
  }, [params?.id]);

  // Fetch recent appointments for the patient
  useEffect(() => {
    const fetchRecentAppointments = async () => {
      if (!params?.id) return;
      
      try {
        setAppointmentsLoading(true);
        const response = await fetch(`/api/appointments?patient=${params.id}&limit=5`);
        
        if (response.ok) {
          const data = await response.json();
          setRecentAppointments(data.appointments || []);
        } else {
          console.error('Failed to fetch appointments');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (params?.id) {
      fetchRecentAppointments();
    }
  }, [params?.id]);

  // Listen for patient updates
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Error refreshing patient:', error);
      }
    };

    const fetchRecentAppointments = async () => {
      if (!params?.id) return;
      
      try {
        const response = await fetch(`/api/appointments?patient=${params.id}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setRecentAppointments(data.appointments || []);
        }
      } catch (error) {
        console.error('Error refreshing appointments:', error);
      }
    };

    const handlePatientUpdated = (event: any) => {
      // Check if the updated patient is the one we're viewing
      if (event.detail && event.detail._id === params?.id) {
        fetchPatient();
      }
    };

    const handleAppointmentUpdated = () => {
      // Refresh appointments when any appointment is updated
      fetchRecentAppointments();
    };

    window.addEventListener('patientUpdated', handlePatientUpdated);
    window.addEventListener('appointmentCreated', handleAppointmentUpdated);
    window.addEventListener('appointmentUpdated', handleAppointmentUpdated);
    
    return () => {
      window.removeEventListener('patientUpdated', handlePatientUpdated);
      window.removeEventListener('appointmentCreated', handleAppointmentUpdated);
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdated);
    };
  }, [params?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading patient details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-gray-500 dark:text-gray-400"
              onClick={() => router.push('/patients')}
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Patients
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle size={48} className="mx-auto text-gray-400 mb-3" />
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Patient Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">The patient you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => router.push('/patients')}>Return to Patient List</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-gray-500 dark:text-gray-400"
            onClick={() => router.push('/patients')}
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Patients
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                openModal({
                  title: `Edit Patient - ${patient.name}`,
                  content: (
                    <div className="space-y-4">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <User size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>Patient editing functionality coming soon</p>
                      </div>
                    </div>
                  ),
                  size: "md"
                });
              }}
            >
              Edit Patient
            </Button>
            <Button 
              size="sm"
              onClick={() => openModal('newAppointment', { 
                patientId: patient._id,
                returnToPatient: true
              })}
            >
              <CalendarPlus size={14} className="mr-1" /> Schedule Appointment
            </Button>
          </div>
        </div>
        
        {/* Patient Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Patient Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-medium dark:bg-primary-900 dark:text-primary-300">
                {patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{patient.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{patient.age} years • {patient.gender} • {patient.bloodType || 'Unknown'}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                    {patient.patientId || patient._id}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Patient since: {patient.patientSince || 'Unknown'}
                </div>
              </div>
              <div className="ml-auto">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${patient.status === 'Active' 
                      ? 'bg-success-100 text-success-800 dark:bg-success-800/20 dark:text-success-400' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}
                >
                  {patient.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-8">
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'overview' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'appointments' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('appointments')}
                >
                  Appointments
                </button>
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'vitals' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('vitals')}
                >
                  Vitals
                </button>
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'medications' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('medications')}
                >
                  Prescriptions
                </button>
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'labs' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('labs')}
                >
                  Labs
                </button>
                <button 
                  className={`border-b-2 py-2 px-1 text-sm font-medium ${
                    activeTab === 'notes' 
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Personal Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{patient.dob || 'N/A'} ({patient.age} years)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{patient.contact || patient.contactNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Email:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{patient.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Medical Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Condition</div>
                      <div className="mt-1 flex items-center">
                        <Heart size={14} className="text-danger-500 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{patient.primaryCondition || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {patient.secondaryConditions && patient.secondaryConditions.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Conditions</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {patient.secondaryConditions.map((condition: string, idx: number) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {patient.allergies && patient.allergies.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Allergies</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {patient.allergies.map((allergy: string, idx: number) => (
                            <span key={idx} className="text-xs bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded dark:bg-warning-900/20 dark:text-warning-400">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {patient.bloodType && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Type</div>
                        <div className="mt-1 text-sm text-gray-900 dark:text-white">{patient.bloodType}</div>
                      </div>
                    )}
                  </div>
                </div>

                {patient.medications && patient.medications.length > 0 && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Current Medications</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="space-y-2">
                        {patient.medications.map((medication: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Pill size={16} className="text-primary-500" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {typeof medication === 'string' 
                                  ? medication 
                                  : `${medication.name} ${medication.dosage} ${medication.frequency}`}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <FileText size={14} className="text-gray-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Appointments</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    {appointmentsLoading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentAppointments.map((appointment) => (
                          <div key={appointment._id} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                              <Calendar size={16} className="text-primary-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {format(parseISO(appointment.date), 'MMM d, yyyy')} • {appointment.time}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {appointment.type} • {appointment.reason}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span 
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                  ${appointment.status === 'Confirmed' 
                                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400' 
                                    : appointment.status === 'Completed' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                      : appointment.status === 'Cancelled' 
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'}`}
                              >
                                {appointment.status}
                              </span>
                              <Button variant="ghost" size="sm">
                                <FileText size={14} className="text-gray-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {recentAppointments.length === 0 && (
                          <div className="text-center py-6">
                            <Calendar className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
                            <Button variant="outline" size="sm" className="mt-2" onClick={() => openModal('newAppointment', { patientId: patient._id, returnToPatient: true })}>
                              <CalendarPlus className="mr-2 h-4 w-4" />
                              Schedule Appointment
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appointments' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Appointments</h3>
                  <Button 
                    size="sm"
                    onClick={() => openModal('newAppointment', { patientId: patient._id, returnToPatient: true })}
                  >
                    <CalendarPlus size={14} className="mr-1" /> Schedule Appointment
                  </Button>
                </div>
                
                {/* Appointment list would go here - mocking for now */}
                <div className="text-center py-10">
                  <Calendar size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
                </div>
              </div>
            )}
            
            {activeTab === 'vitals' && (
              <div className="p-4">
                <VitalsTab patient={patient} />
              </div>
            )}
            
            {activeTab === 'medications' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white">Prescriptions</h3>
                  <Button 
                    size="sm"
                    onClick={() => openModal('newPrescription', { 
                      patientId: patient._id, 
                      patientName: patient.name,
                      returnToPatient: true
                    })}
                  >
                    <Pill size={14} className="mr-1" /> Add Prescription
                  </Button>
                </div>
                
                <PrescriptionsTab patient={patient} />
              </div>
            )}
            
            {activeTab === 'labs' && (
              <div className="p-4">
                <LabsTab patient={patient} />
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="p-4">
                <NotesTab patient={patient} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 