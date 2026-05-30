'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
} from 'react-icons/fi';

import { supabase } from '@/lib/supabase';
import PaymentModal from './PaymentModal';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

const ITEMS_PER_PAGE = 10;

export default function AgentSettlementTable({
  batchId,
  onBack,
}: {
  batchId: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentBatch, setSelectedPaymentBatch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [editingSettlement, setEditingSettlement] = useState<any>(null);
  const [commissionPercent, setCommissionPercent] = useState('');
  const [updatingCommission, setUpdatingCommission] = useState(false);
  
  // Modal states
  const [showSystemPaymentModal, setShowSystemPaymentModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedItemForReset, setSelectedItemForReset] = useState<any>(null);
  const [systemPaymentAmount, setSystemPaymentAmount] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
    fetchBatchInfo();
  }, [batchId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: settlements, error } = await supabase
        .from('revenue_settlements')
        .select(`
          *,
          agent:agent_id (
            id,
            name
          )
        `)
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (!error && settlements) {
        setData(settlements);
      } else {
        toast.error('Failed to load settlements');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatchInfo() {
    try {
      const { data: batch } = await supabase
        .from('upload_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batch) {
        setBatchInfo(batch);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleSystemPayment() {
    const totalSystemPayment = filteredData.reduce(
      (sum, item) => sum + Number(item.total_system_payment || 0),
      0
    );
    setSystemPaymentAmount(totalSystemPayment);
    setShowSystemPaymentModal(true);
  }

  async function confirmSystemPayment() {
    const { error } = await supabase
      .from('upload_batches')
      .update({
        system_payment_status: 'PAID',
        system_payment_date: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) {
      toast.error('Failed to update system payment');
      return;
    }

    toast.success('System payment completed');
    setShowSystemPaymentModal(false);
    fetchBatchInfo();
  }

  async function handleResetPayment(item: any) {
    setSelectedItemForReset(item);
    setShowResetModal(true);
  }

  async function confirmResetPayment() {
    if (!selectedItemForReset) return;

    try {
      const totalDue = Number(selectedItemForReset.total_net_revenue_collect || 0);

      const { error } = await supabase
        .from('revenue_settlements')
        .update({
          total_paid: 0,
          remaining_balance: totalDue,
          payment_status: 'UNPAID',
        })
        .eq('id', selectedItemForReset.id);

      if (error) {
        toast.error('Failed to reset payment');
        return;
      }

      toast.success('Payment reset successfully');
      setShowResetModal(false);
      setSelectedItemForReset(null);
      fetchData();
    } catch (error) {
      console.log(error);
      toast.error('Failed to reset payment');
    }
  }

  async function handleUpdateCommission() {
    if (!editingSettlement) return;

    try {
      setUpdatingCommission(true);
      const percent = Number(commissionPercent);

      if (isNaN(percent) || percent <= 0) {
        toast.error('Invalid commission percentage');
        return;
      }

      const totalNetCash = Number(editingSettlement.total_net_cash || 0);
      const totalRevenueCollect = (percent / 100) * totalNetCash;
      const remainingBalance = totalRevenueCollect - Number(editingSettlement.total_paid || 0);

      let paymentStatus = 'UNPAID';
      if (Number(editingSettlement.total_paid || 0) >= totalRevenueCollect) {
        paymentStatus = 'PAID';
      } else if (Number(editingSettlement.total_paid || 0) > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      }

      const { error } = await supabase
        .from('revenue_settlements')
        .update({
          total_net_revenue_collect: totalRevenueCollect,
          remaining_balance: remainingBalance,
          payment_status: paymentStatus,
        })
        .eq('id', editingSettlement.id);

      if (error) {
        toast.error('Failed to update commission');
        return;
      }

      toast.success('Commission updated');
      setEditingSettlement(null);
      fetchData();
    } catch (error) {
      console.log(error);
      toast.error('Failed to update commission');
    } finally {
      setUpdatingCommission(false);
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'FULLY_PAID':
      case 'PAID':
        return {
          label: 'Fully Paid',
          icon: FiCheckCircle,
          color: 'bg-green-500',
          textColor: 'text-green-600 dark:text-green-400',
        };
      case 'PARTIALLY_PAID':
      case 'IN_PROGRESS':
        return {
          label: 'Partial',
          icon: FiClock,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
        };
      default:
        return {
          label: 'Unpaid',
          icon: FiAlertCircle,
          color: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
        };
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch = item.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'paid' &&
        (item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID')) ||
      (filterStatus === 'partial' &&
        (item.payment_status === 'PARTIALLY_PAID' || item.payment_status === 'IN_PROGRESS')) ||
      (filterStatus === 'unpaid' && (!item.payment_status || item.payment_status === 'UNPAID'));

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setTotalCount(filteredData.length);
  }, [filteredData.length]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalStats = {
    totalNetCash: filteredData.reduce((sum, item) => sum + Number(item.total_net_cash || 0), 0),
    totalDue: filteredData.reduce((sum, item) => sum + Number(item.total_net_revenue_collect || 0), 0),
    totalPaid: filteredData.reduce((sum, item) => sum + Number(item.total_paid || 0), 0),
    totalRemaining: filteredData.reduce((sum, item) => sum + Number(item.remaining_balance || 0), 0),
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Table View (same as before, just update the reset button)
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-3 text-sm font-semibold">Agent</th>
            <th className="text-left py-3 px-3 text-sm font-semibold">System</th>
            <th className="text-right py-3 px-3 text-sm font-semibold">Net Cash</th>
            <th className="text-right py-3 px-3 text-sm font-semibold">Total</th>
            <th className="text-right py-3 px-3 text-sm font-semibold">Paid</th>
            <th className="text-right py-3 px-3 text-sm font-semibold">Remaining</th>
            <th className="text-left py-3 px-3 text-sm font-semibold">Status</th>
            <th className="text-center py-3 px-3 text-sm font-semibold">Actions</th>
           </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {paginatedData.map((item, index) => {
              const statusConfig = getStatusConfig(item.payment_status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.agent?.name || 'Unknown Agent'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {item.system_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">
                    {formatCurrency(item.total_net_cash)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {formatCurrency(item.total_net_revenue_collect)}
                  </td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(item.total_paid)}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(item.remaining_balance)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      <span className={`text-sm ${statusConfig.textColor}`}>{statusConfig.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        disabled={item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'}
                        onClick={() => setSelectedPaymentBatch(item)}
                        className={`p-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 transition-colors ${
                          item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title="Add Payment"
                      >
                        <FiDollarSign className="w-3 h-3" />
                      </button>
                      <button
                        disabled={item.payment_status === 'UNPAID'}
                        onClick={() => handleResetPayment(item)}
                        className={`p-1.5 rounded-lg text-white text-xs transition-colors ${
                          item.payment_status === 'UNPAID'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title="Reset Payment"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          const defaultPercent =
                            (Number(item.total_net_revenue_collect || 0) /
                              Number(item.total_net_cash || 1)) * 100;
                          setCommissionPercent(defaultPercent.toFixed(2));
                          setEditingSettlement(item);
                        }}
                        className="p-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
                        title="Edit Commission"
                      >
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );

  // Card View (similar updates)
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {paginatedData.map((item, index) => {
          const statusConfig = getStatusConfig(item.payment_status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedCard === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.agent?.name || 'Unknown Agent'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {item.system_type}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`w-3 h-3 ${statusConfig.textColor}`} />
                        <span className={`text-xs ${statusConfig.textColor}`}>{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setExpandedCard(isExpanded ? null : item.id)}>
                    {isExpanded ? (
                      <FiChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Net Cash</p>
                    <p className="font-semibold">{formatCurrency(item.total_net_cash)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-semibold">{formatCurrency(item.total_net_revenue_collect)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-semibold text-green-600">{formatCurrency(item.total_paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="font-semibold text-red-600">{formatCurrency(item.remaining_balance)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 rounded-full h-1.5"
                      style={{
                        width: `${(Number(item.total_paid) / (Number(item.total_net_revenue_collect) || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">System Payment</span>
                          <span>{formatCurrency(item.total_system_payment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Settlement Date</span>
                          <span>{new Date(item.settlement_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    disabled={item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'}
                    onClick={() => setSelectedPaymentBatch(item)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 ${
                      item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <FiDollarSign className="w-4 h-4" />
                    <span>Payment</span>
                  </button>
                  <button
                    disabled={item.payment_status === 'UNPAID'}
                    onClick={() => handleResetPayment(item)}
                    className={`px-3 py-2 rounded-lg text-white text-sm transition-colors ${
                      item.payment_status === 'UNPAID'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const defaultPercent =
                        (Number(item.total_net_revenue_collect || 0) /
                          Number(item.total_net_cash || 1)) * 100;
                      setCommissionPercent(defaultPercent.toFixed(2));
                      setEditingSettlement(item);
                    }}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        <span>Back to Batches</span>
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* HEADER - same as before */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Settlements</h2>
              {batchInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Week: {new Date(batchInfo.settlement_week).toLocaleDateString()} {' • '}
                  Commission: {Number(batchInfo.commission_percent).toFixed(2)}% {' • '}
                  System Payment: {Number(batchInfo.system_payment_percent).toFixed(2)}%
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>

              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-md ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* STATS SECTION */}
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">Net Cash</p>
                <p className="text-lg font-bold">{formatCurrency(totalStats.totalNetCash)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">Due</p>
                <p className="text-lg font-bold">{formatCurrency(totalStats.totalDue)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalStats.totalPaid)}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalStats.totalRemaining)}</p>
              </div>
            </div>

            <div className="flex items-center flex-col sm:flex-row gap-3 sm:justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${batchInfo?.system_payment_status === 'PAID' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${batchInfo?.system_payment_status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                  {batchInfo?.system_payment_status === 'PAID' ? 'System Paid' : 'System Unpaid'}
                </span>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">System Payment</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + Number(item.total_system_payment || 0), 0))}
                  </p>
                </div>
              </div>
              <button
                disabled={batchInfo?.system_payment_status === 'PAID'}
                onClick={handleSystemPayment}
                className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all ${
                  batchInfo?.system_payment_status === 'PAID'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {batchInfo?.system_payment_status === 'PAID' ? 'Paid' : 'Pay System'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FiFileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No settlements found</h3>
          </div>
        ) : (
          <>
            <div className="p-6">{viewMode === 'table' ? <TableView /> : <CardView />}</div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  Showing {startItem} to {endItem} of {totalCount} settlements
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const maxVisible = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-black dark:bg-primary-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <FiChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* System Payment Confirmation Modal */}
      <AnimatePresence>
        {showSystemPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <FiAlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  Confirm System Payment
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to mark this system payment as fully paid?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total System Payment:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(systemPaymentAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSystemPaymentModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSystemPayment}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Payment Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && selectedItemForReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FiTrash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
                  Reset Payment
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to reset this payment? This will set all payment records to zero.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Agent:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedItemForReset.agent?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedItemForReset.total_paid)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResetPayment}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      {selectedPaymentBatch && (
        <PaymentModal
          batch={selectedPaymentBatch}
          onClose={() => setSelectedPaymentBatch(null)}
          onSuccess={fetchData}
        />
      )}

      {/* EDIT COMMISSION MODAL */}
      <AnimatePresence>
        {editingSettlement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Commission</h2>
                <p className="mt-1 text-sm text-gray-500">{editingSettlement.agent?.name}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Commission Percentage
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commissionPercent}
                      onChange={(e) => setCommissionPercent(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter percentage"
                    />
                  </div>

                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Net Cash</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(editingSettlement.total_net_cash)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">Calculated Total</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(
                          (Number(commissionPercent || 0) / 100) * Number(editingSettlement.total_net_cash || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingSettlement(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={updatingCommission}
                    onClick={handleUpdateCommission}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updatingCommission ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}