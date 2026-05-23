'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import UploadForm from '@/components/upload/UploadForm';
import ImportSummaryModal from '@/components/upload/ImportSummaryModal';
import { FiInfo } from 'react-icons/fi';

export default function UploadPage() {
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const handleUploadComplete = (data: any) => {
    setSummaryData(data);
    setShowSummary(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Upload Settlement
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload weekly settlement files for Alpha or Kiron 2 systems
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
      >
        <div className="flex items-start space-x-3">
          <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              File Format Requirements
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
              <li>• Excel files only (.xlsx, .xls)</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Alpha files require columns: Agent/Shop, Master Agent, GGR</li>
              <li>• Kiron 2 files require columns: Shop, Cashier, GGR</li>
              <li>• Data will be automatically grouped by agent</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Upload Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UploadForm onUploadComplete={handleUploadComplete} />
      </motion.div>

      {/* Import Summary Modal */}
      {showSummary && summaryData && (
        <ImportSummaryModal
          data={summaryData}
          onClose={() => {
            setShowSummary(false);
            setSummaryData(null);
          }}
        />
      )}
    </div>
  );
}