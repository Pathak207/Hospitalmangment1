'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Users, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subscriberData: {
    name: string;
    email: string;
    usersCount?: number;
    patientsCount?: number;
    appointmentsCount?: number;
    subscriptionStatus?: string;
    planName?: string;
    isActive?: boolean;
  };
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subscriberData,
  isDeleting = false
}) => {
  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgeData, setAcknowledgeData] = useState(false);
  const [acknowledgeActive, setAcknowledgeActive] = useState(false);
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);

  const requiredConfirmationText = `DELETE ${subscriberData.name}`;
  const isConfirmationValid = confirmationText === requiredConfirmationText;
  const isStep2Valid = acknowledgeData && acknowledgeActive && acknowledgeIrreversible;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && isConfirmationValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setStep(1);
    setConfirmationText('');
    setAcknowledgeData(false);
    setAcknowledgeActive(false);
    setAcknowledgeIrreversible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Subscriber
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Step {step} of 3 - High Risk Action
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Impact Warning */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                  ⚠️ Critical Warning: You are about to delete an active subscriber
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  This action will permanently remove all data associated with this organization and cannot be undone.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                  Subscriber Information:
                </h5>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Organization:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscriberData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscriberData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${
                      subscriberData.isActive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {subscriberData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {subscriberData.planName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Plan:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscriberData.planName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Data that will be permanently deleted:
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      All user accounts ({subscriberData.usersCount || '?'} users)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      All patients and medical records ({subscriberData.patientsCount || '?'} patients)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      All appointments and history ({subscriberData.appointmentsCount || '?'} appointments)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      Subscription and billing information
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Acknowledgments */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  🔐 Please acknowledge the following:
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  You must check all boxes to proceed with deletion.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgeData}
                    onChange={(e) => setAcknowledgeData(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand that <strong>all patient data, medical records, appointments, and user accounts</strong> will be permanently deleted and cannot be recovered.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgeActive}
                    onChange={(e) => setAcknowledgeActive(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand that this subscriber {subscriberData.isActive ? 'is currently active' : 'may have active data'} and deleting them will immediately <strong>terminate their access</strong> to the system.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgeIrreversible}
                    onChange={(e) => setAcknowledgeIrreversible(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand that <strong>this action is irreversible</strong> and no backup or recovery option will be available after deletion.
                  </span>
                </label>
              </div>

              {subscriberData.subscriptionStatus === 'active' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Active Subscription Notice</span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    This subscriber has an active paid subscription. Deletion will cancel their subscription immediately.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                  🚨 Final Confirmation Required
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  To confirm deletion, type exactly: <code className="bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded font-mono text-xs">{requiredConfirmationText}</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmation Text:
                </label>
                <Input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type: ${requiredConfirmationText}`}
                  className={`font-mono ${
                    confirmationText && !isConfirmationValid 
                      ? 'border-red-300 focus:border-red-500' 
                      : confirmationText && isConfirmationValid 
                      ? 'border-green-300 focus:border-green-500'
                      : ''
                  }`}
                  disabled={isDeleting}
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Text does not match. Please type exactly as shown above.
                  </p>
                )}
                {isConfirmationValid && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Confirmation text matches.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Organization to be deleted:
                </h5>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{subscriberData.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{subscriberData.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                disabled={isDeleting}
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleConfirm}
              className={`${
                step === 3 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
              disabled={
                isDeleting || 
                (step === 2 && !isStep2Valid) || 
                (step === 3 && !isConfirmationValid)
              }
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Deleting...
                </>
              ) : step === 3 ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Forever
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 