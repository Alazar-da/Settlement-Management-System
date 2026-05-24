'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { FiBarChart2 } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function SystemComparisonChart({ settlements }: any) {
  const kiron = settlements.filter((x: any) => x.system_type === 'KIRON2');
  const alpha = settlements.filter((x: any) => x.system_type === 'ALPHA');

  const kironRevenue = kiron.reduce(
    (s: number, x: any) => s + Number(x.total_net_revenue_collect || 0),
    0
  );
  
  const alphaRevenue = alpha.reduce(
    (s: number, x: any) => s + Number(x.total_net_revenue_collect || 0),
    0
  );

  const kironCount = kiron.length;
  const alphaCount = alpha.length;

  const total = kironRevenue + alphaRevenue;
  const kironPercentage = total > 0 ? (kironRevenue / total) * 100 : 0;
  const alphaPercentage = total > 0 ? (alphaRevenue / total) * 100 : 0;

  const data = {
    labels: ['Kiron 2', 'Alpha'],
    datasets: [
      {
        label: 'Revenue',
        data: [kironRevenue, alphaRevenue],
        backgroundColor: [
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgb(168, 85, 247)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          }
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <FiBarChart2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload settlements to see system comparison
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
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          System Comparison
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revenue breakdown by system
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Kiron 2</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${kironRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {kironCount} agent{kironCount !== 1 ? 's' : ''} • {kironPercentage.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Alpha</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${alphaRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {alphaCount} agent{alphaCount !== 1 ? 's' : ''} • {alphaPercentage.toFixed(1)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}