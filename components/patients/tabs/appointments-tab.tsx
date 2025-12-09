import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, PencilIcon, Clock, User, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useModal } from '@/components/ui/modal-provider';
import toast from 'react-hot-toast';

interface AppointmentsTabProps {
  patient: any;
}

interface Appointment {
  _id: string;
  date: string;
  time: string;
  reason: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' | 'No-show';
  type: string;
  duration: string;
  notes?: string;
  alerts?: string[];
  doctor: string;
}

export function AppointmentsTab({ patient }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openModal } = useModal();

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        const response = await fetch(`/api/appointments?patient=${patient._id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        setAppointments(data.appointments);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [patient._id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error loading appointments: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Appointments</h3>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => openModal('newAppointment', { 
            patientId: patient._id,
            patientName: patient.name,
            returnToPatient: true
          })}
        >
          <Calendar size={16} />
          New Appointment
        </Button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="w-32">Date</div>
          <div className="flex-1">Details</div>
          <div className="w-24 text-right">Status</div>
          <div className="w-24 text-right">Actions</div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="mx-auto mb-2" size={24} />
            <p>No appointments found</p>
          </div>
        ) : (
          appointments.map((appointment) => (
          <div 
              key={appointment._id} 
            className={`flex items-center justify-between p-3 rounded-lg ${
                appointment.status === 'Pending' || appointment.status === 'Confirmed'
                ? 'bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-32 flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(appointment.date), 'MMM dd, yyyy')}
                </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Clock size={12} className="mr-1" /> {appointment.time}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{appointment.reason}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <User size={12} className="mr-1" /> {appointment.type} • {appointment.duration}
              </div>
              {appointment.notes && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                  {appointment.notes}
                </div>
              )}
            </div>
            
            <div className="w-24 text-right">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'Completed' 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' 
                      : appointment.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : appointment.status === 'No-show'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' 
                    : 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                }`}
              >
                {appointment.status}
              </span>
            </div>
            
            <div className="w-24 flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => {
                // View appointment details - you can implement this later
                console.log('View appointment details for:', appointment._id);
              }}>
                <FileText size={14} className="text-gray-400" />
              </Button>
                {(appointment.status === 'Pending' || appointment.status === 'Confirmed') && (
                <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        openModal('newAppointment', {
                          ...appointment,
                          patientId: patient._id,
                          patientName: patient.name,
                          isEditing: true,
                          editingAppointmentId: appointment._id,
                          returnToPatient: true
                        });
                      }}
                    >
                    <PencilIcon size={14} className="text-primary-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to cancel this appointment on ${format(new Date(appointment.date), 'MMM dd, yyyy')} at ${appointment.time}?`)) {
                        try {
                          const response = await fetch(`/api/appointments/${appointment._id}`, {
                            method: 'DELETE',
                          });
                          
                          if (response.ok) {
                            // Remove from local state
                            setAppointments(prev => prev.filter(apt => apt._id !== appointment._id));
                            toast.success('Appointment cancelled successfully');
                          } else {
                            throw new Error('Failed to cancel appointment');
                          }
                        } catch (error) {
                          console.error('Error cancelling appointment:', error);
                          toast.error('Failed to cancel appointment');
                        }
                      }
                    }}
                  >
                    <X size={14} className="text-danger-500" />
                  </Button>
                </>
              )}
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
} 