import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Activity, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Plus, ThermometerIcon, Loader2 } from 'lucide-react';
import { useModal } from '@/components/ui/modal-provider';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface VitalsTabProps {
  patient: any;
}

export function VitalsTab({ patient }: VitalsTabProps) {
  const { openModal } = useModal();
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch vitals data
  useEffect(() => {
    if (patient?._id) {
      fetchVitals();
    }
  }, [patient?._id]);

  const fetchVitals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vitals?patientId=${patient._id}`);
      if (response.ok) {
        const data = await response.json();
        setVitalsHistory(data.vitals || []);
      } else {
        console.error('Failed to fetch vitals');
        toast.error('Failed to load vitals data');
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
      toast.error('Failed to load vitals data');
    } finally {
      setLoading(false);
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up':
        return <ArrowUp size={12} className="text-danger-500" />;
      case 'down':
        return <ArrowDown size={12} className="text-success-500" />;
      default:
        return <span className="w-3 h-0.5 bg-gray-400 inline-block" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle adding new vitals
  const handleAddVitals = () => {
    openModal({
      title: 'Record Vitals',
      content: (
        <RecordVitalsForm 
          patient={patient} 
          onSuccess={fetchVitals} 
          onCancel={() => {
            // Return to the patient view modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
        />
      )
    });
  };

  // Get latest vitals
  const latestVitals = vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory[0] : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Patient Vitals</h3>
        <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={handleAddVitals}>
          <Plus size={16} />
          Add New Reading
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {latestVitals ? (
            <>
              {/* Latest Vitals Card */}
              <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-3">
                  Latest Vitals - {formatDate(latestVitals.recordedAt)}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Blood Pressure</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center">
                        <Heart className="text-danger-500 mr-1" size={16} />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Pulse Rate</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center">
                        <Activity className="text-primary-500 mr-1" size={16} />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.heartRate} bpm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{latestVitals.temperature}°F</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Oxygen Saturation</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {latestVitals.oxygenSaturation ? `${latestVitals.oxygenSaturation}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vitals History */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vitals History</h4>
                
                <div className="space-y-4">
                  {vitalsHistory.map((record, index) => (
                    <div 
                      key={record._id} 
                      className={`p-3 rounded-lg border ${
                        index === 0 
                          ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">{formatDate(record.recordedAt)}</h5>
                        <Button variant="ghost" size="sm" onClick={() => {
                          openModal({
                            title: 'Vitals Details',
                            content: (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                    <p className="font-medium">{formatDate(record.recordedAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Recorded By</p>
                                    <p className="font-medium">{record.recordedBy?.name || 'Staff'}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Blood Pressure</p>
                                    <p className="font-medium">{record.bloodPressure.systolic}/{record.bloodPressure.diastolic} mmHg</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Heart Rate</p>
                                    <p className="font-medium">{record.heartRate} bpm</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
                                    <p className="font-medium">{record.temperature}°F</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Oxygen Saturation</p>
                                    <p className="font-medium">{record.oxygenSaturation ? `${record.oxygenSaturation}%` : 'N/A'}</p>
                                  </div>
                                </div>
                                
                                {(record.height || record.weight || record.bmi) && (
                                  <div className="grid grid-cols-3 gap-4">
                                    {record.height && (
                                      <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                                        <p className="font-medium">{record.height} in</p>
                                      </div>
                                    )}
                                    {record.weight && (
                                      <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                                        <p className="font-medium">{record.weight} lbs</p>
                                      </div>
                                    )}
                                    {record.bmi && (
                                      <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">BMI</p>
                                        <p className="font-medium">{record.bmi}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {record.notes && (
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                                    <p className="font-medium">{record.notes}</p>
                                  </div>
                                )}
                              </div>
                            )
                          });
                        }}>Details</Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Heart size={14} className="text-danger-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            BP: {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Activity size={14} className="text-primary-500" />
                          <span className="text-gray-700 dark:text-gray-300">Pulse: {record.heartRate}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <ThermometerIcon size={14} className="text-amber-500" />
                          <span className="text-gray-700 dark:text-gray-300">Temp: {record.temperature}°F</span>
                        </div>
                        
                        {record.weight && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-700 dark:text-gray-300">Weight: {record.weight} lbs</span>
                          </div>
                        )}
                      </div>
                      
                      {record.notes && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                          {record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <Activity size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No vital sign records found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click "Add New Reading" to record patient vitals</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Form for recording vitals
function RecordVitalsForm({ patient, onSuccess, onCancel }: { patient: any, onSuccess: () => void, onCancel: () => void }) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient: patient._id,
    bloodPressure: {
      systolic: '',
      diastolic: ''
    },
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    height: '',
    weight: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested bloodPressure object
    if (name === 'systolic' || name === 'diastolic') {
      setFormData(prev => ({
        ...prev,
        bloodPressure: {
          ...prev.bloodPressure,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (
        !formData.bloodPressure.systolic || 
        !formData.bloodPressure.diastolic || 
        !formData.heartRate ||
        !formData.temperature
      ) {
        toast.error('Please fill in all required fields: Blood Pressure, Heart Rate, and Temperature');
        return;
      }

      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Recording vitals...');

      // Convert string fields to numbers
      const dataToSubmit = {
        ...formData,
        bloodPressure: {
          systolic: parseInt(formData.bloodPressure.systolic),
          diastolic: parseInt(formData.bloodPressure.diastolic)
        },
        heartRate: parseInt(formData.heartRate),
        temperature: parseFloat(formData.temperature),
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : undefined,
        oxygenSaturation: formData.oxygenSaturation ? parseInt(formData.oxygenSaturation) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined
      };

      const response = await fetch('/api/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Vitals recorded successfully!');
        onSuccess();
        closeModal();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record vitals');
      }
    } catch (error) {
      console.error('Error recording vitals:', error);
      toast.error(error.message || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Systolic Blood Pressure (mmHg) *
          </label>
          <Input 
            type="number" 
            name="systolic"
            placeholder="e.g., 120" 
            value={formData.bloodPressure.systolic}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Diastolic Blood Pressure (mmHg) *
          </label>
          <Input 
            type="number" 
            name="diastolic"
            placeholder="e.g., 80" 
            value={formData.bloodPressure.diastolic}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Heart Rate (bpm) *
          </label>
          <Input 
            type="number" 
            name="heartRate"
            placeholder="e.g., 70" 
            value={formData.heartRate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Temperature (°F) *
          </label>
          <Input 
            type="number" 
            name="temperature"
            placeholder="e.g., 98.6"
            step="0.1" 
            value={formData.temperature}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Respiratory Rate (breaths/min)
          </label>
          <Input 
            type="number" 
            name="respiratoryRate"
            placeholder="e.g., 16" 
            value={formData.respiratoryRate}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Oxygen Saturation (%)
          </label>
          <Input 
            type="number" 
            name="oxygenSaturation"
            placeholder="e.g., 98" 
            value={formData.oxygenSaturation}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Height (inches)
          </label>
          <Input 
            type="number" 
            name="height"
            placeholder="e.g., 68" 
            value={formData.height}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weight (lbs)
          </label>
          <Input 
            type="number" 
            name="weight"
            placeholder="e.g., 150" 
            value={formData.weight}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="notes"
          placeholder="Additional notes about the patient's vitals"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recording...
            </>
          ) : (
            'Save Vitals'
          )}
        </Button>
      </div>
    </div>
  );
} 