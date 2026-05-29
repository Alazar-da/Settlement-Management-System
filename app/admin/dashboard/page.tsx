'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiUpload, FiRefreshCw, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardStats from '@/components/admin/DashboardStats';
import AgentSettlementTable from '@/components/admin/AgentSettlementTable';
import UploadedBatchTable from '@/components/admin/UploadedBatchTable';
import UploadSettlementModal from '@/components/admin/UploadSettlementModal';
import { supabase } from '@/lib/supabase';
import { assignWeekNumbers } from '@/utils/batchWeeks';

export default function DashboardPage() {
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAgentSettlementModal, setShowAgentSettlementModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [weekFrom, setWeekFrom] = useState<number | ''>('');
  const [weekTo, setWeekTo] = useState<number | ''>('');
  const [systemFilter, setSystemFilter] = useState('all');
  const [systems, setSystems] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAgents: 0,
    totalUnpaid: 0,
  });

  useEffect(() => {
    fetchSystems();
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [weekFrom, weekTo, systemFilter, refreshKey]);

  async function fetchSystems() {
    const { data } = await supabase.from('systems').select('*').order('name');
    setSystems(data || []);
  }

  const round2 = (num: number) => Number(num.toFixed(2));

  async function fetchDashboardStats() {
    try {
      let batchQuery = supabase
        .from('upload_batches')
        .select('*')
        .order('settlement_week', { ascending: true });

      if (systemFilter !== 'all') {
        batchQuery = batchQuery.eq('system_type', systemFilter);
      }

      const { data: batches, error: batchError } = await batchQuery;
      if (batchError) return;

      const processed = assignWeekNumbers(batches || []);
      const filteredBatches = processed.filter((batch) => {
        if (weekFrom !== '' && batch.week_number < weekFrom) return false;
        if (weekTo !== '' && batch.week_number >= weekTo) return false;
        return true;
      });

      const batchIds = filteredBatches.map((batch) => batch.id);
      let settlementQuery = supabase.from('revenue_settlements').select('*');
      settlementQuery = batchIds.length > 0 ? settlementQuery.in('batch_id', batchIds) : settlementQuery.eq('batch_id', 'NO_BATCH');

      const { data: settlements, error } = await settlementQuery;
      if (error) return;

      const settlementData = settlements || [];
      const totalPaid = round2(settlementData.reduce((sum, item) => sum + Number(item.total_paid || 0), 0));
      const paidBatchIds = filteredBatches.filter((b) => b.system_payment_status === 'PAID').map((b) => b.id);
      const totalSystemPay = round2(settlementData.reduce((sum, item) => {
        if (paidBatchIds.includes(item.batch_id)) {
          return sum + Number(item.total_system_payment || 0);
        }
        return sum;
      }, 0));

      const totalRevenue = round2(totalPaid - totalSystemPay);
      const totalUnpaid = round2(settlementData.reduce((sum, item) => sum + Number(item.remaining_balance || 0), 0));
      const uniqueAgents = new Set(settlementData.map((item) => item.agent_id));

      setStats((prev) => {
        const next = { totalRevenue, totalAgents: uniqueAgents.size, totalUnpaid };
        if (prev.totalRevenue === next.totalRevenue && prev.totalAgents === next.totalAgents && prev.totalUnpaid === next.totalUnpaid) {
          return prev;
        }
        return next;
      });
    } catch (err) {
      console.log(err);
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleAgentSettlementModal = useCallback((batch: any) => {
    setSelectedBatch(batch);
    setShowAgentSettlementModal(true);
  }, []);

  const resetFilters = () => {
    setWeekFrom('');
    setWeekTo('');
    setSystemFilter('all');
  };

  const hasActiveFilters = weekFrom !== '' || weekTo !== '' || systemFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage settlements and track payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-primary-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-primary-700 transition-all text-sm font-medium"
          >
            <FiUpload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!showAgentSettlementModal && <DashboardStats stats={stats} />}

      {/* Main Content */}
      <div className="space-y-5">
        {!showAgentSettlementModal ? (
          <>
            {/* Filter Toggle Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-primary-500"></span>
                )}
                {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Week From</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="Week number"
                          value={weekFrom}
                          onChange={(e) => setWeekFrom(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Week To</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="Week number"
                          value={weekTo}
                          onChange={(e) => setWeekTo(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System</label>
                        <select
                          value={systemFilter}
                          onChange={(e) => setSystemFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-black dark:focus:ring-primary-500"
                        >
                          <option value="all">All Systems</option>
                          {systems.map((system) => (
                            <option key={system.id} value={system.name}>{system.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Uploaded Batches Table */}
            <UploadedBatchTable
              onView={handleAgentSettlementModal}
              weekFrom={weekFrom}
              weekTo={weekTo}
              systemFilter={systemFilter}
              refreshKey={refreshKey}
            />
          </>
        ) : (
          /* Agent Settlement Table (when batch selected) */
          <AgentSettlementTable
            batchId={selectedBatch.id}
            onBack={() => setShowAgentSettlementModal(false)}
          />
        )}
      </div>

      {/* Upload Modal */}
      <UploadSettlementModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}