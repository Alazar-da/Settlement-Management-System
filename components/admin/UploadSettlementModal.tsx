'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiPercent,
  FiCpu,
  FiArrowRight,
  FiUsers,
  FiUserCheck,
  FiAlertTriangle,
  FiChevronRight,
  FiArrowLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface UploadSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UploadSettlementModal({ isOpen, onClose, onSuccess }: UploadSettlementModalProps) {
  const [file, setFile] = useState<File | null>(null);
/*   const [commission, setCommission] = useState(10); */
  const [systems, setSystems] = useState<any[]>([]);
  const [systemId, setSystemId] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [week, setWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<'upload' | 'cashier-review'>('upload');
  const [unassignedCashiers, setUnassignedCashiers] = useState<any[]>([]);
  const [validationSummary, setValidationSummary] = useState<{ total: number; unassigned: number; missing: number } | null>(null);

  async function fetchAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    if (!error && data) {
      setAgents(data);
    }
  }

  const updateCashierAgent = (cashierName: string, agentId: string) => {
    setUnassignedCashiers((prev) =>
      prev.map((cashier) =>
        cashier.cashier_name === cashierName
          ? { ...cashier, agent_id: agentId }
          : cashier
      )
    );
  };

  useEffect(() => {
    fetchSystems();
    fetchAgents();
  }, []);

  async function fetchSystems() {
    const response = await fetch('/api/systems');
    const data = await response.json();
    setSystems(data || []);
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const selectedFile = acceptedFiles[0];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      toast.error('Please upload an Excel file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      const result = await validateCashiers(selectedFile);
      
      const unassignedCount = result.unassigned?.length || 0;
      const missingCount = result.missing?.length || 0;
      const totalCashiers = (result.unassigned?.length || 0) + (result.missing?.length || 0) + (result.assigned?.length || 0);
      
      setValidationSummary({
        total: totalCashiers,
        unassigned: unassignedCount,
        missing: missingCount,
      });
      
      setUnassignedCashiers([...result.unassigned, ...result.missing]);
      setFile(selectedFile);

      if (unassignedCount > 0 || missingCount > 0) {
        setStep('cashier-review');
        toast.error(`${unassignedCount + missingCount} cashier(s) require agent assignment`);
      } else {
        setStep('upload');
        toast.success('All cashiers are assigned! You can upload now.');
      }
    } catch {
      toast.error('Failed to validate cashiers');
    }
  }, []);

  const validateCashiers = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const cashierNames = rows
      .slice(1)
      .map((row) => String(row[0] || '').trim())
      .filter(Boolean);

    const response = await fetch('/api/validate-cashiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashierNames }),
    });

    return await response.json();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!week) {
      toast.error('Please select settlement week');
      return;
    }

    if (!systemId) {
      toast.error('Please select a system');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
  /*     formData.append('commission', String(commission)); */
      formData.append('systemId', systemId);
      formData.append('week', week);

      const cashierAssignments = unassignedCashiers
        .filter((cashier) => cashier.agent_id)
        .map((cashier) => ({
          cashier_name: cashier.cashier_name,
          agent_id: cashier.agent_id,
        }));

      formData.append('cashierAssignments', JSON.stringify(cashierAssignments));

      const response = await fetch('/api/upload-settlement', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Upload failed');
      } else {
        toast.success('Settlement uploaded successfully!');
        onSuccess?.();
        onClose();
        // Reset form
        setFile(null);
        setWeek('');
        /* setCommission(10); */
        setSystemId('');
        setSelectedSystem(null);
        setUnassignedCashiers([]);
        setValidationSummary(null);
        setStep('upload');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setValidationSummary(null);
    setUnassignedCashiers([]);
    setStep('upload');
  };

  const goBackToUpload = () => {
    setStep('upload');
  };

  const goToCashierReview = () => {
    if (!file || !week || !systemId) {
      toast.error('Please complete all required fields first');
      return;
    }

    // No cashier assignment required, upload directly
    if (unassignedCashiers.length === 0) {
      handleUpload();
      return;
    }

    setStep('cashier-review');
  };

  const selectedCount = unassignedCashiers.filter((cashier) => cashier.agent_id).length;
  const assignedCount = unassignedCashiers.filter((c) => c.agent_id).length;
  const totalToAssign = unassignedCashiers.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {step === 'cashier-review' && (
                    <button
                      onClick={goBackToUpload}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Back to upload"
                    >
                      <FiArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {step === 'cashier-review' && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Step 1 Complete</span>
                          <FiChevronRight className="w-3 h-3 text-gray-400" />
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Step 2</span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {step === 'cashier-review' ? 'Cashier Assignment' : 'Upload Settlement'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {step === 'cashier-review' 
                        ? 'Assign agents to unassigned cashiers before uploading'
                        : 'Upload weekly settlement files for selected systems'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {step === 'upload' ? (
                  <>
                    {/* System Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FiCpu className="inline w-4 h-4 mr-1" />
                        System
                      </label>
                      <select
                        value={systemId}
                        onChange={(e) => {
                          const selected = systems.find((s) => s.id === e.target.value);
                          setSystemId(e.target.value);
                          setSelectedSystem(selected);
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select system</option>
                        {systems.map((system) => (
                          <option key={system.id} value={system.id}>
                            {system.name} ({system.system_payment_percentage}% payment)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Commission Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <FiCalendar className="inline w-4 h-4 mr-1" />
                          Settlement Week
                        </label>
                        <input
                          type="date"
                          value={week}
                          onChange={(e) => setWeek(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                    {/*   <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <FiPercent className="inline w-4 h-4 mr-1" />
                          Commission (%)
                        </label>
                        <input
                          type="number"
                          value={commission}
                          onChange={(e) => setCommission(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div> */}
                    </div>

                    {/* File Upload Area */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FiFileText className="inline w-4 h-4 mr-1" />
                        Excel File
                      </label>
                      
                      {!file ? (
                        <div
                          {...getRootProps()}
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                            isDragActive
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                          }`}
                        >
                          <input {...getInputProps()} />
                          <FiUpload className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                            isDragActive ? 'text-primary-500' : 'text-gray-400'
                          }`} />
                          <p className="text-gray-600 dark:text-gray-400">
                            {isDragActive ? (
                              'Drop your Excel file here'
                            ) : (
                              <>
                                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                                  Click to upload
                                </span>
                                {' or drag and drop'}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Excel files only (.xlsx, .xls) - Max 10MB
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <FiFileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={removeFile}
                              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>
                          {validationSummary && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Cashiers found:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{validationSummary.total}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                                <span className="font-semibold text-green-600">
                                  {validationSummary.total - validationSummary.unassigned - validationSummary.missing}
                                </span>
                              </div>
                              {(validationSummary.unassigned > 0 || validationSummary.missing > 0) && (
                                <div className="flex items-center justify-between text-sm mt-1">
                                  <span className="text-gray-600 dark:text-gray-400">Need assignment:</span>
                                  <span className="font-semibold text-orange-600">
                                    {validationSummary.unassigned + validationSummary.missing}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Cashier Review Step */
                  <div className="space-y-4">
                    {/* Warning Banner */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                            Cashier Assignment Required
                          </h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                            Please assign an agent to each cashier before proceeding with the upload.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all duration-300"
                        style={{ width: totalToAssign > 0 ? `${(assignedCount / totalToAssign) * 100}%` : '100%' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{assignedCount} of {totalToAssign} assigned</span>
                      <span>{totalToAssign > 0 ? ((assignedCount / totalToAssign) * 100).toFixed(0) : 0}% complete</span>
                    </div>

                    {/* Cashier List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <FiUsers className="w-4 h-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white">Cashiers to Assign</h3>
                      </div>
                      
                      {unassignedCashiers.map((cashier, idx) => (
                        <motion.div
                          key={cashier.cashier_name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`border rounded-lg p-4 transition-all ${
                            cashier.agent_id
                              ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                              : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-900/10'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {cashier.cashier_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {cashier.is_new ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    <FiUserCheck className="w-3 h-3" />
                                    New Cashier
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                    <FiAlertCircle className="w-3 h-3" />
                                    No Agent Assigned
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <select
                              value={cashier.agent_id || ''}
                              onChange={(e) => updateCashierAgent(cashier.cashier_name, e.target.value)}
                              className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                                cashier.agent_id
                                  ? 'border-green-300 dark:border-green-600 bg-white dark:bg-gray-700'
                                  : 'border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-700'
                              }`}
                            >
                              <option value="">Select Agent</option>
                              {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Cashiers:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{totalToAssign}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                        <span className="font-semibold text-green-600">{assignedCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                        <span className="font-semibold text-orange-600">{totalToAssign - assignedCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                
                {step === 'upload' ? (
                  <button
                    onClick={goToCashierReview}
                    disabled={loading || !file || !week || !systemId}
                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {unassignedCashiers.length === 0
                            ? 'Upload Settlement'
                            : 'Continue to Review'}
                        </span>
                        <FiArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={goBackToUpload}
                      className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={loading || selectedCount === 0}
                      className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Confirm & Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}