'use client';

import { formatCurrency } from '@/utils/formatCurrency';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiAlertCircle,
} from 'react-icons/fi';

export default function KPISection({ settlements, agents }: any) {
  const totalNetCash = settlements.reduce(
    (sum: number, item: any) => sum + Number(item.total_net_cash || 0),
    0
  );

  const totalExpected = settlements.reduce(
    (sum: number, item: any) => sum + Number(item.total_net_revenue_collect || 0),
    0
  );

  const totalPaid = settlements.reduce(
    (sum: number, item: any) => sum + Number(item.total_paid || 0),
    0
  );

  const remaining = settlements.reduce(
    (sum: number, item: any) => sum + Number(item.remaining_balance || 0),
    0
  );

  const collectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
  const paidCount = settlements.filter((item: any) => 
    item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'
  ).length;
  const partialCount = settlements.filter((item: any) => 
    item.payment_status === 'PARTIALLY_PAID' || item.payment_status === 'IN_PROGRESS'
  ).length;
  const unpaidCount = settlements.filter((item: any) => 
    !item.payment_status || item.payment_status === 'UNPAID'
  ).length;

  const totalSystemPayment = settlements.reduce(
    (sum: number, item: any) => sum + Number(item.total_system_payment || 0),
    0
  );

  const cards = [
    {
      title: 'Total Net Cash',
      value: formatCurrency(totalNetCash),
      icon: FiTrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      prefix: '',
      suffix: '',
    },
    {
      title: 'Expected Collection',
      value: formatCurrency(totalExpected),
      icon: FiDollarSign,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      prefix: '',
      suffix: '',
    },
   /*   {
      title: 'Total System Payment',
      value: formatCurrency(totalSystemPayment),
      icon: FiCheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      prefix: '',
      suffix: '',
    }, */
    /* {
      title: 'Remaining',
      value: remaining,
      icon: FiClock,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      prefix: '$',
      suffix: '',
    }, */
   /*  {
      title: 'Collection Rate',
      value: collectionRate,
      icon: FiTrendingUp,
      color: 'from-teal-500 to-green-500',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      textColor: 'text-teal-600 dark:text-teal-400',
      prefix: '',
      suffix: '%',
    }, */
    {
      title: 'Total Agents',
      value: agents.length,
      icon: FiUsers,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      prefix: '',
      suffix: '',
    },
  ];

  const statusCards = [
    {
      title: 'Fully Paid',
      count: paidCount,
      icon: FiCheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Partially Paid',
      count: partialCount,
      icon: FiClock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Unpaid',
      count: unpaidCount,
      icon: FiAlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.textColor}`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.prefix}
                    {card.value.toLocaleString(undefined, { 
                      minimumFractionDigits: card.value % 1 !== 0 ? 2 : 0,
                      maximumFractionDigits: 2 
                    })}
                    {card.suffix}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.color}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Status Summary Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
          Payment Status Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 ${card.borderColor} overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {card.count}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {((card.count / settlements.length) * 100 || 0).toFixed(1)}%
                      </p>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            card.title === 'Fully Paid' ? 'bg-green-500' :
                            card.title === 'Partially Paid' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(card.count / settlements.length) * 100 || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Collection Progress
          </h3>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {collectionRate.toFixed(1)}% Complete
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${collectionRate}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-3"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Collected</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 dark:text-gray-400">Remaining</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}