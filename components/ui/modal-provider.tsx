'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useSettings } from '@/lib/settings-context';
import { X, Eye, Edit, Trash2, Calendar as CalendarIcon, Calendar, Clock, User, Plus, Search, Stethoscope, FileText, Activity, Heart, ChevronDown, Printer, Download, CreditCard, DollarSign, Check, AlertCircle, Phone, Mail, MapPin, Filter, Info, FileDown, PlusCircle, Pill, Pencil, FileCheck2, FlaskConical, CheckCircle, Package, Users, Zap, Settings, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, isSameDay, isToday, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { formatDateTime, cn } from '@/lib/utils';

// Patient tab component imports
import { AppointmentsTab } from '@/components/patients/tabs/appointments-tab';
import { VitalsTab } from '@/components/patients/tabs/vitals-tab';
import { PrescriptionsTab } from '@/components/patients/tabs/prescriptions-tab';
import { LabsTab } from '@/components/patients/tabs/labs-tab';
import { NotesTab } from '@/components/patients/tabs/notes-tab';

// Modal types
type ModalType = 
  | 'newAppointment'
  | 'newPrescription'
  | 'addPatient'
  | 'addMedication'
  | 'viewCalendar'
  | 'viewPatientDetails'
  | 'patientActions'
  | 'editPatient'
  | 'viewMedicalRecords'
  | 'viewLabResults'
  | 'processPayment'
  | 'appointmentPayment'
  | 'viewInvoice'
  | 'orderLab'
  | 'viewLabDetails'
  | 'addLabResults'
  | 'editLabResults'
  | 'billingPortal';

interface ModalContextType {
  openModal: (type: ModalType | { title: string; content: React.ReactNode; size?: string }, data?: any) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [customModal, setCustomModal] = useState<{title: string; content: React.ReactNode; size?: string} | null>(null);
  const [parentModal, setParentModal] = useState<{type: ModalType; data: any} | null>(null); // Track parent modal

  // Use settings for currency formatting
  const { formatCurrency } = useSettings();

  // Patient Details Modal state
  const [activeTab, setActiveTab] = useState('overview');

  // Calendar modal state
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarAppointments, setCalendarAppointments] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Calendar appointment form state
  const [calendarFormData, setCalendarFormData] = useState({
    patient: '',
    date: '',
    time: '',
    type: '',
    duration: '30 min',
    reason: '',
    status: 'Confirmed'
  });
  const [calendarFormPatients, setCalendarFormPatients] = useState<any[]>([]);
  const [calendarFormLoading, setCalendarFormLoading] = useState(false);
  const [calendarFormPatientSearchQuery, setCalendarFormPatientSearchQuery] = useState('');
  const [calendarFormFilteredPatients, setCalendarFormFilteredPatients] = useState<any[]>([]);
  const [calendarFormShowPatientDropdown, setCalendarFormShowPatientDropdown] = useState(false);
  const [calendarFormSelectedPatient, setCalendarFormSelectedPatient] = useState<any>(null);

  // Appointment modal states
  const [newAppointmentLoading, setNewAppointmentLoading] = useState(false);
  const [newAppointmentPatients, setNewAppointmentPatients] = useState<any[]>([]);
  const [newAppointmentFilteredPatients, setNewAppointmentFilteredPatients] = useState<any[]>([]);
  const [newAppointmentPatientSearchQuery, setNewAppointmentPatientSearchQuery] = useState('');
  const [newAppointmentShowPatientDropdown, setNewAppointmentShowPatientDropdown] = useState(false);
  const [newAppointmentSelectedPatient, setNewAppointmentSelectedPatient] = useState<any>(null);
  const [newAppointmentFormData, setNewAppointmentFormData] = useState({
    patient: '',
    date: '',
    time: '',
    type: '',
    duration: '30 min',
    reason: ''
  });

  // Prescription modal states
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionPatients, setPrescriptionPatients] = useState<any[]>([]);
  const [prescriptionFilteredPatients, setPrescriptionFilteredPatients] = useState<any[]>([]);
  const [prescriptionPatientSearchQuery, setPrescriptionPatientSearchQuery] = useState('');
  const [prescriptionShowPatientDropdown, setPrescriptionShowPatientDropdown] = useState(false);
  const [prescriptionSelectedPatient, setPrescriptionSelectedPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [allMedications, setAllMedications] = useState<any[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<any[]>([]);
  const [medicationSearchQuery, setMedicationSearchQuery] = useState('');
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<any[]>([]);
  const [prescriptionFormData, setPrescriptionFormData] = useState({
    patient: '',
    diagnosis: '',
    notes: '',
    status: 'Active'
  });

  // Add Patient form state
  const [addPatientFormData, setAddPatientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    medicalHistory: ''
  });

  // Edit Patient form state
  const [editPatientFormData, setEditPatientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodType: '',
    address: '',
    medicalHistory: '',
    allergies: ''
  });

  // Add Medication form state
  const [addMedicationLoading, setAddMedicationLoading] = useState(false);
  const [addMedicationFormData, setAddMedicationFormData] = useState({
    name: '',
    genericName: '',
    strength: '',
    formulation: 'Tablet',
    manufacturer: '',
    category: '',
    description: '',
    sideEffects: '',
    contraindications: ''
  });

  // Add Patient form submission
  const [addPatientLoading, setAddPatientLoading] = useState(false);

  // Lab modal states
  const [labLoading, setLabLoading] = useState(false);
  const [labPatients, setLabPatients] = useState<any[]>([]);
  const [labFilteredPatients, setLabFilteredPatients] = useState<any[]>([]);
  const [labPatientSearchQuery, setLabPatientSearchQuery] = useState('');
  const [labShowPatientDropdown, setLabShowPatientDropdown] = useState(false);
  const [labSelectedPatient, setLabSelectedPatient] = useState<any>(null);
  const [labFormData, setLabFormData] = useState({
    patient: '',
    testName: '',
    category: '',
    urgency: 'Routine',
    notes: ''
  });
  const [labResultFields, setLabResultFields] = useState<{ name: string, value: string, unit: string, referenceRange: string, flag: string }[]>([
    { name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' }
  ]);
  const [labResultSummary, setLabResultSummary] = useState('');

  // Appointment types from database
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [appointmentTypesLoading, setAppointmentTypesLoading] = useState(false);

  // Fetch appointment types from API
  const fetchAppointmentTypes = async () => {
    try {
      setAppointmentTypesLoading(true);
      console.log('🔍 Modal Provider: Fetching appointment types...');
      const response = await fetch('/api/appointment-types');
      console.log('🔍 Modal Provider: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Modal Provider: API response data:', data);
        // The API returns appointment types directly as an array, not wrapped in an object
        const types = Array.isArray(data) ? data : (data.appointmentTypes || []);
        console.log('🔍 Modal Provider: Extracted appointment types:', types);
        setAppointmentTypes(types);
        
        // Set default appointment type to the first one if available
        if (types.length > 0) {
          const defaultType = types[0];
          console.log('🔍 Modal Provider: Setting default type:', defaultType);
          // Update form defaults if they're empty
          setCalendarFormData(prev => ({
            ...prev,
            type: prev.type === '' ? defaultType.name : prev.type,
            duration: prev.type === '' ? `${defaultType.duration} min` : prev.duration
          }));
          setNewAppointmentFormData(prev => ({
            ...prev,
            type: prev.type === '' ? defaultType.name : prev.type,
            duration: prev.type === '' ? `${defaultType.duration} min` : prev.duration
          }));
        } else {
          console.log('⚠️ Modal Provider: No appointment types found');
        }
      } else {
        console.error('❌ Modal Provider: Failed to fetch appointment types, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Modal Provider: Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Modal Provider: Error fetching appointment types:', error);
    } finally {
      setAppointmentTypesLoading(false);
    }
  };

  // Load appointment types when component mounts
  useEffect(() => {
    fetchAppointmentTypes();
    
    // Listen for appointment types updates
    const handleAppointmentTypesUpdate = () => {
      fetchAppointmentTypes();
    };
    
    window.addEventListener('appointmentTypesUpdated', handleAppointmentTypesUpdate);
    return () => window.removeEventListener('appointmentTypesUpdated', handleAppointmentTypesUpdate);
  }, []);

  // Modal functions
  const openModal = (type: ModalType | { title: string; content: React.ReactNode; size?: string }, data?: any) => {
    if (typeof type === 'string') {
      // Track parent modal for nested navigation
      if ((type === 'newAppointment' || type === 'newPrescription') && 
          (modalType === 'patientActions' || modalType === 'viewPatientDetails')) {
        setParentModal({ type: modalType, data: modalData });
      }
      // If opening payment modal from calendar modal, save the parent
      else if ((type === 'processPayment' || type === 'appointmentPayment') && modalType === 'viewCalendar') {
        setParentModal({ type: modalType, data: modalData });
      }
      // If opening nested modals from patient actions or details
      else if ((type === 'editPatient' || type === 'viewMedicalRecords' || type === 'viewLabResults') && 
               (modalType === 'patientActions' || modalType === 'viewPatientDetails')) {
        setParentModal({ type: modalType, data: modalData });
      }
      
      setModalType(type);
      setModalData(data);
      setCustomModal(null);
    } else {
      // For custom modals, also track parent modal if currently viewing patient details
      if (modalType === 'viewPatientDetails' || modalType === 'patientActions') {
        setParentModal({ type: modalType, data: modalData });
      }
      
      setModalType(null);
      setModalData(null);
      setCustomModal(type);
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    // If there's a parent modal, return to it instead of closing everything
    if (parentModal) {
      setModalType(parentModal.type);
      setModalData(parentModal.data);
      setCustomModal(null); // Clear custom modal when returning to parent
      setParentModal(null);
      // Don't reset forms when returning to parent modal
      return;
    }
    
    // Otherwise close everything normally
    setIsOpen(false);
    setModalType(null);
    setModalData(null);
    setCustomModal(null);
    setParentModal(null);
    // Reset all form states
    resetAllForms();
  };

  const resetAllForms = () => {
    // Reset appointment form
    setNewAppointmentFormData({
      patient: '',
      date: '',
      time: '',
      type: '',
      duration: '30 min',
      reason: ''
    });
    setNewAppointmentPatientSearchQuery('');
    setNewAppointmentSelectedPatient(null);
    setNewAppointmentShowPatientDropdown(false);

    // Reset prescription form
    setPrescriptionFormData({
      patient: '',
      diagnosis: '',
      notes: '',
      status: 'Active'
    });
    setPrescriptionPatientSearchQuery('');
    setPrescriptionSelectedPatient(null);
    setPrescriptionShowPatientDropdown(false);
    setSelectedMedications([]);
    setMedicationSearchQuery('');
    setShowMedicationDropdown(false);
    setAllMedications([]);
    setFilteredMedications([]);

    // Reset patient details modal tab
    setActiveTab('overview');

    // Reset calendar modal forms
    setEditingAppointment(null);
    setShowNewAppointmentForm(false);
    setSelectedTimeSlot('');
    setCalendarFormData({
      patient: '',
      date: '',
      time: '',
      type: '',
      duration: '30 min',
      reason: '',
      status: 'Confirmed'
    });
    setCalendarFormPatients([]);
    setCalendarFormLoading(false);
    setCalendarFormPatientSearchQuery('');
    setCalendarFormFilteredPatients([]);
    setCalendarFormShowPatientDropdown(false);
    setCalendarFormSelectedPatient(null);

    // Reset add patient form
    setAddPatientFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      bloodType: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      allergies: '',
      medicalHistory: ''
    });

    // Reset edit patient form
    setEditPatientFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      bloodType: '',
      address: '',
      medicalHistory: '',
      allergies: ''
    });

    // Reset add medication form
    setAddMedicationFormData({
      name: '',
      genericName: '',
      strength: '',
      formulation: 'Tablet',
      manufacturer: '',
      category: '',
      description: '',
      sideEffects: '',
      contraindications: ''
    });
    setAddMedicationLoading(false);

    // Reset lab forms
    setLabFormData({
      patient: '',
      testName: '',
      category: '',
      urgency: 'Routine',
      notes: ''
    });
    setLabPatientSearchQuery('');
    setLabSelectedPatient(null);
    setLabShowPatientDropdown(false);
    setLabResultFields([
      { name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' }
    ]);
    setLabResultSummary('');
    setLabLoading(false);
  };

  // Effect to populate addMedication form when editing
  useEffect(() => {
    if (modalType === 'addMedication' && modalData && modalData._id) {
      // Populate form with existing medication data for editing
      setAddMedicationFormData({
        name: modalData.name || '',
        genericName: modalData.genericName || '',
        strength: modalData.strength || '',
        formulation: modalData.formulation || 'Tablet',
        manufacturer: modalData.manufacturer || '',
        category: modalData.category || '',
        description: modalData.description || '',
        sideEffects: modalData.sideEffects ? (Array.isArray(modalData.sideEffects) ? modalData.sideEffects.join(', ') : modalData.sideEffects) : '',
        contraindications: modalData.contraindications ? (Array.isArray(modalData.contraindications) ? modalData.contraindications.join(', ') : modalData.contraindications) : ''
      });
    }
  }, [modalType, modalData]);

  // Effect to populate editPatient form when editing
  useEffect(() => {
    if (modalType === 'editPatient' && modalData && modalData._id) {
      // Format the date of birth for the date input
      const formatDateForInput = (date) => {
        if (!date) return '';
        try {
          const d = new Date(date);
          if (isNaN(d.getTime())) return '';
          return d.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      // Populate form with existing patient data for editing
      const formData = {
        name: modalData.name || '',
        email: modalData.email || '',
        phone: modalData.contactNumber || modalData.phone || '',
        dob: formatDateForInput(modalData.dob),
        gender: modalData.gender || '',
        bloodType: modalData.bloodType || '',
        address: modalData.address || '',
        medicalHistory: modalData.medicalHistory ? (Array.isArray(modalData.medicalHistory) ? modalData.medicalHistory.join(', ') : modalData.medicalHistory) : '',
        allergies: modalData.allergies ? (Array.isArray(modalData.allergies) ? modalData.allergies.join(', ') : modalData.allergies) : ''
      };

      setEditPatientFormData(formData);
    } else if (modalType === 'editPatient' && !modalData) {
      // Reset form if no modal data
      setEditPatientFormData({
        name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        bloodType: '',
        address: '',
        medicalHistory: '',
        allergies: ''
      });
    }
  }, [modalType, modalData]);

  // Additional effect to ensure form is populated when modal opens
  useEffect(() => {
    if (isOpen && modalType === 'editPatient' && modalData) {
      console.log('Modal opened - current form state:', editPatientFormData);
      console.log('Modal opened - expected data:', modalData);
    }
  }, [isOpen, modalType, modalData, editPatientFormData]);

  // Appointment modal functions
  const fetchAppointmentPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setNewAppointmentPatients(data.patients || []);
      setNewAppointmentFilteredPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleAppointmentPatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNewAppointmentPatientSearchQuery(query);
    setNewAppointmentShowPatientDropdown(true);
    
    if (newAppointmentSelectedPatient) {
      setNewAppointmentSelectedPatient(null);
      setNewAppointmentFormData(prev => ({ ...prev, patient: '' }));
    }
  };

  const selectAppointmentPatient = (patient: any) => {
    setNewAppointmentSelectedPatient(patient);
    setNewAppointmentPatientSearchQuery(`${patient.name} (${patient.patientId})`);
    setNewAppointmentFormData(prev => ({ ...prev, patient: patient._id }));
    setNewAppointmentShowPatientDropdown(false);
  };

  const handleAppointmentSubmit = async () => {
    try {
      setNewAppointmentLoading(true);
      
      if (!newAppointmentFormData.patient || !newAppointmentFormData.date || !newAppointmentFormData.time) {
        toast.error('Please fill in all required fields');
        return;
      }

      const isEditing = modalData?.isEditing;
      const appointmentId = modalData?.editingAppointmentId;
      
      const loadingToast = toast.loading(isEditing ? 'Updating appointment...' : 'Scheduling appointment...');

      const url = isEditing ? `/api/appointments/${appointmentId}` : '/api/appointments';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointmentFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'schedule'} appointment`);
      }

      toast.dismiss(loadingToast);
      toast.success(`Appointment ${isEditing ? 'updated' : 'scheduled'} successfully!`);
      
      // If there's a parent modal, return to it, otherwise close everything
      if (parentModal) {
        setModalType(parentModal.type);
        setModalData(parentModal.data);
        setParentModal(null);
        // Reset only appointment form
        setNewAppointmentFormData({
          patient: '',
          date: '',
          time: '',
          type: appointmentTypes.length > 0 ? appointmentTypes[0].name : '',
          duration: '30 min',
          reason: ''
        });
        setNewAppointmentPatientSearchQuery('');
        setNewAppointmentSelectedPatient(null);
        setNewAppointmentShowPatientDropdown(false);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error(`Error ${modalData?.isEditing ? 'updating' : 'scheduling'} appointment:`, error);
      toast.error(error.message || `Failed to ${modalData?.isEditing ? 'update' : 'schedule'} appointment`);
    } finally {
      setNewAppointmentLoading(false);
    }
  };

  // Prescription modal functions
  const fetchPrescriptionPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPrescriptionPatients(data.patients || []);
      setPrescriptionFilteredPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const fetchAllMedications = async () => {
    try {
      const response = await fetch('/api/medications');
      if (!response.ok) throw new Error('Failed to fetch medications');
      const data = await response.json();
      setAllMedications(data.medications || []);
      setFilteredMedications(data.medications || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      // Fallback to sample medications if API fails
      const sampleMedications = [
        { _id: '1', name: 'Amoxicillin', type: 'Antibiotic', strength: '500mg' },
        { _id: '2', name: 'Ibuprofen', type: 'Pain Reliever', strength: '200mg' },
        { _id: '3', name: 'Lisinopril', type: 'ACE Inhibitor', strength: '10mg' },
        { _id: '4', name: 'Metformin', type: 'Diabetes', strength: '500mg' },
        { _id: '5', name: 'Atorvastatin', type: 'Statin', strength: '20mg' },
        { _id: '6', name: 'Omeprazole', type: 'Proton Pump Inhibitor', strength: '20mg' },
        { _id: '7', name: 'Hydrochlorothiazide', type: 'Diuretic', strength: '25mg' },
        { _id: '8', name: 'Prednisone', type: 'Corticosteroid', strength: '5mg' }
      ];
      setAllMedications(sampleMedications);
      setFilteredMedications(sampleMedications);
    }
  };

  const handlePrescriptionPatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setPrescriptionPatientSearchQuery(query);
    setPrescriptionShowPatientDropdown(true);
    
    if (prescriptionSelectedPatient) {
      setPrescriptionSelectedPatient(null);
      setPrescriptionFormData(prev => ({ ...prev, patient: '' }));
    }
  };

  const selectPrescriptionPatient = (patient: any) => {
    setPrescriptionSelectedPatient(patient);
    setPrescriptionPatientSearchQuery(`${patient.name} (${patient.patientId})`);
    setPrescriptionFormData(prev => ({ ...prev, patient: patient._id }));
    setPrescriptionShowPatientDropdown(false);
  };

  const handleMedicationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMedicationSearchQuery(query);
    setShowMedicationDropdown(true);
    
    // Filter medications based on search query
    if (query.trim() === '') {
      setFilteredMedications(allMedications);
    } else {
      const filtered = allMedications.filter(medication => 
        medication.name.toLowerCase().includes(query.toLowerCase()) ||
        (medication.type && medication.type.toLowerCase().includes(query.toLowerCase())) ||
        (medication.strength && medication.strength.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredMedications(filtered);
    }
  };

  const selectMedication = (medication: any) => {
    setSelectedMedications(prev => [...prev, {
      name: medication.name,
      dosage: '',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: '',
      refills: 0
    }]);
    setMedicationSearchQuery('');
    setFilteredMedications(allMedications);
    setShowMedicationDropdown(false);
  };

  const handlePrescriptionSubmit = async () => {
    try {
      setPrescriptionLoading(true);
      
      if (!prescriptionFormData.patient || selectedMedications.length === 0) {
        toast.error('Please select a patient and at least one medication');
        return;
      }

      const loadingToast = toast.loading('Creating prescription...');

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prescriptionFormData,
          medications: selectedMedications
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create prescription');
      }

      toast.dismiss(loadingToast);
      toast.success('Prescription created successfully!');
      
      // If there's a parent modal, return to it, otherwise close everything
      if (parentModal) {
        setModalType(parentModal.type);
        setModalData(parentModal.data);
        setParentModal(null);
        // Reset only prescription form
        setPrescriptionFormData({
          patient: '',
          diagnosis: '',
          notes: '',
          status: 'Active'
        });
        setPrescriptionPatientSearchQuery('');
        setPrescriptionSelectedPatient(null);
        setPrescriptionShowPatientDropdown(false);
        setSelectedMedications([]);
        setMedicationSearchQuery('');
        setShowMedicationDropdown(false);
      } else {
      closeModal();
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error(error.message || 'Failed to create prescription');
    } finally {
      setPrescriptionLoading(false);
    }
  };

  // Calendar form patient functions
  const handleCalendarFormPatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCalendarFormPatientSearchQuery(query);
    setCalendarFormShowPatientDropdown(true);
    
    if (calendarFormSelectedPatient) {
      setCalendarFormSelectedPatient(null);
      setCalendarFormData(prev => ({ ...prev, patient: '' }));
    }
  };

  const selectCalendarFormPatient = (patient: any) => {
    setCalendarFormSelectedPatient(patient);
    setCalendarFormPatientSearchQuery(`${patient.name} (${patient.patientId})`);
    setCalendarFormData(prev => ({ ...prev, patient: patient._id }));
    setCalendarFormShowPatientDropdown(false);
  };

  // Effects
  useEffect(() => {
    if (modalType === 'newAppointment') {
      fetchAppointmentPatients();
      // Set form data from modal data if provided
      if (modalData) {
        let timeValue = '';
        if (modalData.time) {
          // Convert 24-hour format to 12-hour format if needed
          if (modalData.time.includes(':') && !modalData.time.includes(' ')) {
            // 24-hour format like "14:00"
            const [hours, minutes] = modalData.time.split(':');
            const hour24 = parseInt(hours);
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const period = hour24 >= 12 ? 'PM' : 'AM';
            timeValue = `${hour12}:${minutes} ${period}`;
          } else if (modalData.time.includes(' ')) {
            // Already in 12-hour format like "2:00 PM"
            timeValue = modalData.time;
          }
        }
        
        setNewAppointmentFormData(prev => ({
          ...prev,
          date: modalData.date || format(new Date(), 'yyyy-MM-dd'),
          time: timeValue,
          type: modalData.type || (appointmentTypes.length > 0 ? appointmentTypes[0].name : ''),
          duration: modalData.duration || '30 min',
          reason: modalData.reason || '',
          patient: modalData.patientId || modalData._id || ''
        }));
        
        // Pre-select patient if provided
        if (modalData.patientId || modalData._id) {
          const patientForSelection = {
            _id: modalData.patientId || modalData._id,
            name: modalData.patientName || modalData.name,
            patientId: modalData.patientId || modalData.patientId,
            email: modalData.email || ''
          };
          setNewAppointmentSelectedPatient(patientForSelection);
          setNewAppointmentPatientSearchQuery(`${patientForSelection.name} (${patientForSelection.patientId || patientForSelection._id})`);
          setNewAppointmentShowPatientDropdown(false);
        }
      }
    } else if (modalType === 'newPrescription') {
      fetchPrescriptionPatients();
      fetchAllMedications();
      
      // Pre-select patient if provided in modalData
      if (modalData && (modalData.patientId || modalData._id)) {
        const patientForSelection = {
          _id: modalData.patientId || modalData._id,
          name: modalData.patientName || modalData.name,
          patientId: modalData.patientId || modalData.patientId,
          email: modalData.email || ''
        };
        setPrescriptionSelectedPatient(patientForSelection);
        setPrescriptionPatientSearchQuery(`${patientForSelection.name} (${patientForSelection.patientId || patientForSelection._id})`);
        setPrescriptionFormData(prev => ({
          ...prev,
          patient: patientForSelection._id
        }));
        setPrescriptionShowPatientDropdown(false);
      }
    }
  }, [modalType, modalData]);

  // Helper function to generate time slots based on schedule settings
  const generateTimeSlots = () => {
    // Load schedule settings from localStorage
    const savedSettings = localStorage.getItem('scheduleSettings');
    let settings = {
      startTime: '08:00 AM',
      endTime: '05:00 PM',
      interval: 15, // 15-minute intervals
      workDays: [0, 1, 2, 3, 4, 5, 6],
      lunchBreak: {
        start: '12:00 PM',
        end: '01:00 PM',
        enabled: false
      }
    };

    if (savedSettings) {
      try {
        settings = { ...settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error parsing schedule settings:', error);
      }
    }

    const { startTime, endTime, interval, lunchBreak } = settings;
    
    // Function to convert time string to minutes
    const toMinutes = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };

    // Function to convert minutes to time string
    const toTimeString = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    };

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    const lunchStartMin = lunchBreak.enabled ? toMinutes(lunchBreak.start) : null;
    const lunchEndMin = lunchBreak.enabled ? toMinutes(lunchBreak.end) : null;

    const slots: string[] = [];
    
    for (let i = startMinutes; i < endMinutes; i += interval) {
      // Skip lunch break
      if (lunchBreak.enabled && lunchStartMin !== null && lunchEndMin !== null && i >= lunchStartMin && i < lunchEndMin) {
        continue;
      }
      slots.push(toTimeString(i));
    }
    
    return slots;
  };

  // Filter patients for appointment
  useEffect(() => {
    if (newAppointmentPatientSearchQuery) {
      const filtered = newAppointmentPatients.filter(patient => 
        patient.name.toLowerCase().includes(newAppointmentPatientSearchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(newAppointmentPatientSearchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(newAppointmentPatientSearchQuery.toLowerCase())
      );
      setNewAppointmentFilteredPatients(filtered);
    } else {
      setNewAppointmentFilteredPatients(newAppointmentPatients);
    }
  }, [newAppointmentPatientSearchQuery, newAppointmentPatients]);

  // Filter patients for prescription
  useEffect(() => {
    if (prescriptionPatientSearchQuery) {
      const filtered = prescriptionPatients.filter(patient => 
        patient.name.toLowerCase().includes(prescriptionPatientSearchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(prescriptionPatientSearchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(prescriptionPatientSearchQuery.toLowerCase())
      );
      setPrescriptionFilteredPatients(filtered);
    } else {
      setPrescriptionFilteredPatients(prescriptionPatients);
    }
  }, [prescriptionPatientSearchQuery, prescriptionPatients]);

  // Search medications
  useEffect(() => {
    // Filter medications when search query changes
    if (medicationSearchQuery.trim() === '') {
      setFilteredMedications(allMedications);
    } else {
      const filtered = allMedications.filter(medication => 
        medication.name.toLowerCase().includes(medicationSearchQuery.toLowerCase()) ||
        (medication.type && medication.type.toLowerCase().includes(medicationSearchQuery.toLowerCase())) ||
        (medication.strength && medication.strength.toLowerCase().includes(medicationSearchQuery.toLowerCase()))
      );
      setFilteredMedications(filtered);
    }
  }, [medicationSearchQuery, allMedications]);

  // Filter patients for lab modals
  useEffect(() => {
    if (labPatientSearchQuery) {
      const filtered = labPatients.filter(patient => 
        patient.name.toLowerCase().includes(labPatientSearchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(labPatientSearchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(labPatientSearchQuery.toLowerCase())
      );
      setLabFilteredPatients(filtered);
    } else {
      setLabFilteredPatients(labPatients);
    }
  }, [labPatientSearchQuery, labPatients]);

  // Fetch calendar appointments
  useEffect(() => {
    if (modalType === 'viewCalendar') {
      const fetchCalendarAppointments = async () => {
        try {
          setCalendarLoading(true);
          const response = await fetch('/api/appointments');
          if (response.ok) {
            const data = await response.json();
            setCalendarAppointments(data.appointments || []);
          }
        } catch (error) {
          console.error('Error fetching calendar appointments:', error);
        } finally {
          setCalendarLoading(false);
        }
      };
      fetchCalendarAppointments();

      // Listen for payment events to refresh calendar
      const handlePaymentProcessed = () => {
        console.log('💰 Payment processed event received, refreshing appointments...');
        fetchCalendarAppointments();
      };
      
      window.addEventListener('payment-processed', handlePaymentProcessed);
      
      return () => {
        window.removeEventListener('payment-processed', handlePaymentProcessed);
      };
    }
  }, [modalType, calendarCurrentDate]);

  // Fetch patients for calendar form
  useEffect(() => {
    if (modalType === 'viewCalendar' && (editingAppointment || showNewAppointmentForm)) {
      const fetchPatients = async () => {
        try {
          const response = await fetch('/api/patients');
          if (response.ok) {
            const data = await response.json();
            setCalendarFormPatients(data.patients || []);
          }
        } catch (error) {
          console.error('Error fetching patients:', error);
        }
      };
      fetchPatients();
    }
  }, [modalType, editingAppointment, showNewAppointmentForm]);

  // Update form data when editing appointment
  useEffect(() => {
    if (editingAppointment) {
      setCalendarFormData({
        patient: editingAppointment.patient?._id || '',
        date: editingAppointment.date || format(calendarCurrentDate, 'yyyy-MM-dd'),
        time: editingAppointment.time || '',
        type: editingAppointment.type || 'Follow-up',
        duration: editingAppointment.duration || '30 min',
        reason: editingAppointment.reason || '',
        status: editingAppointment.status || 'Confirmed'
      });
      // Set patient info for editing
      if (editingAppointment.patient) {
        setCalendarFormSelectedPatient(editingAppointment.patient);
        setCalendarFormPatientSearchQuery(`${editingAppointment.patient.name} (${editingAppointment.patient.patientId})`);
      }
    } else if (showNewAppointmentForm) {
      setCalendarFormData({
        patient: '',
        date: format(calendarCurrentDate, 'yyyy-MM-dd'),
        time: selectedTimeSlot || '',
        type: appointmentTypes.length > 0 ? appointmentTypes[0].name : '',
        duration: '30 min',
        reason: '',
        status: 'Confirmed'
      });
      // Clear patient selection for new appointments
      setCalendarFormSelectedPatient(null);
      setCalendarFormPatientSearchQuery('');
      setCalendarFormShowPatientDropdown(false);
    }
  }, [editingAppointment, showNewAppointmentForm, selectedTimeSlot, calendarCurrentDate]);

  // Filter patients for calendar form
  useEffect(() => {
    if (calendarFormPatientSearchQuery) {
      const filtered = calendarFormPatients.filter(patient => 
        patient.name.toLowerCase().includes(calendarFormPatientSearchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(calendarFormPatientSearchQuery.toLowerCase()) ||
        (patient.email && patient.email.toLowerCase().includes(calendarFormPatientSearchQuery.toLowerCase()))
      );
      setCalendarFormFilteredPatients(filtered);
    } else {
      setCalendarFormFilteredPatients(calendarFormPatients);
    }
  }, [calendarFormPatientSearchQuery, calendarFormPatients]);

  // Update search query when patient is selected
  useEffect(() => {
    if (editingAppointment && editingAppointment.patient) {
      setCalendarFormSelectedPatient(editingAppointment.patient);
      setCalendarFormPatientSearchQuery(`${editingAppointment.patient.name} (${editingAppointment.patient.patientId})`);
    }
  }, [editingAppointment]);

  // Fetch patients for lab modals
  useEffect(() => {
    if (modalType === 'orderLab' || modalType === 'addLabResults' || modalType === 'editLabResults') {
      fetchLabPatients();
    }
  }, [modalType]);

  // Patient Details Modal
  const renderPatientDetailsModal = () => {
    const patient = modalData;
    
    if (!patient || !patient.name) {
      return (
        <Modal isOpen={modalType === 'viewPatientDetails'} onClose={closeModal} title="Patient Details">
          <div className="p-4 text-center">
            <p>No patient data available.</p>
          </div>
        </Modal>
      );
    }

    return (
      <Modal isOpen={modalType === 'viewPatientDetails'} onClose={closeModal} title={`Patient Details: ${patient.name}`} size="xl">
        <div className="space-y-6">
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
                  <div className="space-y-3">
                    {patient.lastVisit && (
                      <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-primary-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Last Visit: {patient.lastVisit}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Follow-up for {patient.primaryCondition || 'check-up'}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <FileText size={14} className="text-gray-400" />
                        </Button>
                      </div>
                    )}
                    {patient.upcomingVisit && (
                      <div className="flex items-center justify-between p-2 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800/30">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-primary-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Upcoming Visit: {patient.upcomingVisit}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Regular check-up</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Pencil size={14} className="text-gray-400" />
                        </Button>
                      </div>
                    )}
                    {!patient.lastVisit && !patient.upcomingVisit && (
                      <div className="text-center py-6">
                        <Calendar className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'appointments' && <AppointmentsTab patient={patient} />}
          {activeTab === 'vitals' && <VitalsTab patient={patient} />}
          {activeTab === 'medications' && <PrescriptionsTab patient={patient} />}
          {activeTab === 'labs' && <LabsTab patient={patient} />}
          {activeTab === 'notes' && <NotesTab patient={patient} />}
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={closeModal}>
            Close
          </Button>
          <Button variant="outline" className="flex items-center" onClick={() => {
            openModal('newAppointment', {
              ...modalData,
              patientId: modalData._id,
              patientName: modalData.name,
              returnToPatient: true
            });
          }}>
            <Calendar size={16} className="mr-2" />
            Schedule Appointment
          </Button>
          <Button variant="primary" className="flex items-center" onClick={() => {
            openModal('newPrescription', {
              ...modalData,
              patientId: modalData._id,
              patientName: modalData.name,
              returnToPatient: true
            });
          }}>
            <FileText size={16} className="mr-2" />
            New Prescription
          </Button>
        </div>
      </Modal>
    );
  };

  // Patient Actions Modal
  const renderPatientActionsModal = () => {
    const patient = modalData;
    
    if (!patient || !patient.name) {
      return (
        <Modal isOpen={modalType === 'patientActions'} onClose={closeModal} title="Patient Actions">
          <div className="p-4 text-center">
            <p>No patient data available.</p>
          </div>
        </Modal>
      );
    }

    return (
      <Modal isOpen={modalType === 'patientActions'} onClose={closeModal} title="Patient Actions">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
              {patient.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{patient.patientId || patient._id}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start" onClick={() => {
              openModal('viewPatientDetails', patient);
            }}>
              <User size={16} className="mr-2 text-primary-500" />
              View Patient Details
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {
              openModal('newAppointment', {
                ...patient,
                patientId: patient._id,
                patientName: patient.name,
                returnToPatient: true
              });
            }}>
              <Calendar size={16} className="mr-2 text-green-500" />
              Schedule Appointment
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {
              openModal('newPrescription', {
                ...patient,
                patientId: patient._id,
                patientName: patient.name,
                returnToPatient: true
              });
            }}>
              <Pill size={16} className="mr-2 text-purple-500" />
              Create Prescription
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => {
              openModal('editPatient', patient);
            }}>
              <Pencil size={16} className="mr-2 text-blue-500" />
              Edit Patient
            </Button>
            <Button variant="outline" className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20 justify-start" onClick={async () => {
              if (confirm(`Are you sure you want to delete patient ${patient.name}? This action cannot be undone.`)) {
                try {
                  const response = await fetch(`/api/patients/${patient._id}`, {
                    method: 'DELETE',
                  });
                  
                  if (response.ok) {
                    toast.success('Patient deleted successfully');
                    closeModal();
                    // Refresh the page or redirect to patients list
                    window.location.href = '/patients';
                  } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete patient');
                  }
                } catch (error) {
                  console.error('Error deleting patient:', error);
                  toast.error(error.message || 'Failed to delete patient');
                }
              }
            }}>
              <Trash2 size={16} className="mr-2" />
              Delete Patient
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
        </div>
      </Modal>
    );
  };

  // View Calendar Modal
  const renderViewCalendarModal = () => {
    if (modalType !== 'viewCalendar') {
      return null;
    }

    // Function to navigate to day view for a specific date
    const navigateToDay = (date: Date) => {
      setCalendarCurrentDate(date);
      setCalendarView('day');
    };

    // Function to handle appointment click
    const handleAppointmentClick = (appointment: any) => {
      const appointmentDate = new Date(appointment.date);
      navigateToDay(appointmentDate);
    };

    // Function to delete appointment
    const handleDeleteAppointment = async (appointmentId: string) => {
      if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
      }

      try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete appointment');
        }

        toast.success('Appointment deleted successfully');
        
        // Refresh calendar appointments
        const fetchCalendarAppointments = async () => {
          try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
              const data = await response.json();
              setCalendarAppointments(data.appointments || []);
            }
          } catch (error) {
            console.error('Error refreshing calendar appointments:', error);
            // If API fails, keep the locally updated state
          }
        };
        fetchCalendarAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        toast.error('Failed to delete appointment');
      }
    };

    // Function to start editing appointment
    const handleEditAppointment = (appointment: any) => {
      setEditingAppointment(appointment);
    };

    // Function to save edited appointment
    const handleSaveAppointment = async (appointmentData: any) => {
      try {
        const response = await fetch(`/api/appointments/${editingAppointment._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          throw new Error('Failed to update appointment');
        }

        toast.success('Appointment updated successfully');
        setEditingAppointment(null);
        
        // Refresh calendar appointments
        const fetchCalendarAppointments = async () => {
          try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
              const data = await response.json();
              setCalendarAppointments(data.appointments || []);
            }
          } catch (error) {
            console.error('Error refreshing calendar appointments:', error);
            // If API fails, keep the locally updated state
          }
        };
        fetchCalendarAppointments();
      } catch (error) {
        console.error('Error updating appointment:', error);
        toast.error('Failed to update appointment');
      }
    };

    // Function to add new appointment
    const handleAddAppointment = async (appointmentData: any) => {
      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appointmentData),
        });

        if (!response.ok) {
          throw new Error('Failed to create appointment');
        }

        toast.success('Appointment created successfully');
        setShowNewAppointmentForm(false);
        setSelectedTimeSlot('');
        
        // Refresh calendar appointments
        const fetchCalendarAppointments = async () => {
          try {
            const response = await fetch('/api/appointments');
            if (response.ok) {
              const data = await response.json();
              setCalendarAppointments(data.appointments || []);
            }
          } catch (error) {
            console.error('Error refreshing calendar appointments:', error);
            // If API fails, keep the locally updated state
          }
        };
        fetchCalendarAppointments();
      } catch (error) {
        console.error('Error creating appointment:', error);
        toast.error('Failed to create appointment');
      }
    };

    // Generate 15-minute time slots from 8:00 AM to 5:00 PM
    const generateTimeSlots = () => {
      const slots: string[] = [];
      for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
          
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const period = hour >= 12 ? 'PM' : 'AM';
          const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
          slots.push(timeString);
        }
      }
      return slots;
    };

    // Render inline appointment form
    const renderAppointmentForm = (appointment: any = null, timeSlot: string = '') => {
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCalendarFormLoading(true);
        
        if (appointment) {
          await handleSaveAppointment(calendarFormData);
        } else {
          await handleAddAppointment(calendarFormData);
        }
        
        setCalendarFormLoading(false);
      };

      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">
              {appointment ? 'Edit Appointment' : 'New Appointment'}
            </h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setEditingAppointment(null);
                setShowNewAppointmentForm(false);
                setSelectedTimeSlot('');
                // Reset patient search state
                setCalendarFormPatientSearchQuery('');
                setCalendarFormSelectedPatient(null);
                setCalendarFormShowPatientDropdown(false);
              }}
            >
              <X size={16} />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <div className="relative">
                  <input
                    type="text"
                    value={calendarFormPatientSearchQuery}
                    onChange={handleCalendarFormPatientSearch}
                    onFocus={() => setCalendarFormShowPatientDropdown(true)}
                    placeholder="Search patients..."
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    required={!calendarFormSelectedPatient}
                  />
                  <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  
                  {calendarFormShowPatientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {calendarFormFilteredPatients.length > 0 ? (
                        calendarFormFilteredPatients.map((patient) => (
                          <div
                            key={patient._id}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            onClick={() => selectCalendarFormPatient(patient)}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {patient.patientId} • {patient.email}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No patients found</div>
                      )}
                    </div>
                  )}
                  
                  {/* Click outside to close dropdown */}
                  {calendarFormShowPatientDropdown && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setCalendarFormShowPatientDropdown(false)}
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <select
                  value={calendarFormData.time}
                  onChange={(e) => setCalendarFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                >
                  <option value="">Select Time</option>
                  {generateTimeSlots().map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={calendarFormData.type}
                  onChange={(e) => {
                    const selectedType = appointmentTypes.find(type => type.name === e.target.value);
                    setCalendarFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value,
                      duration: selectedType ? `${selectedType.duration} min` : prev.duration
                    }));
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  {appointmentTypes.length > 0 ? (
                    appointmentTypes.map((type) => (
                      <option key={type._id} value={type.name}>
                        {type.name}
                      </option>
                    ))
                  ) : appointmentTypesLoading ? (
                    <option value="">Loading appointment types...</option>
                  ) : (
                    <option value="">No appointment types configured</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  value={calendarFormData.duration}
                  onChange={(e) => setCalendarFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                value={calendarFormData.reason}
                onChange={(e) => setCalendarFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={2}
                placeholder="Enter reason for visit"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingAppointment(null);
                  setShowNewAppointmentForm(false);
                  setSelectedTimeSlot('');
                  // Reset patient search state
                  setCalendarFormPatientSearchQuery('');
                  setCalendarFormSelectedPatient(null);
                  setCalendarFormShowPatientDropdown(false);
                  setCalendarFormData({
                    patient: '',
                    date: format(calendarCurrentDate, 'yyyy-MM-dd'),
                    time: '',
                    type: '',
                    duration: '30 min',
                    reason: '',
                    status: 'Confirmed'
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                size="sm"
                disabled={calendarFormLoading}
              >
                {calendarFormLoading ? 'Saving...' : (appointment ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </div>
      );
    };
    
    return (
      <Modal 
        isOpen={modalType === 'viewCalendar'} 
        onClose={closeModal}
        title="Calendar View"
        size="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="primary" 
              onClick={() => {
                setShowNewAppointmentForm(true);
                setSelectedTimeSlot('');
              }}
            >
              <PlusCircle size={16} className="mr-2" />
              New Appointment
            </Button>
            <Button variant="outline" onClick={closeModal}>Close</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* View Toggle Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant={calendarView === 'day' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setCalendarView('day')}
                >
                  Day
                </Button>
                <Button 
                  variant={calendarView === 'week' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setCalendarView('week')}
                >
                  Week
                </Button>
                <Button 
                  variant={calendarView === 'month' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setCalendarView('month')}
                >
                  Month
                </Button>
              </div>
              
              <h3 className="text-xl font-semibold">
                {calendarView === 'day' && format(calendarCurrentDate, 'MMMM d, yyyy')}
                {calendarView === 'week' && `Week of ${format(calendarCurrentDate, 'MMMM d, yyyy')}`}
                {calendarView === 'month' && format(calendarCurrentDate, 'MMMM yyyy')}
              </h3>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const newDate = new Date(calendarCurrentDate);
                if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
                else if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
                else newDate.setMonth(newDate.getMonth() - 1);
                setCalendarCurrentDate(newDate);
              }}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCalendarCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const newDate = new Date(calendarCurrentDate);
                if (calendarView === 'day') newDate.setDate(newDate.getDate() + 1);
                else if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
                else newDate.setMonth(newDate.getMonth() + 1);
                setCalendarCurrentDate(newDate);
              }}>
                Next
              </Button>
            </div>
          </div>

          {/* Show appointment form if editing or creating new */}
          {editingAppointment && renderAppointmentForm(editingAppointment)}
          {showNewAppointmentForm && renderAppointmentForm(null, selectedTimeSlot)}

          {calendarLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Day View */}
              {calendarView === 'day' && (
                <div className="space-y-4">
                  <div className="rounded-lg">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium">{format(calendarCurrentDate, 'EEEE, MMMM d, yyyy')}</h4>
                    </div>
                    <div className="p-4">
                      {/* Time slots with appointments */}
                      <div className="space-y-2">
                        {Array.from({ length: 36 }, (_, i) => {
                          const hour = Math.floor(i / 4) + 8; // Start from 8 AM, 4 slots per hour
                          const minute = (i % 4) * 15; // 0, 15, 30, 45 minutes
                          const timeSlot = `${hour <= 12 ? hour : hour - 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                          const currentDateStr = format(calendarCurrentDate, 'yyyy-MM-dd');
                          
                          // Function to check if this slot is occupied by any appointment
                          const isSlotOccupied = () => {
                            return calendarAppointments.some(apt => {
                              const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
                              if (aptDate !== currentDateStr) return false;
                              
                              // Parse appointment time and duration
                              const [aptTimeStr] = apt.time.split(' ');
                              const [aptHour, aptMinute] = aptTimeStr.split(':').map(Number);
                              const aptTotalMinutes = (aptHour <= 12 && apt.time.includes('PM') && aptHour !== 12 ? aptHour + 12 : aptHour) * 60 + aptMinute;
                              
                              // Parse current slot time
                              const slotTotalMinutes = hour * 60 + minute;
                              
                              // Get duration in minutes
                              const durationStr = apt.duration || '30 min';
                              const durationMinutes = parseInt(durationStr.replace(/[^\d]/g, '')) || 30;
                              
                              // Check if this slot falls within the appointment duration
                              return slotTotalMinutes >= aptTotalMinutes && slotTotalMinutes < (aptTotalMinutes + durationMinutes);
                            });
                          };
                          
                          // Find appointments that START at this exact time slot
                          const appointmentsAtTime = calendarAppointments.filter(apt => {
                            const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
                            if (aptDate !== currentDateStr) return false;
                            
                            // More precise time matching
                            const aptTime = apt.time.toLowerCase();
                            const slotTime = timeSlot.toLowerCase();
                            
                            // Extract hour and minute from both
                            const [aptTimeStr, aptPeriod] = aptTime.split(' ');
                            const [aptHour, aptMinute] = aptTimeStr.split(':').map(Number);
                            
                            const [slotTimeStr, slotPeriod] = slotTime.split(' ');
                            const [slotHour, slotMinute] = slotTimeStr.split(':').map(Number);
                            
                            // Convert to 24-hour for comparison
                            const aptHour24 = aptPeriod === 'pm' && aptHour !== 12 ? aptHour + 12 : (aptPeriod === 'am' && aptHour === 12 ? 0 : aptHour);
                            const slotHour24 = slotPeriod === 'pm' && slotHour !== 12 ? slotHour + 12 : (slotPeriod === 'am' && slotHour === 12 ? 0 : slotHour);
                            
                            return aptHour24 === slotHour24 && aptMinute === slotMinute;
                          });

                          const isOccupied = isSlotOccupied();
                          const hasAppointmentStart = appointmentsAtTime.length > 0;

                          return (
                            <div key={`timeslot-${i}-${timeSlot}`} className="space-y-2">
                              <div className="flex items-start gap-4 py-2 min-h-[50px] border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                <div className="w-20 text-sm text-gray-500 dark:text-gray-400 font-medium pt-1">
                                  {timeSlot}
                                </div>
                                <div className="flex-1">
                                  {hasAppointmentStart ? (
                                    <div className="space-y-2">
                                      {appointmentsAtTime.map((appointment, idx) => (
                                        <div key={`apt-${appointment._id}-${idx}`} className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md p-3 group hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="font-medium text-primary-900 dark:text-primary-100">
                                                {appointment.patient?.name || 'Unknown Patient'}
                                              </div>
                                              <div className="text-sm text-primary-700 dark:text-primary-300">
                                                {appointment.type} • {appointment.duration || '30 min'}
                                              </div>
                                              <div className="text-sm text-primary-600 dark:text-primary-400">
                                                {appointment.reason}
                                              </div>
                                              {/* Payment status indicator */}
                                              <div className="flex items-center gap-2 mt-2">
                                                {appointment.paid ? (
                                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    <DollarSign size={10} />
                                                    Paid
                                                  </span>
                                                ) : (
                                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                    <DollarSign size={10} />
                                                    Unpaid
                                                  </span>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                  appointment.status === 'Confirmed' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : appointment.status === 'Pending'
                                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                  {appointment.status}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                appointment.status === 'Confirmed' 
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                  : appointment.status === 'Pending'
                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                              }`}>
                                                {appointment.status}
                                              </span>
                                              {/* Payment button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openModal('appointmentPayment', appointment);
                                                }}
                                                disabled={appointment.paid}
                                                className={`h-6 w-6 p-0 ${appointment.paid 
                                                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800/20 dark:border-gray-600 dark:text-gray-500"
                                                  : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400 dark:hover:bg-green-900/30"
                                                }`}
                                                title={appointment.paid ? "Payment already processed" : "Process payment"}
                                              >
                                                <DollarSign size={12} />
                                              </Button>
                                              {/* Action buttons for day view */}
                                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm"
                                                  onClick={() => {
                                                    setEditingAppointment(appointment);
                                                    setSelectedTimeSlot(timeSlot); // Set the selected time slot for positioning
                                                  }}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Pencil size={12} />
                                                </Button>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm"
                                                  onClick={() => handleDeleteAppointment(appointment._id)}
                                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                >
                                                  <Trash2 size={12} />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : isOccupied ? (
                                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm italic p-2 rounded">
                                      Occupied (part of appointment)
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setShowNewAppointmentForm(true);
                                        setSelectedTimeSlot(timeSlot);
                                      }}
                                      className="w-full text-left text-gray-400 dark:text-gray-600 text-sm italic hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                                    >
                                      Available - Click to add appointment
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show form inline at the selected time slot */}
                              {((editingAppointment && selectedTimeSlot === timeSlot) || 
                                (showNewAppointmentForm && selectedTimeSlot === timeSlot)) && (
                                <div className="ml-24">
                                  {renderAppointmentForm(editingAppointment, timeSlot)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Week View - keeping existing implementation */}
              {calendarView === 'week' && (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Week days header */}
                    <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800">
                      <div className="p-3 border-r border-gray-200 dark:border-gray-700"></div>
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(calendarCurrentDate);
                        date.setDate(date.getDate() - date.getDay() + i); // Start from Sunday
                        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        
                        return (
                          <div 
                            key={i} 
                            className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                            onClick={() => navigateToDay(date)}
                          >
                            <div className="text-sm font-medium">{format(date, 'EEE')}</div>
                            <div className={`text-lg ${isToday ? 'font-bold text-primary-600 dark:text-primary-400' : ''}`}>
                              {format(date, 'd')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Time slots */}
                    <div className="max-h-96 overflow-y-auto">
                      {Array.from({ length: 36 }, (_, i) => {
                        const hour = Math.floor(i / 4) + 8;
                        const minute = (i % 4) * 15;
                        const timeSlot = `${hour <= 12 ? hour : hour - 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
                        
                        return (
                          <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700 min-h-[40px]">
                            <div className="p-2 border-r border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                              {timeSlot}
                            </div>
                            {Array.from({ length: 7 }, (_, dayIndex) => {
                              const date = new Date(calendarCurrentDate);
                              date.setDate(date.getDate() - date.getDay() + dayIndex);
                              const dateStr = format(date, 'yyyy-MM-dd');
                              
                              const appointmentsAtTime = calendarAppointments.filter(apt => {
                                const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
                                const aptTime = apt.time.toLowerCase();
                                return aptDate === dateStr && (
                                  aptTime.includes(timeSlot.split(':')[0].toLowerCase()) && 
                                  aptTime.includes(minute === 0 ? ':00' : minute === 15 ? ':15' : minute === 30 ? ':30' : ':45')
                                );
                              });
                              
                              return (
                                <div key={dayIndex} className="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                                  {appointmentsAtTime.map((appointment, idx) => (
                                    <div 
                                      key={idx} 
                                      className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs p-1 rounded mb-1 truncate cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                                      onClick={() => handleAppointmentClick(appointment)}
                                      title={`${appointment.patient?.name || 'Unknown'} - ${appointment.type} - Click to view details`}
                                    >
                                      {appointment.patient?.name || 'Unknown'}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Month View - keeping existing implementation */}
              {calendarView === 'month' && (
                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Month days header */}
                    <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7">
                      {Array.from({ length: 42 }, (_, i) => {
                        const firstDay = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), 1);
                        const startDate = new Date(firstDay);
                        startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                        
                        const isCurrentMonth = startDate.getMonth() === calendarCurrentDate.getMonth();
                        const isToday = format(startDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        const dateStr = format(startDate, 'yyyy-MM-dd');
                        
                        const dayAppointments = calendarAppointments.filter(apt => {
                          const aptDate = format(new Date(apt.date), 'yyyy-MM-dd');
                          return aptDate === dateStr;
                        });
                        
                        return (
                          <div 
                            key={i}
                            className={`min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors ${
                              isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                            } ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                            onClick={() => navigateToDay(startDate)}
                          >
                            <div className={`text-sm font-medium mb-1 ${
                              isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                            } ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}`}>
                              {format(startDate, 'd')}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 2).map((appointment, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs p-1 rounded truncate hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppointmentClick(appointment);
                                  }}
                                  title={`${appointment.time} - ${appointment.patient?.name || 'Unknown'} - Click to view details`}
                                >
                                  {appointment.time} {appointment.patient?.name || 'Unknown'}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  +{dayAppointments.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    );
  };

  // Process Payment Modal Component
  const ProcessPaymentModal = () => {
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [manualEntry, setManualEntry] = useState<boolean>(false);
    const [unpaidAppointments, setUnpaidAppointments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState({
      patient: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      paymentMethod: 'Card',
      transactionId: '',
      cardType: '',
      lastFourDigits: '',
      notes: ''
    });
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [printReceipt, setPrintReceipt] = useState<boolean>(true);
    const [emailReceipt, setEmailReceipt] = useState<boolean>(false);

    // Fetch unpaid appointments when the modal opens
    useEffect(() => {
      if (modalType === 'processPayment' || modalType === 'appointmentPayment') {
        fetchUnpaidAppointments();
        fetchPatients();
        
        // If modalData is provided (from appointment page), pre-select it
        if (modalData && modalType === 'appointmentPayment') {
          setSelectedAppointment(modalData);
          setManualEntry(false);
        }
      }
    }, [modalType, modalData]);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    };

    // Fetch unpaid appointments from the API
    const fetchUnpaidAppointments = async (search = '') => {
      try {
        setLoading(true);
        const response = await fetch('/api/appointments');
        if (response.ok) {
          const data = await response.json();
          // Filter for unpaid appointments (you may need to adjust this based on your data structure)
          const unpaid = data.appointments?.filter((apt: any) => !apt.paid) || [];
          setUnpaidAppointments(unpaid);
        } else {
          // Show sample data if API fails
          setUnpaidAppointments([
            {
              _id: 'temp-1',
              appointmentId: 'APT-2350',
              patient: { name: 'Emily Johnson', patientId: 'PAT-1001' },
              date: '2023-09-15',
              type: 'Follow-up',
              amount: 150.00,
              doctor: 'Doctor'
            },
            {
              _id: 'temp-2',
              appointmentId: 'APT-2351',
              patient: { name: 'Robert Smith', patientId: 'PAT-1002' },
              date: '2023-09-14',
              type: 'Consultation',
              amount: 200.00,
              doctor: 'Doctor'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching unpaid appointments:', error);
        // Show sample data on error
        setUnpaidAppointments([
          {
            _id: 'temp-1',
            appointmentId: 'APT-2350',
            patient: { name: 'Emily Johnson', patientId: 'PAT-1001' },
            date: '2023-09-15',
            type: 'Follow-up',
            amount: 150.00,
            doctor: 'Doctor'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch patients for manual entry
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setPatients([]);
      }
    };

    const selectAppointment = (appointment: any) => {
      setSelectedAppointment(appointment);
      setManualEntry(false);
    };

    const toggleManualEntry = () => {
      setManualEntry(!manualEntry);
      setSelectedAppointment(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    const handleSubmitPayment = async () => {
      try {
        setSubmitLoading(true);
        
        let paymentData;
        
        if (selectedAppointment) {
          // Payment for selected appointment
          paymentData = {
            appointment: selectedAppointment._id,
            patient: selectedAppointment.patient._id || selectedAppointment.patient.id,
            amount: selectedAppointment.amount || getAppointmentFee(selectedAppointment.type),
            paymentMethod: formData.paymentMethod,
            transactionId: formData.transactionId,
            lastFourDigits: formData.lastFourDigits,
            notes: formData.notes,
            type: 'appointment'
          };
          
          console.log('🔍 PAYMENT DEBUG - Processing payment for appointment');
          console.log('📋 Selected Appointment:', JSON.stringify(selectedAppointment, null, 2));
          console.log('💰 Payment Data to Send:', JSON.stringify(paymentData, null, 2));
          
          // Make API call to record payment
          try {
            console.log('🚀 Making API call to /api/payments...');
            const response = await fetch('/api/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData),
            });
            
            console.log('📊 API Response Status:', response.status);
            console.log('📊 API Response OK:', response.ok);
            
            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Payment API Success - Response:', JSON.stringify(responseData, null, 2));
              
              toast.success(`Payment of $${paymentData.amount} processed for ${selectedAppointment.patient.name}`);
              
              // Emit event to refresh appointments (no need to update locally)
              window.dispatchEvent(new CustomEvent('payment-processed', {
                detail: { 
                  appointmentId: selectedAppointment._id,
                  amount: paymentData.amount,
                  paymentMethod: formData.paymentMethod
                }
              }));
            } else {
              const errorData = await response.json();
              console.error('❌ Payment API error - Status:', response.status);
              console.error('❌ Payment API error - Data:', JSON.stringify(errorData, null, 2));
              throw new Error(`API returned error status: ${errorData.error || 'Unknown error'}`);
            }
          } catch (apiError) {
            // Fallback for demo purposes when API doesn't exist
            console.log('❌ API call failed, using demo mode:', apiError);
            console.log('❌ Error details:', {
              message: apiError.message,
              stack: apiError.stack,
              name: apiError.name
            });
            toast.success(`Payment of $${paymentData.amount} processed for ${selectedAppointment.patient.name} (Demo mode)`);
            
            // Emit event to refresh appointments even in demo mode
            window.dispatchEvent(new CustomEvent('payment-processed', {
              detail: { 
                appointmentId: selectedAppointment._id,
                amount: paymentData.amount,
                paymentMethod: formData.paymentMethod
              }
            }));
          }
        } else if (manualEntry && formData.patient && formData.amount) {
          // Manual payment entry
          paymentData = {
            patient: formData.patient,
            amount: parseFloat(formData.amount),
            description: formData.description,
            category: formData.category,
            paymentMethod: formData.paymentMethod,
            transactionId: formData.transactionId,
            lastFourDigits: formData.lastFourDigits,
            notes: formData.notes,
            type: 'manual'
          };
          
          console.log('🔍 MANUAL PAYMENT DEBUG - Recording manual payment');
          console.log('💰 Manual Payment Data to Send:', JSON.stringify(paymentData, null, 2));
          
          // Make API call to record payment
          try {
            console.log('🚀 Making API call to /api/payments for manual payment...');
            const response = await fetch('/api/payments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentData),
            });
            
            console.log('📊 Manual Payment API Response Status:', response.status);
            console.log('📊 Manual Payment API Response OK:', response.ok);
            
            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Manual Payment API Success - Response:', JSON.stringify(responseData, null, 2));
              
              const selectedPatientName = patients.find(p => p._id === formData.patient)?.name || 'Patient';
              toast.success(`Manual payment of $${formData.amount} recorded for ${selectedPatientName}`);
              
              // Emit event to refresh appointments for manual payments too
              window.dispatchEvent(new CustomEvent('payment-processed', {
                detail: { 
                  manual: true,
                  patientId: formData.patient,
                  amount: parseFloat(formData.amount)
                }
              }));
            } else {
              const errorData = await response.json();
              console.error('❌ Manual Payment API error - Status:', response.status);
              console.error('❌ Manual Payment API error - Data:', JSON.stringify(errorData, null, 2));
              throw new Error(`Failed to record payment: ${errorData.error || 'Unknown error'}`);
            }
          } catch (apiError) {
            // Fallback for demo purposes when API doesn't exist
            console.log('❌ Manual payment API call failed, using demo mode:', apiError);
            console.log('❌ Manual Payment Error details:', {
              message: apiError.message,
              stack: apiError.stack,
              name: apiError.name
            });
            const selectedPatientName = patients.find(p => p._id === formData.patient)?.name || 'Patient';
            toast.success(`Manual payment of $${formData.amount} recorded for ${selectedPatientName} (Demo mode)`);
            
            // Emit event to refresh appointments for manual payments too
            window.dispatchEvent(new CustomEvent('payment-processed', {
              detail: { 
                manual: true,
                patientId: formData.patient,
                amount: parseFloat(formData.amount)
              }
            }));
          }
        } else {
          toast.error('Please select an appointment or fill in manual payment details');
          return;
        }
        
        // Close modal on success
        if (parentModal && parentModal.type === 'viewCalendar') {
          // If payment was opened from calendar modal, return to calendar modal
          setModalType('viewCalendar');
          setModalData(parentModal.data);
          setParentModal(null);
          
          // Refresh calendar appointments from API
          const fetchCalendarAppointments = async () => {
            try {
              console.log('🔄 Refreshing appointments after payment...');
              const response = await fetch('/api/appointments');
              if (response.ok) {
                const data = await response.json();
                console.log('✅ Appointments refreshed, found:', data.appointments?.length || 0);
                setCalendarAppointments(data.appointments || []);
              } else {
                console.log('⚠️ Failed to refresh appointments');
              }
            } catch (error) {
              console.error('❌ Error refreshing calendar appointments:', error);
            }
          };
          fetchCalendarAppointments();
        } else {
          // Normal payment modal, close everything
          closeModal();
        }
      } catch (error) {
        console.error('❌ Error processing payment:', error);
        toast.error('Failed to process payment');
      } finally {
        setSubmitLoading(false);
      }
    };

    // Helper function to get appointment fee
    const getAppointmentFee = (type: string) => {
      // Try to find the appointment type price from loaded appointment types
      const appointmentType = appointmentTypes.find(at => at.name === type);
      if (appointmentType && appointmentType.price) {
        return appointmentType.price;
      }
      
      // Fallback to hardcoded fees if appointment type not found
      const fees: { [key: string]: number } = {
        'Annual physical': 200.00,
        'Consultation': 150.00,
        'Follow-up': 100.00,
        'Check-up': 125.00,
        'Emergency': 175.00
      };
      return fees[type] || 125.00;
    };

    return (
      <Modal
        isOpen={modalType === 'processPayment' || modalType === 'appointmentPayment'}
        onClose={closeModal}
        title="Record Payment"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeModal} disabled={submitLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitPayment} disabled={submitLoading}>
              {submitLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Toggle between appointment and manual entry */}
          <div className="flex gap-4">
            <Button 
              variant={!manualEntry ? "primary" : "outline"} 
              onClick={() => {
                setManualEntry(false);
                if (modalData && modalType === 'appointmentPayment') {
                  setSelectedAppointment(modalData);
                }
              }}
              size="sm"
            >
              Appointment Payment
            </Button>
            <Button 
              variant={manualEntry ? "primary" : "outline"} 
              onClick={() => setManualEntry(true)}
              size="sm"
            >
              Manual Entry
            </Button>
          </div>

          {!manualEntry ? (
            /* Appointment Selection */
            <div>
              <h3 className="text-lg font-medium mb-4">
                {modalType === 'appointmentPayment' && selectedAppointment 
                  ? 'Process Payment for Appointment' 
                  : 'Select Unpaid Appointment'}
              </h3>
              
              {modalType === 'appointmentPayment' && selectedAppointment ? (
                /* Show pre-selected appointment from appointment page */
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-primary-50 dark:bg-primary-900/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-lg">{selectedAppointment.patient?.name || 'Unknown Patient'}</div>
                      <div className="text-sm text-gray-500">
                        ID: {selectedAppointment.patient?.patientId || selectedAppointment.patientId} • {selectedAppointment.date}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedAppointment.type} • {selectedAppointment.time} • Dr. {selectedAppointment.doctor}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600 text-lg">
                        ${selectedAppointment.amount || getAppointmentFee(selectedAppointment.type)}
                      </div>
                      <div className="text-sm text-gray-500">Appointment Fee</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show appointment selection list */
                <>
                  <div className="mb-4">
                    <Input
                      type="text"
                      placeholder="Search appointments by patient name or ID..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                    {loading ? (
                      <div className="p-4 text-center">Loading...</div>
                    ) : unpaidAppointments.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No unpaid appointments found</div>
                    ) : (
                      unpaidAppointments.map((appointment) => (
                        <div
                          key={appointment._id}
                          className={`p-3 border-b cursor-pointer transition-colors ${
                            selectedAppointment?._id === appointment._id
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => selectAppointment(appointment)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{appointment.patient?.name || 'Unknown Patient'}</div>
                              <div className="text-sm text-gray-500">
                                ID: {appointment.patient?.patientId || appointment.patientId} • {appointment.date}
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.type} • Dr. {appointment.doctor}
                              </div>
                            </div>
                            <div className="font-bold text-primary-600">
                              ${appointment.amount || getAppointmentFee(appointment.type)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Manual Entry Form */
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Manual Payment Entry</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Patient
                  </label>
                  <select
                    name="patient"
                    value={formData.patient}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} ({patient.patientId})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">Select Category</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Procedure">Procedure</option>
                  <option value="Medication">Medication</option>
                  <option value="Lab">Lab Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="payment-card"
                  name="paymentMethod"
                  value="Card"
                  checked={formData.paymentMethod === 'Card'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300"
                />
                <label htmlFor="payment-card" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Card Payment
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="payment-cash"
                  name="paymentMethod"
                  value="Cash"
                  checked={formData.paymentMethod === 'Cash'}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300"
                />
                <label htmlFor="payment-cash" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Cash
                </label>
              </div>
            </div>
          </div>

          {/* Card Details (if card payment selected) */}
          {formData.paymentMethod === 'Card' && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Card Payment Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Transaction ID
                  </label>
                  <Input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    placeholder="Transaction reference"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Last 4 Digits
                  </label>
                  <Input
                    type="text"
                    name="lastFourDigits"
                    value={formData.lastFourDigits}
                    onChange={handleChange}
                    placeholder="xxxx"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              placeholder="Additional notes about this payment..."
            />
          </div>
        </div>
      </Modal>
    );
  };

  // Add Patient form submission
  const handleAddPatientSubmit = async () => {
    try {
      setAddPatientLoading(true);
      
      // Validate required fields
      if (!addPatientFormData.name || !addPatientFormData.email || !addPatientFormData.phone || !addPatientFormData.dob || !addPatientFormData.gender) {
        toast.error('Please fill all required fields');
        setAddPatientLoading(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addPatientFormData.email)) {
        toast.error('Please enter a valid email address');
        setAddPatientLoading(false);
        return;
      }
      
      // Calculate age from date of birth
      const calculateAge = (dob: string) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      };
      
      // Process form data with correct field mapping
      const processedData = {
        name: addPatientFormData.name.trim(),
        email: addPatientFormData.email.trim().toLowerCase(),
        contactNumber: addPatientFormData.phone.trim(), // API expects contactNumber
        dob: addPatientFormData.dob,
        age: calculateAge(addPatientFormData.dob), // Calculate age from DOB
        gender: addPatientFormData.gender.toLowerCase(), // Convert to lowercase for enum
        bloodType: addPatientFormData.bloodType || undefined,
        address: addPatientFormData.address.trim() || undefined,
        city: addPatientFormData.city.trim() || undefined,
        state: addPatientFormData.state.trim() || undefined,
        zipCode: addPatientFormData.zipCode.trim() || undefined,
        emergencyContactName: addPatientFormData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: addPatientFormData.emergencyContactPhone.trim() || undefined,
        allergies: addPatientFormData.allergies ? addPatientFormData.allergies.split(',').map(item => item.trim()).filter(item => item) : [],
        medicalHistory: addPatientFormData.medicalHistory.trim() || undefined
      };
      
      const loadingToast = toast.loading('Adding patient...');
      
      // Submit the patient
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add patient');
      }
      
      const newPatient = await response.json();
      
      toast.dismiss(loadingToast);
      toast.success('Patient added successfully!');
      
      // Trigger a page refresh or update
      window.dispatchEvent(new CustomEvent('patientAdded', { detail: newPatient }));
      
    closeModal();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error(error.message || 'Failed to add patient');
    } finally {
      setAddPatientLoading(false);
    }
  };

  const handleAddMedicationSubmit = async () => {
    try {
      setAddMedicationLoading(true);
      
      // Validate required fields
      if (!addMedicationFormData.name || !addMedicationFormData.genericName || !addMedicationFormData.strength || !addMedicationFormData.formulation || !addMedicationFormData.manufacturer || !addMedicationFormData.category) {
        toast.error('Please fill all required fields');
        setAddMedicationLoading(false);
        return;
      }
      
      // Process form data
      const processedData = {
        name: addMedicationFormData.name,
        genericName: addMedicationFormData.genericName,
        strength: addMedicationFormData.strength,
        formulation: addMedicationFormData.formulation,
        manufacturer: addMedicationFormData.manufacturer,
        category: addMedicationFormData.category,
        description: addMedicationFormData.description,
        sideEffects: addMedicationFormData.sideEffects ? addMedicationFormData.sideEffects.split(',').map(item => item.trim()) : [],
        contraindications: addMedicationFormData.contraindications ? addMedicationFormData.contraindications.split(',').map(item => item.trim()) : []
      };
      
      // Determine if we're editing or creating
      const isEditing = modalData && modalData._id;
      const url = isEditing ? `/api/medications/${modalData._id}` : '/api/medications';
      const method = isEditing ? 'PUT' : 'POST';
      
      const loadingToast = toast.loading(isEditing ? 'Updating medication...' : 'Adding medication...');
      
      // Submit the medication
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'add'} medication`);
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Medication ${isEditing ? 'updated' : 'added'} successfully!`);
      
      // Trigger a page refresh or update
      window.dispatchEvent(new CustomEvent('medicationUpdated'));
      
      closeModal();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error(error.message || `Failed to ${modalData?._id ? 'update' : 'add'} medication`);
    } finally {
      setAddMedicationLoading(false);
    }
  };

  // Edit Patient form submission
  const [editPatientLoading, setEditPatientLoading] = useState(false);
  
  const handleEditPatientSubmit = async () => {
    try {
      setEditPatientLoading(true);
      
      // Validate required fields
      if (!editPatientFormData.name || !editPatientFormData.email || !editPatientFormData.phone || !editPatientFormData.gender) {
        toast.error('Please fill all required fields');
        setEditPatientLoading(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editPatientFormData.email)) {
        toast.error('Please enter a valid email address');
        setEditPatientLoading(false);
        return;
      }
      
      // Calculate age from date of birth if dob is provided
      const calculateAge = (dob: string) => {
        if (!dob) return null;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      };
      
      // Process form data with correct field mapping
      const processedData: any = {
        name: editPatientFormData.name.trim(),
        email: editPatientFormData.email.trim().toLowerCase(),
        contactNumber: editPatientFormData.phone.trim(),
        dob: editPatientFormData.dob || undefined,
        gender: editPatientFormData.gender.toLowerCase(),
        bloodType: editPatientFormData.bloodType || undefined,
        address: editPatientFormData.address.trim() || undefined,
        allergies: editPatientFormData.allergies ? editPatientFormData.allergies.split(',').map(item => item.trim()).filter(item => item) : [],
        medicalHistory: editPatientFormData.medicalHistory ? editPatientFormData.medicalHistory.split(',').map(item => item.trim()).filter(item => item) : []
      };
      
      // Add age if dob is provided
      if (editPatientFormData.dob) {
        const age = calculateAge(editPatientFormData.dob);
        if (age !== null) {
          processedData.age = age;
        }
      }
      
      const loadingToast = toast.loading('Updating patient...');
      
      // Submit the patient update
      const response = await fetch(`/api/patients/${modalData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update patient');
      }
      
      const updatedPatient = await response.json();
      
      toast.dismiss(loadingToast);
      toast.success('Patient updated successfully!');
      
      // Trigger a page refresh or update
      window.dispatchEvent(new CustomEvent('patientUpdated', { detail: updatedPatient }));
      
      // If there's a parent modal, return to it with updated patient data
      if (parentModal) {
        setModalType(parentModal.type);
        setModalData(updatedPatient); // Use the updated patient data instead of old parentModal.data
        setParentModal(null);
      } else {
        closeModal();
      }
      
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error(error.message || 'Failed to update patient');
    } finally {
      setEditPatientLoading(false);
    }
  };

  // Lab modal functions
  const fetchLabPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setLabPatients(data.patients || []);
      setLabFilteredPatients(data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const handleLabPatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLabPatientSearchQuery(query);
    setLabShowPatientDropdown(true);
    
    if (labSelectedPatient) {
      setLabSelectedPatient(null);
      setLabFormData(prev => ({ ...prev, patient: '' }));
    }
  };

  const selectLabPatient = (patient: any) => {
    setLabSelectedPatient(patient);
    setLabPatientSearchQuery(`${patient.name} (${patient.patientId})`);
    setLabFormData(prev => ({ ...prev, patient: patient._id }));
    setLabShowPatientDropdown(false);
  };

  const handleLabSubmit = async () => {
    try {
      setLabLoading(true);
      
      if (!labFormData.patient || !labFormData.testName) {
        toast.error('Please fill in all required fields');
        return;
      }

      const loadingToast = toast.loading('Ordering lab test...');

      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to order lab test');
      }

      toast.dismiss(loadingToast);
      toast.success('Lab test ordered successfully!');
      
      closeModal();
    } catch (error) {
      console.error('Error ordering lab test:', error);
      toast.error(error.message || 'Failed to order lab test');
    } finally {
      setLabLoading(false);
    }
  };

  const handleLabResultsSubmit = async () => {
    try {
      setLabLoading(true);
      
      if (!labFormData.patient || labResultFields.some(field => !field.name || !field.value)) {
        toast.error('Please fill in all required fields');
        return;
      }

      const loadingToast = toast.loading('Saving lab results...');

      const labId = modalData?._id;
      const url = labId ? `/api/labs/${labId}` : '/api/labs';
      const method = labId ? 'PUT' : 'POST';

      const payload = {
        ...labFormData,
        results: labResultFields,
        summary: labResultSummary,
        status: 'Completed'
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lab results');
      }

      toast.dismiss(loadingToast);
      toast.success('Lab results saved successfully!');
      
      closeModal();
    } catch (error) {
      console.error('Error saving lab results:', error);
      toast.error(error.message || 'Failed to save lab results');
    } finally {
      setLabLoading(false);
    }
  };

  const addLabResultField = () => {
    setLabResultFields([...labResultFields, { name: '', value: '', unit: '', referenceRange: '', flag: 'Normal' }]);
  };

  const removeLabResultField = (index: number) => {
    setLabResultFields(labResultFields.filter((_, i) => i !== index));
  };

  const updateLabResultField = (index: number, field: string, value: string) => {
    const updated = [...labResultFields];
    updated[index] = { ...updated[index], [field]: value };
    setLabResultFields(updated);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      
      {/* Render custom modals */}
      {isOpen && customModal && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={customModal.title}
          size={customModal.size as "sm" | "md" | "lg" | "xl" || "md"}
        >
          {customModal.content}
        </Modal>
      )}
      
      {/* Render standard modals */}
      {isOpen && modalType === 'newAppointment' && (
        <Modal 
          isOpen={modalType === 'newAppointment'} 
          onClose={closeModal}
          title={modalData?.isEditing ? "Edit Appointment" : "Schedule New Appointment"}
          footer={
            <>
              <Button variant="outline" onClick={closeModal} disabled={newAppointmentLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAppointmentSubmit} disabled={newAppointmentLoading}>
                {newAppointmentLoading 
                  ? (modalData?.isEditing ? 'Updating...' : 'Scheduling...') 
                  : (modalData?.isEditing ? 'Update Appointment' : 'Schedule Appointment')
                }
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <div className="relative">
                <input
                  type="text"
                  value={newAppointmentPatientSearchQuery}
                  onChange={handleAppointmentPatientSearch}
                  onFocus={() => setNewAppointmentShowPatientDropdown(true)}
                  placeholder="Search patients..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required={!newAppointmentSelectedPatient}
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {newAppointmentShowPatientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {newAppointmentFilteredPatients.length > 0 ? (
                      newAppointmentFilteredPatients.map((patient) => (
                        <div
                          key={patient._id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          onClick={() => selectAppointmentPatient(patient)}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {patient.patientId} • {patient.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No patients found</div>
                    )}
                  </div>
                )}
                
                {/* Click outside to close dropdown */}
                {newAppointmentShowPatientDropdown && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNewAppointmentShowPatientDropdown(false)}
                  />
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newAppointmentFormData.date}
                  onChange={(e) => setNewAppointmentFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <select
                  value={newAppointmentFormData.time}
                  onChange={(e) => setNewAppointmentFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                >
                  <option value="">Select Time</option>
                  {/* Generate time slots based on schedule settings */}
                  {generateTimeSlots().map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newAppointmentFormData.type}
                  onChange={(e) => {
                    const selectedType = appointmentTypes.find(type => type.name === e.target.value);
                    setNewAppointmentFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value,
                      duration: selectedType ? `${selectedType.duration} min` : prev.duration
                    }));
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  {appointmentTypes.length > 0 ? (
                    appointmentTypes.map((type) => (
                      <option key={type._id} value={type.name}>
                        {type.name}
                      </option>
                    ))
                  ) : appointmentTypesLoading ? (
                    <option value="">Loading appointment types...</option>
                  ) : (
                    <option value="">No appointment types configured</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <select
                  value={newAppointmentFormData.duration}
                  onChange={(e) => setNewAppointmentFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1">Reason for Visit</label>
              <textarea
                value={newAppointmentFormData.reason}
                onChange={(e) => setNewAppointmentFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={3}
                placeholder="Enter reason for the appointment"
                required
              />
            </div>
          </div>
        </Modal>
      )}
      {isOpen && modalType === 'newPrescription' && (
        <Modal 
          isOpen={modalType === 'newPrescription'} 
          onClose={closeModal}
          title="New Prescription"
          footer={
            <>
              <Button variant="outline" onClick={closeModal} disabled={prescriptionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePrescriptionSubmit} disabled={prescriptionLoading}>
                {prescriptionLoading ? 'Creating...' : 'Create Prescription'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <div className="relative">
                <input
                  type="text"
                  value={prescriptionPatientSearchQuery}
                  onChange={handlePrescriptionPatientSearch}
                  onFocus={() => setPrescriptionShowPatientDropdown(true)}
                  placeholder="Search patients..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required={!prescriptionSelectedPatient}
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {prescriptionShowPatientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {prescriptionFilteredPatients.length > 0 ? (
                      prescriptionFilteredPatients.map((patient) => (
                        <div
                          key={patient._id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          onClick={() => selectPrescriptionPatient(patient)}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {patient.patientId} • {patient.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No patients found</div>
                    )}
                  </div>
                )}
                
                {/* Click outside to close dropdown */}
                {prescriptionShowPatientDropdown && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setPrescriptionShowPatientDropdown(false)}
                  />
                )}
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium mb-1">Diagnosis</label>
              <input
                type="text"
                value={prescriptionFormData.diagnosis}
                onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                placeholder="Enter diagnosis"
                required
              />
            </div>

            {/* Medication Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Add Medications</label>
              <div className="relative">
                <input
                  type="text"
                  value={medicationSearchQuery}
                  onChange={handleMedicationSearch}
                  onFocus={() => {
                    setShowMedicationDropdown(true);
                    if (medicationSearchQuery.trim() === '') {
                      setFilteredMedications(allMedications);
                    }
                  }}
                  placeholder="Search medications..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {showMedicationDropdown && filteredMedications.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredMedications.map((medication) => (
                      <div
                        key={medication._id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        onClick={() => selectMedication(medication)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{medication.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {medication.type} • {medication.strength}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Click outside to close dropdown */}
                {showMedicationDropdown && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMedicationDropdown(false)}
                  />
                )}
              </div>
            </div>

            {/* Selected Medications */}
            {selectedMedications.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Selected Medications</label>
                <div className="space-y-3">
                  {selectedMedications.map((medication, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium text-gray-900 dark:text-white">{medication.name}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMedications(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={medication.dosage}
                            onChange={(e) => {
                              const updatedMeds = [...selectedMedications];
                              updatedMeds[index].dosage = e.target.value;
                              setSelectedMedications(updatedMeds);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., 10mg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Frequency</label>
                          <select
                            value={medication.frequency}
                            onChange={(e) => {
                              const updatedMeds = [...selectedMedications];
                              updatedMeds[index].frequency = e.target.value;
                              setSelectedMedications(updatedMeds);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                          >
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Duration</label>
                          <input
                            type="text"
                            value={medication.duration}
                            onChange={(e) => {
                              const updatedMeds = [...selectedMedications];
                              updatedMeds[index].duration = e.target.value;
                              setSelectedMedications(updatedMeds);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                            placeholder="e.g., 30 days"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Refills</label>
                          <input
                            type="number"
                            value={medication.refills}
                            onChange={(e) => {
                              const updatedMeds = [...selectedMedications];
                              updatedMeds[index].refills = parseInt(e.target.value) || 0;
                              setSelectedMedications(updatedMeds);
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                            min="0"
                            max="5"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Instructions</label>
                        <textarea
                          value={medication.instructions}
                          onChange={(e) => {
                            const updatedMeds = [...selectedMedications];
                            updatedMeds[index].instructions = e.target.value;
                            setSelectedMedications(updatedMeds);
                          }}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                          rows={2}
                          placeholder="Special instructions for this medication"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={prescriptionFormData.notes}
                onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={3}
                placeholder="Additional notes or instructions"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={prescriptionFormData.status}
                onChange={(e) => setPrescriptionFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
      {isOpen && modalType === 'viewPatientDetails' && renderPatientDetailsModal()}
      {isOpen && modalType === 'patientActions' && renderPatientActionsModal()}
      {isOpen && modalType === 'viewCalendar' && renderViewCalendarModal()}
      {isOpen && modalType === 'processPayment' && <ProcessPaymentModal />}
      {isOpen && modalType === 'appointmentPayment' && <ProcessPaymentModal />}
      {isOpen && modalType === 'viewInvoice' && (
        <Modal 
          isOpen={modalType === 'viewInvoice'} 
          onClose={closeModal}
          title="Invoice Details"
          size="lg"
          footer={
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      toast.error('Please allow popups to print the invoice');
                      return;
                    }
                    
                    // Create invoice data
                    const invoiceDate = new Date().toLocaleDateString();
                    const invoiceNumber = `INV-${new Date().getFullYear()}-${modalData?.id || Math.floor(Math.random() * 10000)}`;
                    const totalAmount = modalData?.amount || 0;
                    const paymentStatus = modalData?.paid ? 'Paid' : 'Unpaid';
                    const paymentDate = modalData?.paid ? (modalData?.paymentDate ? new Date(modalData.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()) : 'Not paid';
                    const formattedAmount = formatCurrency(totalAmount);
                    
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Print Invoice - ${modalData?.patientName}</title>
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
                              max-width: 800px;
                              margin: 0 auto;
                              padding: 20px;
                            }
                            .header {
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 30px;
                              padding-bottom: 20px;
                              border-bottom: 1px solid #ddd;
                            }
                            h1 {
                              margin: 0 0 10px 0;
                              color: #222;
                            }
                            p {
                              margin: 5px 0;
                            }
                            .invoice-label {
                              background-color: #f0f7ff;
                              color: #1a56db;
                              padding: 8px 12px;
                              border-radius: 4px;
                              font-weight: bold;
                              display: inline-block;
                            }
                            .details {
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 30px;
                            }
                            .details > div {
                              flex: 1;
                            }
                            h3 {
                              color: #555;
                              font-size: 14px;
                              margin-bottom: 8px;
                              text-transform: uppercase;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-bottom: 30px;
                            }
                            th {
                              background-color: #f9fafb;
                              text-align: left;
                              padding: 12px;
                              border-bottom: 1px solid #ddd;
                            }
                            td {
                              padding: 12px;
                              border-bottom: 1px solid #ddd;
                            }
                            .text-right {
                              text-align: right;
                            }
                            .total-row {
                              background-color: #f9fafb;
                              font-weight: bold;
                            }
                            .status {
                              padding: 15px;
                              margin-bottom: 20px;
                              background-color: #ecfdf5;
                              border: 1px solid #10b981;
                              border-radius: 4px;
                              color: #065f46;
                            }
                            .notes {
                              border-top: 1px solid #ddd;
                              padding-top: 20px;
                              color: #666;
                              font-size: 14px;
                            }
                            @media print {
                              body {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                              }
                            }
                          </style>
                        </head>
                        <body onload="setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 300);">
                          <div class="container">
                            <div class="header">
                              <div>
                                <h1>DoctorCare Medical Center</h1>
                                <p>123 Medical Center Dr.</p>
                                <p>Healthville, CA 12345</p>
                                <p>(555) 123-4567</p>
                              </div>
                              <div style="text-align: right;">
                                <div class="invoice-label">INVOICE</div>
                                <p style="margin-top: 10px;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                                <p><strong>Date:</strong> ${invoiceDate}</p>
                                <p><strong>Due Date:</strong> ${invoiceDate}</p>
                              </div>
                            </div>

                            <div class="details">
                              <div>
                                <h3>Bill To:</h3>
                                <p><strong>${modalData?.patientName}</strong></p>
                                <p>Patient ID: ${modalData?.patientId}</p>
                              </div>
                              <div>
                                <h3>Service Details:</h3>
                                <p><strong>Type:</strong> ${modalData?.type || 'Medical Service'}</p>
                                <p><strong>Date:</strong> ${modalData?.dateTime}</p>
                                <p><strong>Provider:</strong> ${modalData?.provider || 'Doctor'}</p>
                              </div>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th class="text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>${modalData?.type || 'Medical Service'} - ${modalData?.dateTime}</td>
                                  <td class="text-right">${formattedAmount}</td>
                                </tr>
                                <tr class="total-row">
                                  <td>Total</td>
                                  <td class="text-right">${formattedAmount}</td>
                                </tr>
                              </tbody>
                            </table>

                            <div class="status">
                              <strong>${paymentStatus === 'Paid' ? '✓ Payment Processed' : '⚠ Payment Pending'}</strong>
                              <span style="float: right;">${paymentStatus === 'Paid' ? `Paid on ${paymentDate}` : 'Not paid yet'}</span>
                            </div>

                            <div class="notes">
                              <p><strong>Note:</strong> Thank you for choosing DoctorCare Medical Center for your healthcare needs.</p>
                              <p style="margin-top: 10px;"><strong>Payment Terms:</strong> Payment is due upon receipt of this invoice.</p>
                            </div>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                >
                  <Printer size={16} className="mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const pdfWindow = window.open('', '_blank');
                    if (!pdfWindow) {
                      toast.error('Please allow popups to download the invoice');
                      return;
                    }
                    
                    // Create invoice data
                    const invoiceDate = new Date().toLocaleDateString();
                    const invoiceNumber = `INV-${new Date().getFullYear()}-${modalData?.id || Math.floor(Math.random() * 10000)}`;
                    const totalAmount = modalData?.amount || 0;
                    const paymentStatus = modalData?.paid ? 'Paid' : 'Unpaid';
                    const paymentDate = modalData?.paid ? (modalData?.paymentDate ? new Date(modalData.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()) : 'Not paid';
                    
                    pdfWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Download Invoice - ${modalData?.patientName}</title>
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
                              max-width: 800px;
                              margin: 0 auto;
                              padding: 20px;
                            }
                            .header {
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 30px;
                              padding-bottom: 20px;
                              border-bottom: 1px solid #ddd;
                            }
                            h1 {
                              margin: 0 0 10px 0;
                              color: #222;
                            }
                            p {
                              margin: 5px 0;
                            }
                            .invoice-label {
                              background-color: #f0f7ff;
                              color: #1a56db;
                              padding: 8px 12px;
                              border-radius: 4px;
                              font-weight: bold;
                              display: inline-block;
                            }
                            .details {
                              display: flex;
                              justify-content: space-between;
                              margin-bottom: 30px;
                            }
                            .details > div {
                              flex: 1;
                            }
                            h3 {
                              color: #555;
                              font-size: 14px;
                              margin-bottom: 8px;
                              text-transform: uppercase;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-bottom: 30px;
                            }
                            th {
                              background-color: #f9fafb;
                              text-align: left;
                              padding: 12px;
                              border-bottom: 1px solid #ddd;
                            }
                            td {
                              padding: 12px;
                              border-bottom: 1px solid #ddd;
                            }
                            .text-right {
                              text-align: right;
                            }
                            .total-row {
                              background-color: #f9fafb;
                              font-weight: bold;
                            }
                            .status {
                              padding: 15px;
                              margin-bottom: 20px;
                              background-color: #ecfdf5;
                              border: 1px solid #10b981;
                              border-radius: 4px;
                              color: #065f46;
                            }
                            .notes {
                              border-top: 1px solid #ddd;
                              padding-top: 20px;
                              color: #666;
                              font-size: 14px;
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
                            .download-btn {
                              display: flex;
                              justify-content: center;
                              margin-top: 20px;
                            }
                            button {
                              padding: 10px 20px;
                              background-color: #0066cc;
                              color: white;
                              border: none;
                              border-radius: 4px;
                              cursor: pointer;
                              font-size: 16px;
                            }
                            button:hover {
                              background-color: #0052a3;
                            }
                          </style>
                          <!-- Load jsPDF directly -->
                          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
                          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                        </head>
                        <body>
                          <div id="loading">
                            <div class="spinner"></div>
                            <p>Preparing your invoice for download...</p>
                          </div>
                          
                          <div id="invoice" class="container">
                            <div class="header">
                              <div>
                                <h1>DoctorCare Medical Center</h1>
                                <p>123 Medical Center Dr.</p>
                                <p>Healthville, CA 12345</p>
                                <p>(555) 123-4567</p>
                              </div>
                              <div style="text-align: right;">
                                <div class="invoice-label">INVOICE</div>
                                <p style="margin-top: 10px;"><strong>Invoice #:</strong> ${invoiceNumber}</p>
                                <p><strong>Date:</strong> ${invoiceDate}</p>
                                <p><strong>Due Date:</strong> ${invoiceDate}</p>
                              </div>
                            </div>

                            <div class="details">
                              <div>
                                <h3>Bill To:</h3>
                                <p><strong>${modalData?.patientName}</strong></p>
                                <p>Patient ID: ${modalData?.patientId}</p>
                              </div>
                              <div>
                                <h3>Service Details:</h3>
                                <p><strong>Type:</strong> Payment Receipt</p>
                                <p><strong>Date:</strong> ${modalData?.date}</p>
                                <p><strong>Method:</strong> ${modalData?.method}</p>
                              </div>
                            </div>

                            <table>
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th class="text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>${modalData?.description || 'Payment'} - ${modalData?.date}</td>
                                  <td class="text-right">${formatCurrency(totalAmount)}</td>
                                </tr>
                                <tr class="total-row">
                                  <td>Total</td>
                                  <td class="text-right">${formatCurrency(totalAmount)}</td>
                                </tr>
                              </tbody>
                            </table>

                            <div class="status">
                              <strong>${paymentStatus === 'Paid' ? '✓ Payment Processed' : '⚠ Payment Pending'}</strong>
                              <span style="float: right;">${paymentStatus === 'Paid' ? `Paid on ${paymentDate}` : 'Not paid yet'}</span>
                            </div>

                            <div class="notes">
                              <p><strong>Note:</strong> Thank you for choosing DoctorCare Medical Center for your healthcare needs.</p>
                              <p style="margin-top: 10px;"><strong>Payment Terms:</strong> Payment is due upon receipt of this invoice.</p>
                            </div>
                          </div>
                          
                          <script>
                            function downloadPDF() {
                              const { jsPDF } = window.jspdf;
                              const invoice = document.getElementById('invoice');
                              
                              window.html2canvas(invoice, {
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
                                
                                pdf.save('Payment-Invoice-${modalData?.patientName?.replace(/\s+/g, '-')}-${invoiceNumber}.pdf');
                                
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
                  }}
                >
                  <FileDown size={16} className="mr-2" />
                  Download PDF
                </Button>
              </div>
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          }
        >
          <div id="invoice-content" className="space-y-6">
            {/* Invoice Header */}
            <div className="text-center border-b pb-4 print:border-black print:border-b-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">DoctorCare Medical Center</h2>
              <p className="text-gray-600 dark:text-gray-400 print:text-black">123 Medical Center Dr., Healthville, CA 12345</p>
              <p className="text-gray-600 dark:text-gray-400 print:text-black">(555) 123-4567</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-6 print:text-black">
              <div>
                <h3 className="text-lg font-semibold mb-2 print:text-black">Bill To:</h3>
                <p className="font-medium print:text-black">{modalData?.patientName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 print:text-black">Patient ID: {modalData?.patientId}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold mb-2 print:text-black">Invoice Details:</h3>
                <p className="print:text-black"><span className="font-medium">Invoice #:</span> INV-{modalData?.id || '2024-001'}</p>
                <p className="print:text-black"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                <p className="print:text-black"><span className="font-medium">Due Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Service Details */}
            <div>
              <h3 className="text-lg font-semibold mb-3 print:text-black">Payment Details:</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 print:bg-gray-100 print:border print:border-black">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="print:text-black"><span className="font-medium">Description:</span> {modalData?.description || 'Medical Service Payment'}</p>
                    <p className="print:text-black"><span className="font-medium">Date:</span> {modalData?.date}</p>
                  </div>
                  <div>
                    <p className="print:text-black"><span className="font-medium">Payment Method:</span> {modalData?.method}</p>
                    <p className="print:text-black"><span className="font-medium">Status:</span> {modalData?.paid ? 'Paid' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Table */}
            <div>
              <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 print:border-black">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 print:bg-gray-200">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left print:border-black print:text-black">Description</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right print:border-black print:text-black">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 print:border-black print:text-black">
                      {modalData?.description || 'Medical Service'} - {modalData?.date}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right print:border-black print:text-black">
                      {formatCurrency(modalData?.amount)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-800 font-semibold print:bg-gray-200">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 print:border-black print:text-black">Total</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right print:border-black print:text-black">
                      {formatCurrency(modalData?.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Status */}
            <div className={`border rounded-lg p-4 print:border-black ${
              modalData?.paid 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 print:bg-green-100' 
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 print:bg-orange-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full print:border print:border-black ${
                    modalData?.paid ? 'bg-green-500 print:bg-green-300' : 'bg-orange-500 print:bg-orange-300'
                  }`}></div>
                  <span className={`font-medium print:text-black ${
                    modalData?.paid 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-orange-800 dark:text-orange-300'
                  }`}>
                    {modalData?.paid ? 'Payment Processed' : 'Payment Pending'}
                  </span>
                </div>
                <span className={`text-sm print:text-black ${
                  modalData?.paid 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {modalData?.paid 
                    ? `Paid on ${modalData?.date ? new Date(modalData.date).toLocaleDateString() : new Date().toLocaleDateString()}`
                    : 'Not paid yet'
                  }
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="text-sm text-gray-600 dark:text-gray-400 border-t pt-4 print:text-black print:border-black">
              <p><span className="font-medium">Note:</span> Thank you for choosing DoctorCare Medical Center for your healthcare needs.</p>
              <p className="mt-2"><span className="font-medium">Payment Terms:</span> Payment is due upon receipt of this invoice.</p>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Add other modals as needed */}
      {isOpen && modalType === 'addPatient' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal} 
          title="Add New Patient"
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={addPatientLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddPatientSubmit} disabled={addPatientLoading}>
                {addPatientLoading ? 'Adding...' : 'Add Patient'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addPatientFormData.name}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter patient's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={addPatientFormData.email}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={addPatientFormData.phone}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={addPatientFormData.dob}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, dob: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gender *</label>
                <select
                  value={addPatientFormData.gender}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Blood Type</label>
                <select
                  value={addPatientFormData.bloodType}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <input
                type="text"
                value={addPatientFormData.address}
                onChange={(e) => setAddPatientFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                placeholder="Enter street address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={addPatientFormData.city}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input
                  type="text"
                  value={addPatientFormData.state}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="State"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                <input
                  type="text"
                  value={addPatientFormData.zipCode}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="ZIP Code"
                  required
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                <input
                  type="text"
                  value={addPatientFormData.emergencyContactName}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Emergency contact name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  value={addPatientFormData.emergencyContactPhone}
                  onChange={(e) => setAddPatientFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Emergency contact phone"
                  required
                />
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <label className="block text-sm font-medium mb-1">Allergies</label>
              <textarea
                value={addPatientFormData.allergies}
                onChange={(e) => setAddPatientFormData(prev => ({ ...prev, allergies: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={2}
                placeholder="List any known allergies (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Medical History</label>
              <textarea
                value={addPatientFormData.medicalHistory}
                onChange={(e) => setAddPatientFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={3}
                placeholder="Brief medical history and current conditions"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Add Medication Modal */}
      {isOpen && modalType === 'addMedication' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title={modalData && modalData._id ? "Edit Medication" : "Add New Medication"}
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={addMedicationLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddMedicationSubmit} disabled={addMedicationLoading}>
                {addMedicationLoading ? (modalData && modalData._id ? 'Updating...' : 'Adding...') : (modalData && modalData._id ? 'Update Medication' : 'Add Medication')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medication Name *
                </label>
                <Input 
                  type="text"
                  placeholder="Enter brand name"
                  name="name"
                  value={addMedicationFormData.name}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Generic Name *
                </label>
                <Input 
                  type="text"
                  placeholder="Enter generic name"
                  name="genericName"
                  value={addMedicationFormData.genericName}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, genericName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Strength *
                </label>
                <Input 
                  type="text"
                  placeholder="e.g., 500mg, 10mg/ml"
                  name="strength"
                  value={addMedicationFormData.strength}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, strength: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Formulation *
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  name="formulation"
                  value={addMedicationFormData.formulation}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, formulation: e.target.value }))}
                  required
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Injection">Injection</option>
                  <option value="Topical">Topical</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manufacturer *
                </label>
                <Input 
                  type="text"
                  placeholder="Enter manufacturer"
                  name="manufacturer"
                  value={addMedicationFormData.manufacturer}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <Input 
                  type="text"
                  placeholder="e.g. Antibiotic, Painkiller"
                  name="category"
                  value={addMedicationFormData.category}
                  onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                placeholder="Brief description of the medication"
                name="description"
                value={addMedicationFormData.description}
                onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, description: e.target.value }))}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Side Effects (comma separated)
              </label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                placeholder="e.g. Nausea, Drowsiness, Dizziness"
                name="sideEffects"
                value={addMedicationFormData.sideEffects}
                onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, sideEffects: e.target.value }))}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraindications (comma separated)
              </label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                placeholder="e.g. Pregnancy, Liver disease, Other medications"
                name="contraindications"
                value={addMedicationFormData.contraindications}
                onChange={(e) => setAddMedicationFormData(prev => ({ ...prev, contraindications: e.target.value }))}
              ></textarea>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Patient Modal */}
      {isOpen && modalType === 'editPatient' && (
        <Modal 
          key={`edit-patient-${modalData?._id || 'new'}`}
          isOpen={isOpen} 
          onClose={closeModal}
          title={`Edit Patient - ${modalData?.name || 'Unknown'}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={editPatientLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEditPatientSubmit} disabled={editPatientLoading}>
                {editPatientLoading ? 'Updating...' : 'Update Patient'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <Input 
                  type="text"
                  placeholder="Enter patient's full name"
                  value={editPatientFormData.name}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <Input 
                  type="email"
                  placeholder="Enter email address"
                  value={editPatientFormData.email}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <Input 
                  type="tel"
                  placeholder="Enter phone number"
                  value={editPatientFormData.phone}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <input 
                  type="date"
                  value={editPatientFormData.dob || ''}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, dob: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender *
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={editPatientFormData.gender || ''}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blood Type
                </label>
                <select 
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={editPatientFormData.bloodType || ''}
                  onChange={(e) => setEditPatientFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <Input 
                type="text"
                placeholder="Enter street address"
                value={editPatientFormData.address}
                onChange={(e) => setEditPatientFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medical History
              </label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={3}
                placeholder="Brief medical history and current conditions (comma separated)"
                value={editPatientFormData.medicalHistory}
                onChange={(e) => setEditPatientFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Allergies
              </label>
              <textarea 
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                rows={2}
                placeholder="List any known allergies (comma separated)"
                value={editPatientFormData.allergies}
                onChange={(e) => setEditPatientFormData(prev => ({ ...prev, allergies: e.target.value }))}
              ></textarea>
            </div>
          </div>
        </Modal>
      )}

      {/* Medical Records Modal */}
      {isOpen && modalType === 'viewMedicalRecords' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title={`Medical Records - ${modalData?.name || 'Unknown'}`}
          size="xl"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                toast('Add new record functionality coming soon');
              }}>
                <PlusCircle size={16} className="mr-2" />
                Add Record
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
                {modalData?.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{modalData?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Patient ID: {modalData?.patientId || modalData?._id}</div>
              </div>
            </div>
            
            {/* Medical History Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Medical History</h3>
                <div className="space-y-3">
                  {modalData?.medicalHistory && modalData.medicalHistory.length > 0 ? (
                    Array.isArray(modalData.medicalHistory) ? 
                      modalData.medicalHistory.map((condition: string, index: number) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-white">{condition}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Chronic condition</div>
                        </div>
                      )) : (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-white">{modalData.medicalHistory}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Medical history</div>
                        </div>
                      )
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 italic">No medical history recorded</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Allergies</h3>
                <div className="space-y-3">
                  {modalData?.allergies && modalData.allergies.length > 0 ? (
                    Array.isArray(modalData.allergies) ? 
                      modalData.allergies.map((allergy: string, index: number) => (
                        <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-900 dark:text-red-200">{allergy}</div>
                          <div className="text-sm text-red-600 dark:text-red-400">Known allergy</div>
                        </div>
                      )) : (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="font-medium text-red-900 dark:text-red-200">{modalData.allergies}</div>
                          <div className="text-sm text-red-600 dark:text-red-400">Known allergy</div>
                        </div>
                      )
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 italic">No known allergies</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recent Records */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Medical Records</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Annual Physical Exam</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">General checkup and routine tests</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Dr. Smith • {new Date().toLocaleDateString()}</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Blood Work Results</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Complete metabolic panel and CBC</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lab Services • {new Date(Date.now() - 86400000).toLocaleDateString()}</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileCheck2 size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">This is a demo view. Full medical records system coming soon.</div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Lab Results Modal */}
      {isOpen && modalType === 'viewLabResults' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title={`Lab Results - ${modalData?.name || 'Unknown'}`}
          size="xl"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button variant="primary" onClick={() => {
                toast('Order new lab functionality coming soon');
              }}>
                <FlaskConical size={16} className="mr-2" />
                Order Lab
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
                {modalData?.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{modalData?.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Patient ID: {modalData?.patientId || modalData?._id}</div>
              </div>
            </div>
            
            {/* Lab Results Table */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Lab Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Test</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Result</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Reference Range</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Complete Blood Count</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Normal</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Within normal limits</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date().toLocaleDateString()}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Basic Metabolic Panel</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Normal</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Within normal limits</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date().toLocaleDateString()}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Lipid Panel</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Cholesterol: 195 mg/dL</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">&lt; 200 mg/dL</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date(Date.now() - 86400000).toLocaleDateString()}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">Hemoglobin A1C</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">5.8%</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">&lt; 5.7%</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date(Date.now() - 172800000).toLocaleDateString()}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Borderline</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">This is a demo view. Full lab results system coming soon.</div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Lab Modal */}
      {isOpen && modalType === 'orderLab' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title="Order Lab Test"
          footer={
            <>
              <Button variant="outline" onClick={closeModal} disabled={labLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleLabSubmit} disabled={labLoading}>
                {labLoading ? 'Ordering...' : 'Order Lab Test'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Patient *</label>
              <div className="relative">
                <input
                  type="text"
                  value={labPatientSearchQuery}
                  onChange={handleLabPatientSearch}
                  onFocus={() => setLabShowPatientDropdown(true)}
                  placeholder="Search patients..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {labShowPatientDropdown && labFilteredPatients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {labFilteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => selectLabPatient(patient)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{patient.patientId} • {patient.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Test Name *</label>
              <input
                type="text"
                value={labFormData.testName}
                onChange={(e) => setLabFormData(prev => ({ ...prev, testName: e.target.value }))}
                placeholder="Enter test name (e.g., Complete Blood Count, Lipid Panel)"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={labFormData.category}
                onChange={(e) => setLabFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">Select category</option>
                <option value="Hematology">Hematology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Immunology">Immunology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium mb-1">Urgency</label>
              <select
                value={labFormData.urgency}
                onChange={(e) => setLabFormData(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={labFormData.notes}
                onChange={(e) => setLabFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or instructions..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Add Lab Results Modal */}
      {isOpen && (modalType === 'addLabResults' || modalType === 'editLabResults') && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title={modalType === 'editLabResults' ? 'Edit Lab Results' : 'Add Lab Results'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={closeModal} disabled={labLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleLabResultsSubmit} disabled={labLoading}>
                {labLoading ? 'Saving...' : 'Save Results'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Patient *</label>
              <div className="relative">
                <input
                  type="text"
                  value={labPatientSearchQuery}
                  onChange={handleLabPatientSearch}
                  onFocus={() => setLabShowPatientDropdown(true)}
                  placeholder="Search patients..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  required
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {labShowPatientDropdown && labFilteredPatients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-700 dark:border-gray-600">
                    {labFilteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        onClick={() => selectLabPatient(patient)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{patient.patientId} • {patient.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Test Name *</label>
              <input
                type="text"
                value={labFormData.testName}
                onChange={(e) => setLabFormData(prev => ({ ...prev, testName: e.target.value }))}
                placeholder="Enter test name"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                required
              />
            </div>

            {/* Test Results */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Test Results *</label>
                <Button variant="outline" size="sm" onClick={addLabResultField}>
                  <Plus size={16} className="mr-1" />
                  Add Field
                </Button>
              </div>
              
              <div className="space-y-3">
                {labResultFields.map((field, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateLabResultField(index, 'name', e.target.value)}
                        placeholder="Test name"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateLabResultField(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={field.unit}
                        onChange={(e) => updateLabResultField(index, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={field.referenceRange}
                        onChange={(e) => updateLabResultField(index, 'referenceRange', e.target.value)}
                        placeholder="Reference"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={field.flag}
                        onChange={(e) => updateLabResultField(index, 'flag', e.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      {labResultFields.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeLabResultField(index)}>
                          <X size={16} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium mb-1">Summary</label>
              <textarea
                value={labResultSummary}
                onChange={(e) => setLabResultSummary(e.target.value)}
                placeholder="Overall summary of results..."
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* View Lab Details Modal */}
      {isOpen && modalType === 'viewLabDetails' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title="Lab Test Details"
          size="lg"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              {modalData?.status === 'Pending' && (
                <Button variant="primary" onClick={() => {
                  setModalType('addLabResults');
                  setLabFormData({
                    patient: modalData.patient._id,
                    testName: modalData.testName,
                    category: modalData.category,
                    urgency: modalData.urgency,
                    notes: modalData.notes
                  });
                  setLabSelectedPatient(modalData.patient);
                  setLabPatientSearchQuery(`${modalData.patient.name} (${modalData.patient.patientId})`);
                }}>
                  <FileCheck2 size={16} className="mr-2" />
                  Add Results
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            {/* Patient Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium dark:bg-primary-900 dark:text-primary-300">
                  {modalData?.patient?.name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{modalData?.patient?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Patient ID: {modalData?.patient?.patientId}</div>
                </div>
              </div>
            </div>

            {/* Test Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Test Name</label>
                <div className="text-gray-900 dark:text-white">{modalData?.testName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <div className="text-gray-900 dark:text-white">{modalData?.category || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Urgency</label>
                <div className="text-gray-900 dark:text-white">{modalData?.urgency}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                <Badge variant={modalData?.status === 'Completed' ? 'success' : modalData?.status === 'Pending' ? 'warning' : 'default'}>
                  {modalData?.status}
                </Badge>
              </div>
            </div>

            {/* Notes */}
            {modalData?.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {modalData.notes}
                </div>
              </div>
            )}

            {/* Results */}
            {modalData?.results && modalData.results.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Results</label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Test</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Value</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Unit</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Reference</th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.results.map((result: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">{result.name}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">{result.value}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">{result.unit}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">{result.referenceRange}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm">
                            <Badge variant={result.flag === 'Normal' ? 'success' : result.flag === 'Critical' ? 'danger' : 'warning'}>
                              {result.flag}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary */}
            {modalData?.summary && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Summary</label>
                <div className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {modalData.summary}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Billing Portal Modal */}
      {isOpen && modalType === 'billingPortal' && (
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal}
          title="Billing Portal"
          size="xl"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Current Subscription */}
            {modalData?.currentSubscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                      <p className="font-medium">{modalData.currentSubscription.plan?.name || 'Unknown Plan'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${modalData.currentSubscription.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : modalData.currentSubscription.status === 'trialing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}
                      >
                        {modalData.currentSubscription.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                      <p className="font-medium">${modalData.currentSubscription.amount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Billing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {modalData?.billingHistory && modalData.billingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {modalData.billingHistory.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {invoice.plan} - {invoice.billingCycle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              ${invoice.amount}
                            </p>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400 capitalize">
                                {invoice.status}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              if (invoice.downloadUrl && invoice.downloadUrl !== '#') {
                                window.open(invoice.downloadUrl, '_blank');
                              } else {
                                toast('Invoice download will be available with Stripe integration');
                              }
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No billing history available</p>
                    <p className="text-sm">Your billing history will appear here once you have transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            {modalData?.paymentMethods && modalData.paymentMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modalData.paymentMethods.map((method: any) => (
                      <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {method.brand?.toUpperCase()} • Expires {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        {method.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Modal>
      )}
    </ModalContext.Provider>
  );
} 