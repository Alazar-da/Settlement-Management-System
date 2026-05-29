'use client';

import { useState } from 'react';
import {
  FiX,
  FiSave,
  FiPercent,
  FiCalendar,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function EditBatchModal({
  batch,
  onClose,
  onSuccess,
}: any) {
  const [commission, setCommission] =
    useState(
      Number(batch.commission_percent || 0)
    );

  // THIS WILL ONLY UPDATE THIS BATCH
  const [systemPayment, setSystemPayment] =
    useState(
      Number(
        batch.system_payment_percent || 0
      )
    );

  const [week, setWeek] = useState(
    batch.settlement_week
  );

  const [loading, setLoading] =
    useState(false);

  // ROUND TO 2 DECIMALS
  const round2 = (num: number) =>
    Number(num.toFixed(2));

  async function handleSave() {
    if (
      commission < 0 ||
      commission > 100
    ) {
      toast.error(
        'Commission must be between 0 and 100'
      );
      return;
    }

    if (
      systemPayment < 0 ||
      systemPayment > 100
    ) {
      toast.error(
        'System payment must be between 0 and 100'
      );
      return;
    }

    try {
      setLoading(true);
// =========================
// CALCULATE NEW BATCH TOTALS
// =========================

const batchNetCash = Number(
  batch.total_net_cash || 0
);

const newExpectedCollection =
  round2(
    batchNetCash *
      (commission / 100)
  );

const newBatchSystemPayment =
  round2(
    newExpectedCollection *
      (systemPayment / 100)
  );

// =========================
// UPDATE BATCH
// =========================

const { error: batchError } =
  await supabase
    .from('upload_batches')
    .update({
      commission_percent:
        round2(commission),

      system_payment_percent:
        round2(systemPayment),

      settlement_week: week,

      total_expected_collection:
        newExpectedCollection,
    })
    .eq('id', batch.id);

if (batchError) {
  throw batchError;
}

      // =========================
      // GET SETTLEMENTS
      // =========================

      const { data: settlements, error } =
        await supabase
          .from('revenue_settlements')
          .select('*')
          .eq('batch_id', batch.id);

      if (error) {
        throw error;
      }

      // =========================
      // UPDATE EACH SETTLEMENT
      // =========================

      if (settlements?.length) {
        for (const item of settlements) {
          // SUPPORT BOTH total_ggr + total_net_cash
          const baseAmount = Number(
            item.total_net_cash ??
              item.total_ggr ??
              0
          );

          const totalPaid = Number(
            item.total_paid || 0
          );

          const newNetRevenue = round2(
            baseAmount *
              (commission / 100)
          );

          // USE EDITED VALUE
       const newSystemPayment =
  round2(
    newNetRevenue *
      (systemPayment / 100)
  );

          const remaining = round2(
            newNetRevenue - totalPaid
          );

          let status = 'UNPAID';

          if (
            totalPaid > 0 &&
            remaining > 0
          ) {
            status = 'PARTIALLY_PAID';
          } else if (remaining <= 0) {
            status = 'FULLY_PAID';
          }

          const { error: updateError } =
            await supabase
              .from(
                'revenue_settlements'
              )
              .update({
                total_net_revenue_collect:
                  newNetRevenue,

                total_system_payment:
                  newSystemPayment,

                remaining_balance:
                  remaining,

                payment_status: status,

                settlement_date: week,
              })
              .eq('id', item.id);

          if (updateError) {
            console.log(updateError);
          }
        }
      }

      toast.success(
        'Batch updated successfully'
      );

      onSuccess();

      onClose();
    } catch (err: any) {
      console.error(err);

      toast.error(
        err.message ||
          'Failed to update batch'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Batch
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">
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
          {/* COMMISSION */}
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
              onChange={(e) =>
                setCommission(
                  Number(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* SYSTEM PAYMENT */}
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
              onChange={(e) =>
                setSystemPayment(
                  Number(e.target.value)
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />

            <p className="text-xs text-gray-500 mt-1">
              This change only affects this
              batch.
            </p>
          </div>

          {/* WEEK */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Settlement Week
            </label>

            <input
              type="date"
              value={week}
              onChange={(e) =>
                setWeek(e.target.value)
              }
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