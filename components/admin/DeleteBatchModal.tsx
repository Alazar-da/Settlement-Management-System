'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function DeleteBatchModal({ batch, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);

      // Delete revenue settlements
      await supabase
        .from('revenue_settlements')
        .delete()
        .eq('batch_id', batch.id);

      // Delete the batch
      await supabase
        .from('upload_batches')
        .delete()
        .eq('id', batch.id);

      toast.success('Batch deleted successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete batch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
        >
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiAlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Delete Batch?
            </h2>

            {/* Message */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this batch?
            </p>

            {/* Batch Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">File:</span> {batch.uploaded_file_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-medium">Week:</span> {new Date(batch.settlement_week).toLocaleDateString()}
              </p>
            </div>

            {/* Warning */}
            <p className="text-xs text-center text-red-600 dark:text-red-400 mb-6">
              This action cannot be undone
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Close button top right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}