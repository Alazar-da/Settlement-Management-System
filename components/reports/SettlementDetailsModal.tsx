'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  FiX,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiUser,
  FiCpu,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';

interface SettlementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: any;
}

export default function SettlementDetailsModal({
  isOpen,
  onClose,
  settlement,
}: SettlementDetailsModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
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

  const statusConfig = getStatusConfig(settlement.paymentStatus);
  const StatusIcon = statusConfig.icon;
  const progress = (settlement.totalPaid / settlement.totalNetRevenueCollect) * 100;

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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    Settlement Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Header Info */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {settlement.agentId?.name || 'Unknown Agent'}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiUser className="w-4 h-4" />
                          <span>Agent ID: {settlement.agentId?._id?.slice(-8) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiCpu className="w-4 h-4" />
                          <span>{settlement.systemType}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiCalendar className="w-4 h-4" />
                          <span>{new Date(settlement.settlementDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusConfig.bgColor}`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      <span className={`font-medium ${statusConfig.color}`}>
                        {settlement.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Revenue Breakdown
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Total GGR</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(settlement.totalGGR)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Net Revenue Collect</span>
                          <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                            {formatCurrency(settlement.totalNetRevenueCollect)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">System Payment</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(settlement.totalSystemPayment)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Payment Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Total Paid</span>
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(settlement.totalPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">Remaining Balance</span>
                          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(settlement.remainingBalance)}
                          </span>
                        </div>
                        <div className="pt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Payment Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 rounded-full h-2 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Settlement ID</p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {settlement._id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(settlement.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {settlement.paymentStatus !== 'Fully Paid' && (
                    <button
                      onClick={() => {
                        onClose();
                        // Open payment modal
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Payment
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}