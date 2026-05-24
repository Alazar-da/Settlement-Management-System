'use client';

import { useState } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

import {
  Line,
  Bar,
} from 'react-chartjs-2';

import { motion } from 'framer-motion';

import {
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueTrendChart({
  settlements,
}: any) {
  const [chartType, setChartType] =
    useState<'line' | 'bar'>(
      'line'
    );

  const processData = () => {
    const grouped: any = {};

    settlements.forEach(
      (item: any) => {
        const week =
          item.settlement_date;

        if (!grouped[week]) {
          grouped[week] = {
            week,

            expectedCollection: 0,

            actualCollection: 0,

            remaining: 0,

            ggr: 0,
          };
        }

        grouped[
          week
        ].expectedCollection += Number(
          item.total_net_revenue_collect ||
            0
        );

        grouped[
          week
        ].actualCollection += Number(
          item.total_paid || 0
        );

        grouped[
          week
        ].remaining += Number(
          item.remaining_balance || 0
        );

        grouped[week].ggr += Number(
          item.total_ggr || 0
        );
      }
    );

    return Object.values(
      grouped
    ).sort(
      (a: any, b: any) =>
        new Date(
          a.week
        ).getTime() -
        new Date(
          b.week
        ).getTime()
    );
  };

  const chartData = processData();

  const labels = chartData.map(
    (item: any) =>
      new Date(
        item.week
      ).toLocaleDateString(
        undefined,
        {
          month: 'short',
          day: 'numeric',
        }
      )
  );

  const data = {
    labels,

    datasets: [
      {
        label:
          'Expected Collection',

        data: chartData.map(
          (item: any) =>
            item.expectedCollection
        ),

        borderColor:
          'rgb(59, 130, 246)',

        backgroundColor:
          'rgba(59, 130, 246, 0.1)',

        borderWidth: 3,

        tension: 0.4,

        fill: true,
      },

      {
        label: 'Collected',

        data: chartData.map(
          (item: any) =>
            item.actualCollection
        ),

        borderColor:
          'rgb(34, 197, 94)',

        backgroundColor:
          'rgba(34, 197, 94, 0.1)',

        borderWidth: 3,

        tension: 0.4,

        fill: true,
      },

      {
        label: 'Remaining',

        data: chartData.map(
          (item: any) =>
            item.remaining
        ),

        borderColor:
          'rgb(239, 68, 68)',

        backgroundColor:
          'rgba(239, 68, 68, 0.1)',

        borderWidth: 3,

        tension: 0.4,

        fill: true,
      },

      {
        label: 'GGR',

        data: chartData.map(
          (item: any) =>
            item.ggr
        ),

        borderColor:
          'rgb(168, 85, 247)',

        backgroundColor:
          'rgba(168, 85, 247, 0.1)',

        borderWidth: 3,

        tension: 0.4,

        fill: true,
      },
    ],
  };

  const options: any = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          callback: function (
            value: any
          ) {
            return `$${Number(
              value
            ).toLocaleString()}`;
          },
        },
      },
    },
  };

  const totalExpected =
    chartData.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        item.expectedCollection,
      0
    );

  const totalCollected =
    chartData.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum +
        item.actualCollection,
      0
    );

  const totalRemaining =
    chartData.reduce(
      (
        sum: number,
        item: any
      ) =>
        sum + item.remaining,
      0
    );

  const totalGGR =
    chartData.reduce(
      (
        sum: number,
        item: any
      ) => sum + item.ggr,
      0
    );

  const collectionRate =
    totalExpected > 0
      ? (
          (totalCollected /
            totalExpected) *
          100
        ).toFixed(1)
      : 0;

  const last =
    chartData[
      chartData.length - 1
    ];

  const prev =
    chartData[
      chartData.length - 2
    ];

  if (
    settlements.length === 0
  ) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
        No Data Available
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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Revenue Trend
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Weekly financial
              performance
            </p>
          </div>

          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() =>
                setChartType(
                  'line'
                )
              }
              className={`p-2 rounded-md ${
                chartType ===
                'line'
                  ? 'bg-white dark:bg-gray-600'
                  : ''
              }`}
            >
              <FiTrendingUp />
            </button>

            <button
              onClick={() =>
                setChartType(
                  'bar'
                )
              }
              className={`p-2 rounded-md ${
                chartType ===
                'bar'
                  ? 'bg-white dark:bg-gray-600'
                  : ''
              }`}
            >
              <FiBarChart2 />
            </button>
          </div>
        </div>

       {/*  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          <div>
            <p className="text-xs text-gray-500">
              Expected
            </p>

            <p className="font-bold text-blue-600">
              $
              {totalExpected.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Collected
            </p>

            <p className="font-bold text-green-600">
              $
              {totalCollected.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Remaining
            </p>

            <p className="font-bold text-red-600">
              $
              {totalRemaining.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              GGR
            </p>

            <p className="font-bold text-purple-600">
              $
              {totalGGR.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Collection Rate
            </p>

            <div className="flex items-center gap-1">
              <p className="font-bold">
                {
                  collectionRate
                }
                %
              </p>

              {Number(trend) !==
                0 && (
                <span
                  className={`text-xs flex items-center ${
                    Number(
                      trend
                    ) > 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {Number(
                    trend
                  ) > 0 ? (
                    <FiTrendingUp />
                  ) : (
                    <FiTrendingDown />
                  )}

                  {Math.abs(
                    Number(trend)
                  )}
                  %
                </span>
              )}
            </div>
          </div>
        </div> */}
      </div>

      <div className="p-5">
        <div className="h-96">
          {chartType ===
          'line' ? (
            <Line
              data={data}
              options={options}
            />
          ) : (
            <Bar
              data={data}
              options={options}
            />
          )}
        </div>
      </div>

      <div className="px-5 pb-5 text-xs text-gray-500 flex items-center justify-center gap-2">
        <FiCalendar />

        <span>
          {chartData.length}{' '}
          settlement weeks
        </span>

        <FiDollarSign />

        <span>
          USD Currency
        </span>
      </div>
    </motion.div>
  );
}