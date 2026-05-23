'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiFileText,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiDownload,
  FiPrinter,
} from 'react-icons/fi';
import { format } from 'date-fns';
import { getPaymentHistory, deletePayment } from '@/actions/paymentActions';
import toast from 'react-hot-toast';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementId: string;
}

interface Payment {
  _id: string;
  amount: number;
  paymentDate: string;
  note: string;
  createdBy: {
    userName: string;
  };
  createdAt: string;
}

interface SettlementInfo {
  id: string;
  agentName: string;
  systemType: string;
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: string;
}

export default function PaymentHistoryModal({ isOpen, onClose, settlementId }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlement, setSettlement] = useState<SettlementInfo | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && settlementId) {
      loadPaymentHistory();
    }
  }, [isOpen, settlementId]);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const data = await getPaymentHistory(settlementId);
      setPayments(data.payments || []);
      setSettlement(data.settlement);
      setSummary(data.summary);
      setMonthlyData(data.monthlyData || []);
    } catch (error) {
      console.error('Failed to load payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);
      toast.success('Payment deleted successfully');
      loadPaymentHistory();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'Fully Paid': {
        icon: FiCheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      },
      'Partially Paid': {
        icon: FiClock,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      },
      'Unpaid': {
        icon: FiAlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      },
    };
    return config[status as keyof typeof config] || config['Unpaid'];
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Amount', 'Note', 'Created By', 'Created At'];
    const rows = payments.map(p => [
      format(new Date(p.paymentDate), 'yyyy-MM-dd HH:mm:ss'),
      p.amount,
      p.note || '',
      p.createdBy?.userName || 'System',
      format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${settlementId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment History Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            .total { font-size: 18px; font-weight: bold; color: #28a745; }
          </style>
        </head>
        <body>
          <h1>Payment History Report</h1>
          <div class="summary">
            <p><strong>Agent:</strong> ${settlement?.agentName}</p>
            <p><strong>System:</strong> ${settlement?.systemType}</p>
            <p><strong>Total Due:</strong> ${formatCurrency(settlement?.totalDue || 0)}</p>
            <p><strong>Total Paid:</strong> ${formatCurrency(settlement?.totalPaid || 0)}</p>
            <p><strong>Remaining Balance:</strong> ${formatCurrency(settlement?.remainingBalance || 0)}</p>
            <p><strong>Status:</strong> ${settlement?.paymentStatus}</p>
          </div>
          <table>
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Note</th><th>Created By</th></tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${format(new Date(p.paymentDate), 'yyyy-MM-dd HH:mm:ss')}</td>
                  <td>${formatCurrency(p.amount)}</td>
                  <td>${p.note || '-'}</td>
                  <td>${p.createdBy?.userName || 'System'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total" style="margin-top: 20px;">
            Total Payments: ${formatCurrency(summary?.totalPaid || 0)}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const statusConfig = settlement ? getStatusBadge(settlement.paymentStatus) : null;
  const StatusIcon = statusConfig?.icon || FiAlertCircle;
  const progress = settlement ? (settlement.totalPaid / settlement.totalDue) * 100 : 0;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    Payment History
                  </Dialog.Title>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportToCSV}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Export to CSV"
                    >
                      <FiDownload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={printReport}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Print Report"
                    >
                      <FiPrinter className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading payment history...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Settlement Summary */}
                      {settlement && (
                        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold mb-1">{settlement.agentName}</h3>
                              <p className="text-primary-100 text-sm">{settlement.systemType}</p>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${statusConfig?.bgColor} bg-opacity-20`}>
                              <StatusIcon className={`w-4 h-4 ${statusConfig?.color}`} />
                              <span className={`text-sm font-medium ${statusConfig?.color}`}>
                                {settlement.paymentStatus}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm opacity-90 mb-1">Total Due</p>
                              <p className="text-2xl font-bold">{formatCurrency(settlement.totalDue)}</p>
                            </div>
                            <div>
                              <p className="text-sm opacity-90 mb-1">Total Paid</p>
                              <p className="text-2xl font-bold text-green-300">
                                {formatCurrency(settlement.totalPaid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm opacity-90 mb-1">Remaining</p>
                              <p className="text-2xl font-bold text-yellow-300">
                                {formatCurrency(settlement.remainingBalance)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Payment Progress</span>
                              <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div
                                className="bg-green-400 rounded-full h-2 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary Stats */}
                      {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {summary.paymentCount}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FiTrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(summary.totalPaid)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FiBarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(summary.averagePayment)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Average Payment</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <FiCalendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last Payment</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {summary.lastPaymentDate 
                                    ? format(new Date(summary.lastPaymentDate), 'MMM dd, yyyy')
                                    : 'No payments'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Monthly Payment Chart */}
                      {monthlyData.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Monthly Payment Trends
                          </h4>
                          <div className="space-y-2">
                            {monthlyData.map((item, index) => {
                              const maxAmount = Math.max(...monthlyData.map(d => d.amount));
                              const percentage = (item.amount / maxAmount) * 100;
                              return (
                                <div key={item.month}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {new Date(item.month + '-01').toLocaleDateString('default', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.5, delay: index * 0.1 }}
                                      className="bg-primary-500 rounded-full h-2"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Payments List */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Payment Transactions
                        </h4>
                        {payments.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-600 mb-4">
                              <FiDollarSign className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No payments recorded
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              No payment history found for this settlement.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <AnimatePresence>
                              {payments.map((payment, index) => (
                                <motion.div
                                  key={payment._id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, x: -100 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                        <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                            {formatCurrency(payment.amount)}
                                          </p>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => setShowDeleteConfirm(payment._id)}
                                              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                          <div className="flex items-center space-x-1">
                                            <FiCalendar className="w-3 h-3" />
                                            <span>{format(new Date(payment.paymentDate), 'PPP')}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <FiUser className="w-3 h-3" />
                                            <span>{payment.createdBy?.userName || 'System'}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <FiClock className="w-3 h-3" />
                                            <span>{format(new Date(payment.createdAt), 'p')}</span>
                                          </div>
                                        </div>
                                        {payment.note && (
                                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <div className="flex items-start space-x-2">
                                              <FiFileText className="w-4 h-4 text-gray-400 mt-0.5" />
                                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {payment.note}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Delete Confirmation */}
                                  {showDeleteConfirm === payment._id && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Are you sure you want to delete this payment?
                                      </p>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleDeletePayment(payment._id)}
                                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                                        >
                                          Yes, Delete
                                        </button>
                                        <button
                                          onClick={() => setShowDeleteConfirm(null)}
                                          className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}