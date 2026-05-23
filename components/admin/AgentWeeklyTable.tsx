'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiPlus,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Settlement {
  id: string;
  settlement_week: string;
  system_type: string;
  total_ggr: number;
  total_net_revenue_collect: number;
  total_paid: number;
  remaining_balance: number;
  payment_status: string;
  agents: {
    name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  note: string;
}

export default function AgentWeeklyTable() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedSettlement, setSelectedSettlement] = useState<string | null>(
    null
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('revenue_settlements')
      .select(
        `
        *,
        agents(name)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setSettlements(data || []);
    }

    setLoading(false);
  };

  const loadPayments = async (settlementId: string) => {
    setSelectedSettlement(settlementId);

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('revenue_settlement_id', settlementId)
      .order('payment_date', { ascending: false });

    if (!error) {
      setPayments(data || []);
    }
  };

  const addPayment = async () => {
    if (!selectedSettlement || !paymentAmount) return;

    const settlement = settlements.find(
      (s) => s.id === selectedSettlement
    );

    if (!settlement) return;

    const amount = Number(paymentAmount);

    const newTotalPaid = settlement.total_paid + amount;
    const remainingBalance =
      settlement.total_net_revenue_collect - newTotalPaid;

    let paymentStatus = 'PARTIAL';

    if (remainingBalance <= 0) {
      paymentStatus = 'PAID';
    } else if (newTotalPaid === 0) {
      paymentStatus = 'UNPAID';
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        revenue_settlement_id: selectedSettlement,
        amount,
        payment_date: new Date(),
        note: paymentNote,
      });

    if (paymentError) {
      toast.error(paymentError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('revenue_settlements')
      .update({
        total_paid: newTotalPaid,
        remaining_balance: remainingBalance,
        payment_status: paymentStatus,
      })
      .eq('id', selectedSettlement);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success('Payment added');

    setPaymentAmount('');
    setPaymentNote('');

    await loadSettlements();
    await loadPayments(selectedSettlement);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading settlements...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-4 text-left">Agent</th>
              <th className="p-4 text-left">Week</th>
              <th className="p-4 text-left">System</th>
              <th className="p-4 text-left">GGR</th>
              <th className="p-4 text-left">Due</th>
              <th className="p-4 text-left">Paid</th>
              <th className="p-4 text-left">Balance</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {settlements.map((settlement) => (
              <motion.tr
                key={settlement.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="p-4 font-semibold">
                  {settlement.agents?.name}
                </td>

                <td className="p-4">
                  {settlement.settlement_week}
                </td>

                <td className="p-4">
                  {settlement.system_type}
                </td>

                <td className="p-4">
                  ${settlement.total_ggr.toLocaleString()}
                </td>

                <td className="p-4 text-blue-600 font-semibold">
                  $
                  {settlement.total_net_revenue_collect.toLocaleString()}
                </td>

                <td className="p-4 text-green-600 font-semibold">
                  ${settlement.total_paid.toLocaleString()}
                </td>

                <td className="p-4 text-red-600 font-semibold">
                  $
                  {settlement.remaining_balance.toLocaleString()}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      settlement.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : settlement.payment_status === 'PARTIAL'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {settlement.payment_status}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => loadPayments(settlement.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 text-white"
                  >
                    <FiDollarSign />
                    Payments
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSettlement && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payment History */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiClock />
              <h3 className="text-xl font-bold">
                Payment History
              </h3>
            </div>

            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 rounded-xl border"
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">
                      ${payment.amount}
                    </p>

                    <p className="text-sm text-gray-500">
                      {new Date(
                        payment.payment_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {payment.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Add Payment */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiPlus />
              <h3 className="text-xl font-bold">
                Add Payment
              </h3>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                placeholder="Payment amount"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(e.target.value)
                }
                className="w-full border rounded-xl p-3 dark:bg-gray-800"
              />

              <textarea
                placeholder="Payment note"
                value={paymentNote}
                onChange={(e) =>
                  setPaymentNote(e.target.value)
                }
                className="w-full border rounded-xl p-3 dark:bg-gray-800"
              />

              <button
                onClick={addPayment}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}