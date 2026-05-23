'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiUsers,
  FiDatabase,
  FiTrendingUp,
  FiFileText,
  FiBarChart2,
  FiUpload,
} from 'react-icons/fi';

interface ImportSummaryModalProps {
  data: {
    totalAgents: number;
    totalGGR: number;
    totalExpectedCollection: number;
    settlements: number;
    batchId: string;
    errors?: Array<{ row: number; message: string }>;
    warnings?: Array<{ row: number; message: string }>;
  };
  onClose: () => void;
}

export default function ImportSummaryModal({ data, onClose }: ImportSummaryModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setAnimationProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: 'Total Agents',
      value: data.totalAgents,
      icon: FiUsers,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total GGR',
      value: formatCurrency(data.totalGGR),
      icon: FiTrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Expected Collection',
      value: formatCurrency(data.totalExpectedCollection),
      icon: FiDollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Settlements Created',
      value: data.settlements,
      icon: FiDatabase,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <Transition show={true} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <FiCheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-semibold text-white">
                          Import Successful!
                        </Dialog.Title>
                        <p className="text-green-100 text-sm mt-1">
                          Your settlement file has been processed successfully
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Progress Animation */}
                  <div className="relative">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Processing Complete</span>
                      <span>{animationProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${animationProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-2"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`${stat.bgColor} rounded-xl p-4`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`w-5 h-5 ${stat.textColor}`} />
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${stat.color} opacity-20`} />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stat.value}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {stat.label}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Batch Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiFileText className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Batch Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Batch ID:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {data.batchId.slice(-8)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Upload Time:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Errors and Warnings */}
                  {(data.errors && data.errors.length > 0) || (data.warnings && data.warnings.length > 0) ? (
                    <div>
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center space-x-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                      >
                        <FiAlertCircle className="w-4 h-4" />
                        <span>
                          {data.errors?.length || 0} errors, {data.warnings?.length || 0} warnings
                        </span>
                        <span>{showDetails ? '▼' : '▶'}</span>
                      </button>

                      {showDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-2"
                        >
                          {data.errors?.map((error, index) => (
                            <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <FiAlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Row {error.row}
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-400">
                                    {error.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {data.warnings?.map((warning, index) => (
                            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <FiAlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                    Row {warning.row}
                                  </p>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    {warning.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-800 dark:text-green-300">
                          All records processed successfully with no errors or warnings.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Next Steps
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          window.location.href = '/reports';
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <FiBarChart2 className="w-4 h-4" />
                        <span>View Reports</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          window.location.reload();
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiUpload className="w-4 h-4" />
                        <span>Upload Another</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}