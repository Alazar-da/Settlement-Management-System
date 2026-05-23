'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PaymentModal from './PaymentModal';

export default function AgentSettlementTable({
  batchId,
}: {
  batchId: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [selectedPaymentBatch, setSelectedPaymentBatch] =
  useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [batchId]);

  async function fetchData() {
    const { data, error } = await supabase
      .from('revenue_settlements')
      .select('*')
      .eq('batch_id', batchId);

    if (!error) {
      setData(data || []);
    }
  }

  console.log('Settlements for batch', data);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 overflow-auto">
      <h2 className="text-xl font-bold mb-5">
        Weekly Settlements
      </h2>

      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Agent</th>
            <th className="text-left p-3">System</th>
            <th className="text-left p-3">GGR</th>
            <th className="text-left p-3">Due</th>
            <th>Total Paid</th>
            <th>Remaining</th>
            <th>Status</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="p-3">
               {item.agent_id?.name || 'Unknown Agent'}
              </td>

              <td className="p-3">
                {item.system_type}
              </td>

              <td className="p-3">
                ${(item.total_ggr).toFixed(2)}
              </td>

              <td className="p-3">
                ${(item.total_net_revenue_collect).toFixed(2)}
              </td>

              <td className="p-3">
                ${item.total_paid.toFixed(2)}
              </td>

              <td className="p-3">
                ${(item.remaining_balance).toFixed(2)}
              </td>

             <td>
  <span
    className={`
      px-2 py-1 rounded text-white text-xs

      ${
        item.payment_status === 'PAID'
          ? 'bg-green-500'
          : item.payment_status === 'IN_PROGRESS'
          ? 'bg-yellow-500'
          : 'bg-red-500'
      }
    `}
  >
    {item.payment_status}
  </span>
</td>
              <td className="p-3">
                <button
  onClick={() => setSelectedPaymentBatch(item)}
  className="px-3 py-1 rounded bg-green-600 text-white"
>
  Payment
</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {
  selectedPaymentBatch && (
    <PaymentModal
      batch={selectedPaymentBatch}
      onClose={() => setSelectedPaymentBatch(null)}
      onSuccess={fetchData}
    />
  )
}
    </div>
  );
}