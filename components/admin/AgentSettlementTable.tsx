'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiDownload,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import PaymentModal from './PaymentModal';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    fetchData();
    fetchBatchInfo();
  }, [batchId]);

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
        .eq('batch_id', batchId);

      if (!error && settlements) {
        setData(settlements);
      } else {
        toast.error('Failed to load settlements');
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBatchInfo() {
    try {
      const { data: batch, error } = await supabase
        .from('upload_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (!error && batch) {
        setBatchInfo(batch);
      }
    } catch (error) {
      console.error('Error fetching batch info:', error);
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
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'PARTIALLY_PAID':
      case 'IN_PROGRESS':
        return {
          label: 'Partially Paid',
          icon: FiClock,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        };
      default:
        return {
          label: 'Unpaid',
          icon: FiAlertCircle,
          color: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
        };
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch = item.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && (item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID')) ||
      (filterStatus === 'partial' && (item.payment_status === 'PARTIALLY_PAID' || item.payment_status === 'IN_PROGRESS')) ||
      (filterStatus === 'unpaid' && (!item.payment_status || item.payment_status === 'UNPAID'));
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    totalGGR: filteredData.reduce((sum, item) => sum + (item.total_ggr || 0), 0),
    totalDue: filteredData.reduce((sum, item) => sum + (item.total_net_revenue_collect || 0), 0),
    totalPaid: filteredData.reduce((sum, item) => sum + (item.total_paid || 0), 0),
    totalRemaining: filteredData.reduce((sum, item) => sum + (item.remaining_balance || 0), 0),
  };

  // Table View
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Agent
            </th>
            <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              System
            </th>
            <th className="text-right py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              GGR
            </th>
            <th className="text-right py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Due
            </th>
            <th className="text-right py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Paid
            </th>
            <th className="text-right py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Remaining
            </th>
            <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Status
            </th>
            <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Action
            </th>
           </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {filteredData.map((item, index) => {
              const statusConfig = getStatusConfig(item.payment_status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.agent?.name || 'Unknown Agent'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.system_type === 'ALPHA'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {item.system_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-white">
                    ${(item.total_ggr || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-900 dark:text-white">
                    ${(item.total_net_revenue_collect || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-green-600 dark:text-green-400">
                    ${(item.total_paid || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-red-600 dark:text-red-400">
                    ${(item.remaining_balance || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                      <span className={`text-sm ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                     disabled={item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'}
                
                      onClick={() => setSelectedPaymentBatch(item)}
                      className={`px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors  ${item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Payment
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );

  // Card View (Mobile)
  const CardView = () => (
    <div className="grid grid-cols-1  md:grid-cols-2 gap-4">
      <AnimatePresence>
        {filteredData.map((item, index) => {
          const statusConfig = getStatusConfig(item.payment_status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedCard === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.agent?.name || 'Unknown Agent'}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        item.system_type === 'ALPHA'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {item.system_type}
                      </span>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className={`w-3 h-3 ${statusConfig.textColor}`} />
                        <span className={`text-xs ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isExpanded ? (
                      <FiChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">GGR</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${(item.total_ggr || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Due</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${(item.total_net_revenue_collect || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${(item.total_paid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      ${(item.remaining_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 rounded-full h-1.5 transition-all duration-500"
                      style={{ 
                        width: `${(item.total_paid / item.total_net_revenue_collect) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
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
                          <span className="text-gray-500 dark:text-gray-400">System Payment:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${(item.total_system_payment || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Settlement Date:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(item.settlement_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Button */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                  disabled={item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'}
                    onClick={() => setSelectedPaymentBatch(item)}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors ${item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FiDollarSign className="w-4 h-4" />
                    <span>Add Payment</span>
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
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settlements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
        <span>Back to Batches</span>
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Weekly Settlements
              </h2>
              {batchInfo && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Week: {new Date(batchInfo.settlement_week).toLocaleDateString()} • 
                  Commission: {batchInfo.commission_percent}% • 
                  System Payment: {batchInfo.system_payment_percent}%
                </p>
              )}
            </div>
            
            <div className="flex items-center flex-col sm:flex-row space-x-3 gap-3 sm:gap-0 w-full">
              {/* Search */}
              <div className="relative w-full">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className='flex gap-3 w-full justify-between sm:justify-end'>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>

              {/* View Toggle */}
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="Table View"
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                  title="Card View"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total GGR</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${totalStats.totalGGR.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Due</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                ${totalStats.totalDue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                ${totalStats.totalPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Remaining</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                ${totalStats.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Table or Card View */}
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FiFileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No settlements found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No settlements available for this batch'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'table' ? <TableView /> : <CardView />}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPaymentBatch && (
        <PaymentModal
          batch={selectedPaymentBatch}
          onClose={() => setSelectedPaymentBatch(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}