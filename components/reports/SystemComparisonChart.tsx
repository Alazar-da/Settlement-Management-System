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

import {
  FiBarChart2,
} from 'react-icons/fi';
import { formatCurrency } from '@/utils/formatCurrency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function SystemComparisonChart({
  settlements,
  batches,
}: any) {
  // =========================
// GROUP BATCHES BY SYSTEM
// =========================
 
const batchSystemPayments =
  batches.reduce(
    (acc: any, batch: any) => {
      const systemName =
        batch.system_type || 'Unknown';

      if (!acc[systemName]) {
        acc[systemName] = 0;
      }

      // ONLY SUBTRACT PAID SYSTEM PAYMENTS
      if (
        batch.system_payment_status ===
        'PAID'
      ) {
        acc[systemName] += Number(
          batch.total_system_payment || 0
        );
      }

      return acc;
    },
    {}
  );

// =========================
// GROUP REVENUE BY SYSTEM
// =========================

const groupedSystems =
  settlements.reduce(
    (acc: any, item: any) => {
      const systemName =
        item.system_type || 'Unknown';

      if (!acc[systemName]) {
        acc[systemName] = {
          name: systemName,

          collected: 0,

          systemPayment: 0,

          revenue: 0,

          count: 0,
        };
      }

      // ACTUAL COLLECTED MONEY
      acc[systemName].collected +=
        Number(item.total_paid || 0);

      acc[systemName].count += 1;

      return acc;
    },
    {}
  );

// =========================
// APPLY SYSTEM PAYMENTS
// =========================

Object.keys(groupedSystems).forEach(
  (systemName) => {
    const collected =
      groupedSystems[systemName]
        .collected;

    const systemPayment =
      Number(
        batchSystemPayments[
          systemName
        ] || 0
      );

    groupedSystems[
      systemName
    ].systemPayment =
      systemPayment;

    // NET REVENUE
    groupedSystems[
      systemName
    ].revenue =
      collected - systemPayment;
  }
);

const systems = Object.values(
  groupedSystems
) as any[];

// =========================
// TOTAL NET REVENUE
// =========================

const totalRevenue =
  systems.reduce(
    (sum: number, system: any) =>
      sum + system.revenue,
    0
  );
  // =========================
  // COLORS
  // =========================

  const colors = [
    {
      bg: 'rgba(168, 85, 247, 0.8)',
      border:
        'rgb(168, 85, 247)',
      dot: 'bg-purple-500',
    },

    {
      bg: 'rgba(59, 130, 246, 0.8)',
      border:
        'rgb(59, 130, 246)',
      dot: 'bg-blue-500',
    },

    {
      bg: 'rgba(34, 197, 94, 0.8)',
      border:
        'rgb(34, 197, 94)',
      dot: 'bg-green-500',
    },

    {
      bg: 'rgba(249, 115, 22, 0.8)',
      border:
        'rgb(249, 115, 22)',
      dot: 'bg-orange-500',
    },

    {
      bg: 'rgba(236, 72, 153, 0.8)',
      border:
        'rgb(236, 72, 153)',
      dot: 'bg-pink-500',
    },

    {
      bg: 'rgba(234, 179, 8, 0.8)',
      border:
        'rgb(234, 179, 8)',
      dot: 'bg-yellow-500',
    },
  ];

  // =========================
  // CHART DATA
  // =========================

  const data = {
    labels: systems.map(
      (x: any) => x.name
    ),

    datasets: [
      {
        label: 'Revenue',

        data: systems.map(
          (x: any) => x.revenue
        ),

        backgroundColor:
          systems.map(
            (_: any, index: number) =>
              colors[
                index %
                  colors.length
              ].bg
          ),

        borderColor:
          systems.map(
            (_: any, index: number) =>
              colors[
                index %
                  colors.length
              ].border
          ),

        borderWidth: 2,

        borderRadius: 8,

        barPercentage: 0.6,

        categoryPercentage: 0.8,
      },
    ],
  };

  // =========================
  // CHART OPTIONS
  // =========================

  const options = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        backgroundColor:
          'rgba(0,0,0,0.8)',

        padding: 10,

        callbacks: {
          label: function (
            context: any
          ) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        grid: {
          color:
            'rgba(0,0,0,0.05)',
        },

        ticks: {
          callback: function (
            value: any
          ) {
            return new Intl.NumberFormat(
              'en-US',
              {
                style: 'currency',

                currency: 'ETB',

                notation:
                  'compact',

                compactDisplay:
                  'short',
              }
            ).format(value);
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

  // =========================
  // EMPTY STATE
  // =========================

  if (
    !settlements ||
    settlements.length === 0
  ) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <FiBarChart2 className="w-8 h-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Data Available
        </h3>

        <p className="text-gray-600 dark:text-gray-400">
          Upload settlements to
          see system comparison
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5"
    >
      {/* HEADER */}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          System Comparison
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revenue breakdown by
          system
        </p>
      </div>

      {/* CHART */}
      <div className="h-80">
        <Bar
          data={data}
          options={options}
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        {systems.map(
          (
            system: any,
            index: number
          ) => {
            const percentage =
              totalRevenue > 0
                ? (system.revenue /
                    totalRevenue) *
                  100
                : 0;

            return (
              <div
                key={system.name}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-1">
                  <div
                    className={`w-3 h-3 rounded-full mr-1 ${
                      colors[
                        index %
                          colors.length
                      ].dot
                    }`}
                  />

                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {system.name}
                  </span>
                </div>

                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(system.revenue)}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {system.count}{' '}
                  settlement
                  {system.count !== 1
                    ? 's'
                    : ''}
                  {' • '}
                  {percentage.toFixed(
                    1
                  )}
                  %
                </p>
              </div>
            );
          }
        )}
      </div>
    </motion.div>
  );
}