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
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import DeleteBatchModal from './DeleteBatchModal';
import EditBatchModal from './EditBatchModal';
import toast from 'react-hot-toast';

interface UploadedBatchTableProps {
  onView: (batch: any) => void;
  onRefresh?: () => void;
}

export default function UploadedBatchTable({ onView, onRefresh }: UploadedBatchTableProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editBatch, setEditBatch] = useState<any>(null);
  const [deleteBatch, setDeleteBatch] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemFilter, setSystemFilter] = useState<string>('all');

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    setLoading(true);
    try {
      let query = supabase
        .from('upload_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('uploaded_file_name', `%${searchTerm}%`);
      }

      if (systemFilter !== 'all') {
        query = query.eq('system_type', systemFilter);
      }

      const { data, error } = await query;

      if (!error) {
        setBatches(data || []);
      } else {
        toast.error('Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    await fetchBatches();
    onRefresh?.();
    toast.success('Batches refreshed');
  };

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

  const filteredBatches = batches.filter(batch => {
    if (searchTerm && !batch.uploaded_file_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (systemFilter !== 'all' && batch.system_type !== systemFilter) {
      return false;
    }
    return true;
  });

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
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {filteredBatches.map((batch, index) => (
              <motion.tr
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {formatDate(batch.settlement_week)}
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
                  {batch.commission_percent}%
                </td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {batch.system_payment_percent}%
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

  // Card View (Mobile)
  const CardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {filteredBatches.map((batch, index) => (
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {batch.id.slice(-8)}
                  </span>
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

              {/* Basic Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiCalendar className="w-4 h-4" />
                    <span>Settlement Week</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(batch.settlement_week)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiPercent className="w-4 h-4" />
                    <span>Commission</span>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {batch.commission_percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiPercent className="w-4 h-4" />
                    <span>System Payment</span>
                  </div>
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
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {batch.uploaded_file_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Uploaded At</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(batch.created_at).toLocaleString()}
                      </p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Uploaded Settlement Batches
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} uploaded
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            {/* <div className="relative">
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <FiFile className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div> */}

            {/* System Filter */}
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Systems</option>
              <option value="ALPHA">Alpha</option>
              <option value="KIRON2">Kiron 2</option>
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

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-primary-500/10 text-primary-600 hover:bg-primary-500 hover:text-white transition-all duration-200"
              title="Refresh"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading batches...</p>
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FiFile className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No batches found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || systemFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first settlement batch to get started'}
            </p>
          </div>
        ) : (
          /* View Content */
          viewMode === 'table' ? <TableView /> : <CardView />
        )}
      </div>

      {/* Modals */}
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