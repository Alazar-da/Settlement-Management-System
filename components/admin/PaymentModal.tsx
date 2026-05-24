'use client';

import { useEffect, useState } from 'react';
import { FiX, FiDollarSign, FiCalendar, FiSave } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function PaymentModal({ batch, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (batch?.remaining_balance) {
      setAmount(batch.remaining_balance.toFixed(2));
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, [batch]);

  async function handleSave() {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (Number(amount) > batch.remaining_balance) {
      toast.error('Amount exceeds remaining balance');
      return;
    }

    setLoading(true);

    try {
      await supabase.from('payments').insert([
        {
          revenue_settlement_id: batch.id,
          amount: Number(amount),
          payment_date: paymentDate,
        },
      ]);

      const newTotalPaid = batch.total_paid + Number(amount);
      const newRemaining = batch.total_net_revenue_collect - newTotalPaid;
      
      let newStatus = 'UNPAID';
      if (newTotalPaid >= batch.total_net_revenue_collect) {
        newStatus = 'FULLY_PAID';
      } else if (newTotalPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await supabase
        .from('revenue_settlements')
        .update({
          total_paid: newTotalPaid,
          remaining_balance: newRemaining,
          payment_status: newStatus,
        })
        .eq('id', batch.id);

      toast.success('Payment recorded');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700 bg-green-600 rounded-t-xl">
          <h2 className="text-lg font-bold text-white">Add Payment</h2>
          <button onClick={onClose} className="p-1 text-white hover:bg-white/10 rounded">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
            <p className="text-gray-600 dark:text-gray-400">Agent</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {batch.agent?.name || 'Unknown'}
            </p>
            <div className="flex justify-between mt-2 pt-2 border-t dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
              <span className="font-bold text-red-600">${batch.remaining_balance?.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="Enter amount"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 px-5 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !amount || Number(amount) <= 0}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="w-3 h-3" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}