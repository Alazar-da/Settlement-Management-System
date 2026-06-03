'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar,
  FiCpu,
  FiFile,
  FiPercent,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import DeleteBatchModal from './DeleteBatchModal';
import EditBatchModal from './EditBatchModal';
import toast from 'react-hot-toast';
import { memo } from 'react';
import { assignWeekNumbers } from '@/utils/batchWeeks';
import { formatCurrency } from '@/utils/formatCurrency';

interface UploadedBatchTableProps {
  onView: (batch: any) => void;
  weekFrom: number | '';
  weekTo: number | '';
  systemFilter: string;
  refreshKey: number;
}

const ITEMS_PER_PAGE = 10;

function UploadedBatchTable({
  onView,
  weekFrom,
  weekTo,
  systemFilter,
  refreshKey,
}: UploadedBatchTableProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [deleteBatch, setDeleteBatch] = useState<any>(null);

  useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 768) {
      setViewMode('card');
    } else {
      setViewMode('table');
    }
  };

  // Initial check
  handleResize();

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener(
      'resize',
      handleResize
    );
  };
}, []);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchBatches();
  }, [systemFilter, weekFrom, weekTo, refreshKey, currentPage]);

  async function fetchBatches() {
    setLoading(true);

    try {
      let query = supabase
        .from('upload_batches')
        .select('*')
        .order('settlement_week', { ascending: true });

      if (systemFilter !== 'all') {
        query = query.eq('system_type', systemFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch batches');
        return;
      }

      // Create week numbers
      // =========================
// CREATE WEEK NUMBERS
// =========================

const processed = assignWeekNumbers(
  data || []
);

// =========================
// WEEK LOOKUP MAP
// =========================

const weekMap = new Map();

processed.forEach((item) => {
  const key = new Date(
    item.settlement_week
  )
    .toISOString()
    .split('T')[0];

  weekMap.set(
    key,
    item.week_number
  );
});

      // Filter week range
      let filtered = processed;

      if (weekFrom !== '') {
        filtered = filtered.filter((b) => b.week_number >= Number(weekFrom));
      }

      if (weekTo !== '') {
        filtered = filtered.filter((b) => b.week_number < Number(weekTo));
      }

      // Latest first
      filtered.reverse();

      // Set total count
      setTotalCount(filtered.length);

      // Paginate
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedBatches = filtered.slice(start, end);

      const finalData =
  paginatedBatches.map((batch) => {
    const key = new Date(
      batch.settlement_week
    )
      .toISOString()
      .split('T')[0];

    return {
      ...batch,
      week_number:
        weekMap.get(key),
    };
  });

setBatches(finalData);

      setBatches(paginatedBatches);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSystemColor = (system: string) => {
    return system === 'ALPHA'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Table View
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Week
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <FiCpu className="inline w-4 h-4 mr-1" />
              System
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <FiFile className="inline w-4 h-4 mr-1" />
              File Name
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <FiPercent className="inline w-4 h-4 mr-1" />
              Commission
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              <FiPercent className="inline w-4 h-4 mr-1" />
              System Payment
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Net Cash</th>
            <th className="text-left py-3 px-4 text-sm font-semibold">Expected Collection</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {batches.map((batch, index) => (
              <motion.tr
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  <div>
                    <p className="font-semibold">Week {batch.week_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(batch.settlement_week)}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getSystemColor(batch.system_type)}`}>
                    {batch.system_type}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {batch.uploaded_file_name}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {Number(batch.commission_percent).toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {Number(batch.system_payment_percent).toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Number(batch.total_net_cash || 0))}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-green-600">
                  {formatCurrency(Number(batch.total_expected_collection || 0))}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(batch)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-200"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditBatch(batch)}
                      className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-200"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteBatch(batch)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
       </table>
    </div>
  );

  // Card View
  const CardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence>
        {batches.map((batch, index) => (
          <motion.div
            key={batch.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 text-xs rounded-full ${getSystemColor(batch.system_type)}`}>
                    {batch.system_type}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID: {batch.id.slice(-8)}</span>
                </div>
                <button
                  onClick={() => setExpandedCard(expandedCard === batch.id ? null : batch.id)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {expandedCard === batch.id ? (
                    <FiChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiCalendar className="w-4 h-4" />
                    <span>Settlement Week</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Week {batch.week_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(batch.settlement_week)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commission</span>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {batch.commission_percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">System Payment</span>
                  <span className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">
                    {batch.system_payment_percent}%
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedCard === batch.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2"
                  >
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">File Name</p>
                      <p className="text-sm text-gray-900 dark:text-white break-all">{batch.uploaded_file_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Uploaded At</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(batch.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Net Cash</span>
                        <span className="font-semibold">{formatCurrency(Number(batch.total_net_cash || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Expected Collection</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(Number(batch.total_expected_collection || 0))}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <button
                  onClick={() => onView(batch)}
                  className="flex-1 mr-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <FiEye className="w-4 h-4" />
                  <span className="text-sm">View</span>
                </button>
                <button
                  onClick={() => setEditBatch(batch)}
                  className="flex-1 mr-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <FiEdit2 className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteBatch(batch)}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center space-x-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <div className="glass-card p-6">
        {/* Header */}
        <div className="flex flex-col items-end sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Uploaded Settlement Batches</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalCount} batch{totalCount !== 1 ? 'es' : ''} uploaded
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 w-fit">
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

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading batches...</p>
            </div>
          </div>
        ) : batches.length === 0 ? (
          /* Empty */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FiFile className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No batches found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or upload a new settlement batch.
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? <TableView /> : <CardView />}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  Showing {startItem} to {endItem} of {totalCount} batches
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    <FiChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
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
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    <FiChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editBatch && (
        <EditBatchModal
          batch={editBatch}
          onClose={() => setEditBatch(null)}
          onSuccess={() => {
            fetchBatches();
            setEditBatch(null);
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteBatch && (
        <DeleteBatchModal
          batch={deleteBatch}
          onClose={() => setDeleteBatch(null)}
          onSuccess={() => {
            fetchBatches();
            setDeleteBatch(null);
          }}
        />
      )}
    </>
  );
}

export default memo(UploadedBatchTable);