'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface RevenueChartProps {
  data?: Array<{
    week: string;
    revenue: number;
    ggr: number;
    collections: number;
  }>;
}

export default function RevenueChart({ data = [] }: RevenueChartProps) {
  const [chartData, setChartData] = useState(data);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');

  // Sample data if none provided
  useEffect(() => {
    if (!data || data.length === 0) {
      const sampleData = [
        { week: 'Week 1', revenue: 125000, ggr: 150000, collections: 100000 },
        { week: 'Week 2', revenue: 142000, ggr: 168000, collections: 115000 },
        { week: 'Week 3', revenue: 138000, ggr: 162000, collections: 110000 },
        { week: 'Week 4', revenue: 156000, ggr: 185000, collections: 125000 },
        { week: 'Week 5', revenue: 168000, ggr: 195000, collections: 135000 },
        { week: 'Week 6', revenue: 175000, ggr: 210000, collections: 140000 },
      ];
      setChartData(sampleData);
    } else {
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
            Revenue Trends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Weekly revenue and collection overview
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimeRange('weekly')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'weekly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ggrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="week" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            
            <Area
              type="monotone"
              dataKey="revenue"
              name="Net Revenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
            
            <Area
              type="monotone"
              dataKey="ggr"
              name="GGR"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#ggrGradient)"
            />
            
            <Bar
              dataKey="collections"
              name="Collections"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Weekly Revenue</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ${(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total GGR</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ${chartData.reduce((sum, d) => sum + d.ggr, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Collection Rate</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {((chartData.reduce((sum, d) => sum + d.collections, 0) / 
               chartData.reduce((sum, d) => sum + d.revenue, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}