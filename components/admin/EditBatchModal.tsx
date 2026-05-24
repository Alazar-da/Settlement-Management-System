'use client';

import { useState } from 'react';
import { FiX, FiSave, FiPercent, FiCalendar } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function EditBatchModal({ batch, onClose, onSuccess }: any) {
  const [commission, setCommission] = useState(batch.commission_percent);
  const [systemPayment, setSystemPayment] = useState(batch.system_payment_percent);
  const [week, setWeek] = useState(batch.settlement_week);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (commission < 0 || commission > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }

    if (systemPayment < 0 || systemPayment > 100) {
      toast.error('System payment must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);

      // Update batch
      await supabase
        .from('upload_batches')
        .update({
          commission_percent: commission,
          system_payment_percent: systemPayment,
          settlement_week: week,
        })
        .eq('id', batch.id);

      // Get settlements
      const { data: settlements } = await supabase
        .from('revenue_settlements')
        .select('*')
        .eq('batch_id', batch.id);

      if (settlements) {
        for (const item of settlements) {
          const totalGGR = Number(item.total_ggr);
          const newNetRevenue = totalGGR * (commission / 100);
          const newSystemPayment = newNetRevenue * (systemPayment / 100);
          const remaining = newNetRevenue - Number(item.total_paid || 0);

          let status = 'UNPAID';
          if (item.total_paid > 0 && remaining > 0) {
            status = 'PARTIALLY_PAID';
          } else if (remaining <= 0) {
            status = 'FULLY_PAID';
          }

          await supabase
            .from('revenue_settlements')
            .update({
              total_net_revenue_collect: newNetRevenue,
              total_system_payment: newSystemPayment,
              remaining_balance: remaining,
              payment_status: status,
              settlement_date: week,
            })
            .eq('id', item.id);
        }
      }

      toast.success('Batch updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update batch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Batch
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {batch.uploaded_file_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiPercent className="inline w-4 h-4 mr-1" />
              Commission (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiPercent className="inline w-4 h-4 mr-1" />
              System Payment (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={systemPayment}
              onChange={(e) => setSystemPayment(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Settlement Week
            </label>
            <input
              type="date"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}