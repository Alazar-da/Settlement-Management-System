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
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface UploadSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UploadSettlementModal({ isOpen, onClose, onSuccess }: UploadSettlementModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [commission, setCommission] = useState(10);
  const [systems, setSystems] = useState<any[]>([]);
const [systemId, setSystemId] = useState('');
const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [week, setWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
  fetchSystems();
}, []);

async function fetchSystems() {
  const response = await fetch('/api/systems');

  const data = await response.json();

  setSystems(data || []);
}

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
    }
  }, []);

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

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('commission', String(commission));
      formData.append('systemId', systemId);
      formData.append('week', week);

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
        setCommission(0);
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

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
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Upload Settlement
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upload weekly settlement files for selected systems
                  </p>
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
                {/* System Selection */}
             <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    <FiCpu className="inline w-4 h-4 mr-1" />
    System
  </label>

  <select
    value={systemId}
    onChange={(e) => {
      const selected = systems.find(
        (s) => s.id === e.target.value
      );

      setSystemId(e.target.value);
      setSelectedSystem(selected);
    }}
    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
  >
    <option value="">Select system</option>

    {systems.map((system) => (
      <option key={system.id} value={system.id}>
        {system.name}
      </option>
    ))}
  </select>
</div>

             

                {/* Commission Settings */}
                <div className="grid grid-cols-2 gap-4">
                     {/* Settlement Week */}
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
                  <div>
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
                  </div>
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
                    </motion.div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Important Information
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                        <li>• File will be parsed and grouped by agents</li>
                        <li>• Cashiers net chash will be stored</li>
                        <li>• Calculations will be based on commission percentages</li>
                        <li>• Duplicate uploads for same week are prevented</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preview Calculation */}
               {commission > 0 && selectedSystem && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Calculation Preview
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">For $100,000 Net Cash:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${(100000 * commission / 100).toLocaleString()} Collection
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">System Payment:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${(100000 * commission / 100 * selectedSystem.system_payment_percentage / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">Company Profit:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${(100000 * commission / 100 * (100 - selectedSystem.system_payment_percentage) / 100).toLocaleString()}
                        </span>
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
                <button
                  onClick={handleUpload}
                  disabled={loading || !file || !week}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload Settlement</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}