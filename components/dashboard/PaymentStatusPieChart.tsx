'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from 'recharts';
import { motion } from 'framer-motion';
import { FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';

interface PaymentStatusPieChartProps {
  data?: Array<{
    status: string;
    value: number;
    color: string;
  }>;
}

const defaultData = [
  { status: 'Fully Paid', value: 45, color: '#10b981' },
  { status: 'Partially Paid', value: 25, color: '#f59e0b' },
  { status: 'Unpaid', value: 30, color: '#ef4444' },
];

export default function PaymentStatusPieChart({ data = [] }: PaymentStatusPieChartProps) {
  const [chartData, setChartData] = useState(defaultData);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
    }
  }, [data]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    
    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#6b7280" className="text-sm">
          {payload.status}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#374151" className="text-xl font-bold dark:text-white">
          {value}
        </text>
        <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#6b7280" className="text-xs">
          ({`${(percent * 100).toFixed(0)}%`})
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentage: {((payload[0].value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Status Distribution
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Overview of agent payment completion
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...{
                activeIndex,
                activeShape: renderActiveShape,
                data: chartData,
                cx: '50%',
                cy: '50%',
                innerRadius: 60,
                outerRadius: 80,
                paddingAngle: 5,
                dataKey: 'value',
                onMouseEnter: onPieEnter,
              } as any}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {chartData.map((item) => (
          <div key={item.status} className="text-center">
            <div className="flex items-center justify-center mb-2">
              {item.status === 'Fully Paid' && <FiCheckCircle className="w-4 h-4 text-green-500" />}
              {item.status === 'Partially Paid' && <FiClock className="w-4 h-4 text-yellow-500" />}
              {item.status === 'Unpaid' && <FiDollarSign className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{item.status}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((item.value / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}