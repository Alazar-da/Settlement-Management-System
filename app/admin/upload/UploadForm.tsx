'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiCheckCircle } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const uploadSchema = z.object({
  systemType: z.enum(['Alpha', 'Kiron2']),
  commissionPercent: z.number().min(0).max(100),
  systemPaymentPercent: z.number().min(0).max(100),
  settlementWeek: z.date(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadForm({ onUploadComplete }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      systemType: 'Alpha',
      commissionPercent: 30,
      systemPaymentPercent: 50,
    },
  });

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
        setFile(null);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* System Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Type
          </label>
          <select
            {...register('systemType')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="Alpha">Alpha</option>
            <option value="Kiron2">Kiron 2</option>
          </select>
        </div>

        {/* Commission Percent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Commission Percent (%)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('commissionPercent', { valueAsNumber: true })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {errors.commissionPercent && (
            <p className="mt-1 text-sm text-red-600">{errors.commissionPercent.message}</p>
          )}
        </div>

        {/* System Payment Percent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Payment Percent (%)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('systemPaymentPercent', { valueAsNumber: true })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {errors.systemPaymentPercent && (
            <p className="mt-1 text-sm text-red-600">{errors.systemPaymentPercent.message}</p>
          )}
        </div>

        {/* Settlement Week */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Settlement Week
          </label>
          <DatePicker
            selected={watch('settlementWeek')}
            onChange={(date:any) => setValue('settlementWeek', date!)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Excel File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 ${file ? 'border-green-500' : ''}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FiCheckCircle className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{file.name}</p>
                  </>
                ) : (
                  <>
                    <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Excel files only</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            'Upload Settlement'
          )}
        </button>
      </form>
    </div>
  );
}