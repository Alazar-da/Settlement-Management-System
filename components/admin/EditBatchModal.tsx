'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditBatchModal({
  batch,
  onClose,
  onSuccess,
}: any) {
  const [commission, setCommission] =
    useState(batch.commission_percent);

  const [systemPayment, setSystemPayment] =
    useState(batch.system_payment_percent);

  const [week, setWeek] = useState(
    batch.settlement_week
  );

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    try {
      setLoading(true);

      // Update batch
      await supabase
        .from('upload_batches')
        .update({
          commission_percent: commission,
          system_payment_percent:
            systemPayment,
          settlement_week: week,
        })
        .eq('id', batch.id);

      // Get settlements
      const { data: settlements } =
        await supabase
          .from('revenue_settlements')
          .select('*')
          .eq('batch_id', batch.id);

      if (settlements) {
        for (const item of settlements) {
          const totalGGR =
            Number(item.total_ggr);

          const newNetRevenue =
            totalGGR * (commission / 100);

          const newSystemPayment =
            newNetRevenue *
            (systemPayment / 100);

          const remaining =
            newNetRevenue -
            Number(item.total_paid || 0);

          let status = 'UNPAID';

          if (
            item.total_paid > 0 &&
            remaining > 0
          ) {
            status = 'IN_PROGRESS';
          }

          if (remaining <= 0) {
            status = 'PAID';
          }

          await supabase
            .from('revenue_settlements')
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
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-5">
          Edit Batch
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm">
              Commission %
            </label>

            <input
              type="number"
              value={commission}
              onChange={(e) =>
                setCommission(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded p-3"
            />
          </div>

          <div>
            <label className="text-sm">
              System Payment %
            </label>

            <input
              type="number"
              value={systemPayment}
              onChange={(e) =>
                setSystemPayment(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded p-3"
            />
          </div>

          <div>
            <label className="text-sm">
              Settlement Week
            </label>

            <input
              type="date"
              value={week}
              onChange={(e) =>
                setWeek(e.target.value)
              }
              className="w-full border rounded p-3"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}