'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface SystemComparisonChartProps {
  data?: Array<{
    system: string;
    revenue: number;
    ggr: number;
    collections: number;
  }>;
}

const defaultData = [
  { system: 'Alpha', revenue: 425000, ggr: 510000, collections: 340000 },
  { system: 'Kiron 2', revenue: 385000, ggr: 462000, collections: 308000 },
];

export default function SystemComparisonChart({ data = [] }: SystemComparisonChartProps) {
  const [chartData, setChartData] = useState(defaultData);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
    }
  }, [data]);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: ${item.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const alphaData = chartData.find(d => d.system === 'Alpha');
  const kironData = chartData.find(d => d.system === 'Kiron 2');
  
  const revenueDiff = alphaData && kironData 
    ? ((alphaData.revenue - kironData.revenue) / kironData.revenue * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Comparison
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Alpha vs Kiron 2 performance
          </p>
        </div>
        
        {revenueDiff && (
          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
            parseFloat(revenueDiff) > 0 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {parseFloat(revenueDiff) > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{Math.abs(parseFloat(revenueDiff))}% Alpha Lead</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barGap={8}
            barCategoryGap={16}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="system" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
              )}
            />
            <Bar dataKey="revenue" name="Net Revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#8b5cf6" />
              ))}
            </Bar>
            <Bar dataKey="ggr" name="GGR" fill="#3b82f6" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#3b82f6" />
              ))}
            </Bar>
            <Bar dataKey="collections" name="Collections" fill="#10b981" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#10b981" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        {chartData.map((system) => (
          <div key={system.system} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {system.system}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Collection Rate:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {((system.collections / system.revenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Margin:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {((system.revenue / system.ggr) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}