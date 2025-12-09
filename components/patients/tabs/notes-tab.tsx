import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, User, Clock, Plus, PencilIcon, Loader2 } from 'lucide-react';
import { useModal } from '@/components/ui/modal-provider';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface NotesTabProps {
  patient: any;
}

export function NotesTab({ patient }: NotesTabProps) {
  const { openModal } = useModal();
  const [clinicalNotes, setClinicalNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Fetch clinical notes
  useEffect(() => {
    if (patient?._id) {
      fetchClinicalNotes();
    }
  }, [patient?._id]);

  const fetchClinicalNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes?patientId=${patient._id}`);
      if (response.ok) {
        const data = await response.json();
        setClinicalNotes(data.notes || []);
      } else {
        console.error('Failed to fetch clinical notes');
        toast.error('Failed to load clinical notes');
      }
    } catch (error) {
      console.error('Error fetching clinical notes:', error);
      toast.error('Failed to load clinical notes');
    } finally {
      setLoading(false);
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

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Handle adding new clinical note
  const handleAddNote = () => {
    openModal({
      title: 'Add Clinical Note',
      content: (
        <AddNoteForm 
          patient={patient} 
          onSuccess={fetchClinicalNotes}
          onCancel={() => {
            // Return to the patient details modal
            openModal('viewPatientDetails', {
              ...patient,
              returnToPatient: patient.returnToPatient || true
            });
          }}
        />
      )
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Clinical Notes</h3>
        <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={handleAddNote}>
          <Plus size={16} />
          Add Note
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {clinicalNotes.length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700 before:h-full">
                {clinicalNotes.map((note, idx) => (
                  <div key={note._id} className="relative pl-10">
                    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      {/* Note Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {note.title || note.type}
                              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full dark:bg-primary-900/20 dark:text-primary-400">
                                {idx === 0 ? 'Latest' : ''}
                              </span>
                            </h4>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(note.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatTime(note.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {note.author?.name || 'Provider'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setExpandedNoteId(expandedNoteId === note._id ? null : note._id)}
                        >
                          {expandedNoteId === note._id ? '−' : '+'}
                        </Button>
                      </div>
                      
                      {/* Note Content - Expandable */}
                      {expandedNoteId === note._id && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                          {note.content}
                          
                          {note.diagnosis && note.diagnosis.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diagnosis</h5>
                              <div className="flex flex-wrap gap-2">
                                {note.diagnosis.map((diagnosis: string, idx: number) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400"
                                  >
                                    {diagnosis}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {note.assessment && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assessment</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.assessment}</p>
                            </div>
                          )}
                          
                          {note.plan && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.plan}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Timeline Marker */}
                    <div className="absolute top-5 left-0 flex items-center justify-center h-10 w-10 rounded-full bg-white dark:bg-gray-800 border-2 border-primary-500 dark:border-primary-400">
                      <FileText size={16} className="text-primary-500 dark:text-primary-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No clinical notes found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click "Add Note" to create a clinical note</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Form for adding a clinical note
function AddNoteForm({ patient, onSuccess, onCancel }: { patient: any, onSuccess: () => void, onCancel: () => void }) {
  const { closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient: patient._id,
    type: 'Progress Note',
    title: '',
    content: '',
    diagnosis: '',
    assessment: '',
    plan: '',
    private: false,
    tags: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.content || !formData.type) {
        toast.error('Please fill in all required fields: Title, Type, and Content');
        return;
      }

      setLoading(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Saving clinical note...');

      // Prepare diagnosis and tags arrays
      const dataToSubmit = {
        ...formData,
        diagnosis: formData.diagnosis ? formData.diagnosis.split(',').map(item => item.trim()) : [],
        tags: formData.tags ? formData.tags.split(',').map(item => item.trim()) : []
      };

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Clinical note saved successfully!');
        onSuccess();
        closeModal();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add clinical note');
      }
    } catch (error) {
      console.error('Error adding clinical note:', error);
      toast.error(error.message || 'Failed to save clinical note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <Input 
            type="text" 
            name="title"
            placeholder="Enter note title" 
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Note Type *
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="Progress Note">Progress Note</option>
            <option value="Consultation">Consultation</option>
            <option value="Procedure Note">Procedure Note</option>
            <option value="Discharge Summary">Discharge Summary</option>
            <option value="History and Physical">History and Physical</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content *
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="content"
          placeholder="Enter detailed clinical notes"
          rows={8}
          value={formData.content}
          onChange={handleChange}
          required
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Diagnosis (comma-separated)
        </label>
        <Input 
          type="text" 
          name="diagnosis"
          placeholder="E.g., Hypertension, Type 2 Diabetes" 
          value={formData.diagnosis}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Assessment
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="assessment"
          placeholder="Enter clinical assessment"
          rows={3}
          value={formData.assessment}
          onChange={handleChange}
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Plan
        </label>
        <textarea 
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          name="plan"
          placeholder="Enter treatment plan"
          rows={3}
          value={formData.plan}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (comma-separated)
          </label>
          <Input 
            type="text" 
            name="tags"
            placeholder="E.g., follow-up, urgent" 
            value={formData.tags}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center mt-7">
          <input
            type="checkbox"
            id="private"
            name="private"
            checked={formData.private}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary-400"
          />
          <label htmlFor="private" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Private Note (only visible to you)
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Note'
          )}
        </Button>
      </div>
    </div>
  );
} 