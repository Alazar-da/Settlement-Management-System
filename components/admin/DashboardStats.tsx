'use client';

import { motion } from 'framer-motion';
import {
  FiDollarSign,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    totalAgents: number;
    pendingPayments: number;
    collectionRate: number;
    fullyPaid: number;
    unpaid: number;
  };
}

export default function DashboardStats({
  stats,
}: DashboardStatsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Total Agents',
      value: stats.totalAgents,
      icon: FiUsers,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Pending Payments',
      value: `$${stats.pendingPayments.toLocaleString()}`,
      icon: FiClock,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Collection Rate',
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon: FiTrendingUp,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Fully Paid',
      value: stats.fullyPaid,
      icon: FiCheckCircle,
      color: 'from-emerald-500 to-green-600',
    },
    {
      title: 'Unpaid',
      value: stats.unpaid,
      icon: FiAlertCircle,
      color: 'from-red-500 to-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white dark:bg-gray-900 shadow-xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`}
            />

            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </h3>
                </div>

                <div
                  className={`p-3 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-6 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                  style={{
                    width:
                      card.title === 'Collection Rate'
                        ? `${stats.collectionRate}%`
                        : '70%',
                  }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}