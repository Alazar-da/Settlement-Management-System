'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { FiPieChart, FiBarChart2 } from 'react-icons/fi';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function PaymentStatusChart({ settlements }: any) {
  const [chartType, setChartType] = useState<'pie' | 'doughnut'>('doughnut');
  
  const paid = settlements.filter(
    (x: any) => x.payment_status === 'FULLY_PAID' || x.payment_status === 'PAID'
  ).length;
  
  const progress = settlements.filter(
    (x: any) => x.payment_status === 'PARTIALLY_PAID' || x.payment_status === 'IN_PROGRESS'
  ).length;
  
  const unpaid = settlements.filter(
    (x: any) => !x.payment_status || x.payment_status === 'UNPAID'
  ).length;

  const total = settlements.length;
  const paidPercentage = total > 0 ? (paid / total) * 100 : 0;
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;
  const unpaidPercentage = total > 0 ? (unpaid / total) * 100 : 0;

  const data = {
    labels: [`Fully Paid (${paidPercentage.toFixed(1)}%)`, `Partially Paid (${progressPercentage.toFixed(1)}%)`, `Unpaid (${unpaidPercentage.toFixed(1)}%)`],
    datasets: [
      {
        data: [paid, progress, unpaid],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return `${label}: ${value} agents`;
          }
        },
      },
    },
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <FiPieChart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload settlements to see payment status
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Payment Status
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} agents total
          </p>
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              chartType === 'pie'
                ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            title="Pie Chart"
          >
            <FiPieChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              chartType === 'doughnut'
                ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            title="Doughnut Chart"
          >
            <FiBarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartType === 'pie' ? (
          <Pie data={data} options={options} />
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>

      {/* Simple Legend */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Paid</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{paid}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Partial</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{progress}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Unpaid</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{unpaid}</p>
        </div>
      </div>
    </motion.div>
  );
}