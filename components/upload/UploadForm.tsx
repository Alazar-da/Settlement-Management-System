'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import {
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiDatabase,
  FiPercent,
  FiCalendar,
  FiCpu,
} from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';

const uploadSchema = z.object({
  systemType: z.enum(['Alpha', 'Kiron2'] as const),
  commissionPercent: z.number()
    .min(0, 'Commission must be between 0 and 100')
    .max(100, 'Commission must be between 0 and 100'),
  systemPaymentPercent: z.number()
    .min(0, 'System payment must be between 0 and 100')
    .max(100, 'System payment must be between 0 and 100'),
  settlementWeek: z.date({
    message: 'Please select settlement week',
  }),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadFormProps {
  onUploadComplete: (data: any) => void;
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      systemType: 'Alpha',
      commissionPercent: 30,
      systemPaymentPercent: 50,
      settlementWeek: new Date(),
    },
  });

  const systemType = watch('systemType');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setFileError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        setFileError('Invalid file type. Please upload an Excel file');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setFileError(null);
      previewFile(selectedFile);
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

  const previewFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preview', 'true');
    formData.append('systemType', systemType);

    try {
      const response = await fetch('/api/upload/preview', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('systemType', data.systemType);
    formData.append('commissionPercent', data.commissionPercent.toString());
    formData.append('systemPaymentPercent', data.systemPaymentPercent.toString());
    formData.append('settlementWeek', data.settlementWeek.toISOString());

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('File uploaded successfully!');
        onUploadComplete(result.summary);
        reset();
        setFile(null);
        setPreviewData(null);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    setPreviewData(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Upload Settlement File</h2>
        <p className="text-primary-100 text-sm mt-1">
          Upload weekly settlement Excel files for Alpha or Kiron 2 systems
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* System Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiCpu className="inline w-4 h-4 mr-1" />
            System Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              systemType === 'Alpha'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}>
              <input
                type="radio"
                value="Alpha"
                {...register('systemType')}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-2xl mb-1">🎰</div>
                <div className="font-semibold text-gray-900 dark:text-white">Alpha</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Casino System</div>
              </div>
            </label>

            <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              systemType === 'Kiron2'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}>
              <input
                type="radio"
                value="Kiron2"
                {...register('systemType')}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-2xl mb-1">🎯</div>
                <div className="font-semibold text-gray-900 dark:text-white">Kiron 2</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Virtual Sports</div>
              </div>
            </label>
          </div>
          {errors.systemType && (
            <p className="mt-1 text-sm text-red-600">{errors.systemType.message}</p>
          )}
        </div>

        {/* Commission Percentages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiPercent className="inline w-4 h-4 mr-1" />
              Commission Percent (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('commissionPercent', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                %
              </div>
            </div>
            {errors.commissionPercent && (
              <p className="mt-1 text-sm text-red-600">{errors.commissionPercent.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiPercent className="inline w-4 h-4 mr-1" />
              System Payment Percent (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register('systemPaymentPercent', { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                %
              </div>
            </div>
            {errors.systemPaymentPercent && (
              <p className="mt-1 text-sm text-red-600">{errors.systemPaymentPercent.message}</p>
            )}
          </div>
        </div>

        {/* Settlement Week */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiCalendar className="inline w-4 h-4 mr-1" />
            Settlement Week
          </label>
          <Controller
            control={control}
            name="settlementWeek"
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date:any) => field.onChange(date)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select settlement week"
                showWeekNumbers
              />
            )}
          />
          {errors.settlementWeek && (
            <p className="mt-1 text-sm text-red-600">{errors.settlementWeek.message}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FiFile className="inline w-4 h-4 mr-1" />
            Excel File
          </label>
          
          {!file ? (
            <div
              {...getRootProps()}
              className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <input {...getInputProps()} />
              <FiUpload className={`w-10 h-10 mb-3 transition-colors ${
                isDragActive ? 'text-primary-500' : 'text-gray-400'
              }`} />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {isDragActive ? (
                  'Drop your Excel file here'
                ) : (
                  <>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
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
              className="relative bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FiFile className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Preview Data */}
              {previewData && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Preview Summary:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Agents Found:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {previewData.agentCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total GGR:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${previewData.totalGGR?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {fileError && (
            <div className="mt-2 flex items-center space-x-1 text-sm text-red-600">
              <FiAlertCircle className="w-4 h-4" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FiDatabase className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                What happens after upload?
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                <li>• Excel file will be parsed and validated</li>
                <li>• Data will be grouped by agent/shop</li>
                <li>• New agents will be created automatically</li>
                <li>• Settlements and calculations will be saved</li>
                <li>• You can track payments in reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Processing Upload...</span>
            </>
          ) : (
            <>
              <FiUpload className="w-5 h-5" />
              <span>Upload Settlement</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}