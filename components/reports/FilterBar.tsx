'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiCalendar, FiSearch, FiX, FiDownload } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterBarProps {
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    agent: string;
    system: string;
    paymentStatus: string;
  };
  setFilters: (filters: any) => void;
  onExport?: () => void;
  onSearch?: () => void;
}

const systemOptions = [
  { value: '', label: 'All Systems' },
  { value: 'Alpha', label: 'Alpha' },
  { value: 'Kiron2', label: 'Kiron 2' },
];

const paymentStatusOptions = [
  { value: '', label: 'All Status' },
  { value: 'Fully Paid', label: 'Fully Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
];

export default function FilterBar({ filters, setFilters, onExport, onSearch }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    setFilters({ ...filters, agent: searchTerm });
    onSearch?.();
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      agent: '',
      system: '',
      paymentStatus: '',
    });
    setSearchTerm('');
    onSearch?.();
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.agent || filters.system || filters.paymentStatus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by agent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              showFilters || hasActiveFilters
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FiFilter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-primary-600 rounded-full text-xs font-bold">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={filters.startDate}
                    onChange={(date:any) => setFilters({ ...filters, startDate: date })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholderText="Select start date"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={filters.endDate}
                    onChange={(date:any) => setFilters({ ...filters, endDate: date })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholderText="Select end date"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                {/* System Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System
                  </label>
                  <Select
                    options={systemOptions}
                    value={systemOptions.find(opt => opt.value === filters.system)}
                    onChange={(option: any) => setFilters({ ...filters, system: option?.value || '' })}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    placeholder="Select system"
                  />
                </div>

                {/* Payment Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Status
                  </label>
                  <Select
                    options={paymentStatusOptions}
                    value={paymentStatusOptions.find(opt => opt.value === filters.paymentStatus)}
                    onChange={(option: any) => setFilters({ ...filters, paymentStatus: option?.value || '' })}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isClearable
                    placeholder="Select status"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center space-x-1"
                >
                  <FiX className="w-4 h-4" />
                  <span>Clear all filters</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.startDate && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              From: {new Date(filters.startDate).toLocaleDateString()}
              <button
                onClick={() => setFilters({ ...filters, startDate: null })}
                className="ml-1 hover:text-primary-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.endDate && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              To: {new Date(filters.endDate).toLocaleDateString()}
              <button
                onClick={() => setFilters({ ...filters, endDate: null })}
                className="ml-1 hover:text-primary-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.agent && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              Agent: {filters.agent}
              <button
                onClick={() => {
                  setFilters({ ...filters, agent: '' });
                  setSearchTerm('');
                }}
                className="ml-1 hover:text-primary-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.system && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              System: {filters.system}
              <button
                onClick={() => setFilters({ ...filters, system: '' })}
                className="ml-1 hover:text-primary-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.paymentStatus && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              Status: {filters.paymentStatus}
              <button
                onClick={() => setFilters({ ...filters, paymentStatus: '' })}
                className="ml-1 hover:text-primary-600"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <style jsx global>{`
        .react-select-container .react-select__control {
          @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
        }
        .react-select-container .react-select__control:hover {
          @apply border-gray-400 dark:border-gray-500;
        }
        .react-select-container .react-select__control--is-focused {
          @apply border-primary-500 ring-1 ring-primary-500;
        }
        .react-select-container .react-select__value-container {
          @apply text-gray-900 dark:text-white;
        }
        .react-select-container .react-select__input-container {
          @apply text-gray-900 dark:text-white;
        }
        .react-select-container .react-select__single-value {
          @apply text-gray-900 dark:text-white;
        }
        .react-select-container .react-select__menu {
          @apply bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600;
        }
        .react-select-container .react-select__option {
          @apply text-gray-900 dark:text-gray-200;
        }
        .react-select-container .react-select__option--is-focused {
          @apply bg-primary-50 dark:bg-primary-900/30;
        }
        .react-select-container .react-select__option--is-selected {
          @apply bg-primary-600 text-white;
        }
        .react-select-container .react-select__placeholder {
          @apply text-gray-500 dark:text-gray-400;
        }
        .react-select-container .react-select__indicator-separator {
          @apply bg-gray-300 dark:bg-gray-600;
        }
        .react-select-container .react-select__indicator {
          @apply text-gray-500 dark:text-gray-400;
        }
      `}</style>
    </div>
  );
}