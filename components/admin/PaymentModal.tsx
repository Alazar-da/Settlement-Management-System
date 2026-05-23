'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { set } from 'mongoose';

export default function PaymentModal({
  batch,
  onClose,
  onSuccess,
}: any) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setAmount((batch.remaining_balance).toFixed(2));
  }, [batch]);

  async function handleSave() {
    const { error } = await supabase
      .from('payments')
      .insert([
        {
            revenue_settlement_id:batch.id,
          amount: Number(amount),
          payment_date: paymentDate,
          note,
        },
      ]);

    if (!error) {
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">
          Add Payment
        </h2>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="date"
            value={paymentDate}
            onChange={(e) =>
              setPaymentDate(e.target.value)
            }
            className="w-full border p-3 rounded"
          />

          <textarea
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}