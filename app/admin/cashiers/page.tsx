'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiUsers,
  FiSave,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

interface Agent {
  id: string;
  name: string;
}

interface Cashier {
  id: string;
  name: string;
  agent_id: string;
  agents?: {
    name: string;
  };
}

const ITEMS_PER_PAGE = 10;

// Debounce helper
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [formData, setFormData] = useState({ name: '', agentId: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchTotalCount();
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCashiers();
  }, [currentPage, debouncedSearch]);

  async function fetchAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    if (!error && data) {
      setAgents(data);
    }
  }

  async function fetchTotalCount() {
    let query = supabase.from('cashiers').select('*', { count: 'exact', head: true });
    
    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`);
    }
    
    const { count, error } = await query;
    if (!error && count !== null) {
      setTotalCount(count);
    }
  }

  async function fetchCashiers() {
    setLoading(true);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('cashiers')
      .select(
        `
        *,
        agents (
          name
        )
      `
      )
      .order('name')
      .range(from, to);
    
    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setCashiers(data as Cashier[]);
    }
    setLoading(false);
  }

  async function handleAddCashier(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.agentId) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('cashiers').insert([
      {
        name: formData.name,
        agent_id: formData.agentId,
      },
    ]);

    if (!error) {
      toast.success('Cashier added successfully');
      fetchTotalCount();
      setCurrentPage(1);
      setSearchTerm('');
      await fetchCashiers();
      setShowAddModal(false);
      setFormData({ name: '', agentId: '' });
    } else {
      toast.error('Failed to add cashier');
    }
    setSubmitting(false);
  }

  async function handleEditCashier(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.agentId) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('cashiers')
      .update({
        name: formData.name,
        agent_id: formData.agentId,
      })
      .eq('id', selectedCashier?.id);

    if (!error) {
      toast.success('Cashier updated successfully');
      await fetchCashiers();
      setShowEditModal(false);
      setSelectedCashier(null);
      setFormData({ name: '', agentId: '' });
    } else {
      toast.error('Failed to update cashier');
    }
    setSubmitting(false);
  }

  async function handleDeleteCashier() {
    setSubmitting(true);
    const { error } = await supabase
      .from('cashiers')
      .delete()
      .eq('id', selectedCashier?.id);

    if (!error) {
      toast.success('Cashier deleted successfully');
      fetchTotalCount();
      if (cashiers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchCashiers();
      }
      setShowDeleteModal(false);
      setSelectedCashier(null);
    } else {
      toast.error('Failed to delete cashier');
    }
    setSubmitting(false);
  }

  const openEditModal = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setFormData({
      name: cashier.name,
      agentId: cashier.agent_id,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setShowDeleteModal(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  return (
    <div className="sm:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cashiers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage cashiers and assign them to agents
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-black dark:bg-primary-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-primary-700 transition-colors"
        >
          <FiUserPlus className="w-4 h-4" />
          <span>Add Cashier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative sm:max-w-md w-full">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by cashier name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <FiX className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-500 mt-1">
            Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{searchTerm}"
          </p>
        )}
      </div>

      {/* Cashiers List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching cashiers found' : 'No cashiers found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? 'Try a different search term' 
                : 'Click "Add Cashier" to create your first cashier'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cashiers.map((cashier) => (
                <div
                  key={cashier.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                        {cashier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cashier.name}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <FiUsers className="w-3 h-3" />
                          <span>{cashier.agents?.name || 'No agent assigned'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(cashier)}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(cashier)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  Showing {startItem} to {endItem} of {totalCount} cashiers
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

      {/* Add Cashier Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Cashier">
        <form onSubmit={handleAddCashier} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cashier Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter cashier name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign Agent
            </label>
            <select
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-primary-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              <span>Add Cashier</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Cashier Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Cashier">
        <form onSubmit={handleEditCashier} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cashier Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter cashier name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign Agent
            </label>
            <select
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-primary-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <FiSave className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Cashier">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FiTrash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Are you sure you want to delete this cashier?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              "{selectedCashier?.name}" - {selectedCashier?.agents?.name || 'No agent'}
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCashier}
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <FiTrash2 className="w-4 h-4" />
              )}
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}