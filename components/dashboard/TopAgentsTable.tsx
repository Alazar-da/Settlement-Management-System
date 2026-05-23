'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {FiTrendingUp, FiDollarSign, FiUsers } from 'react-icons/fi';
import Image from 'next/image';
import { FaTrophy } from "react-icons/fa";

interface Agent {
  name: string;
  system: string;
  revenue: number;
  ggr: number;
  paymentStatus: string;
  collectionRate: number;
  rank?: number;
}

interface TopAgentsTableProps {
  agents?: Agent[];
}

const defaultAgents: Agent[] = [
  { name: 'Golden Crown', system: 'Alpha', revenue: 125000, ggr: 150000, paymentStatus: 'Fully Paid', collectionRate: 100, rank: 1 },
  { name: 'Royal Palace', system: 'Kiron 2', revenue: 98000, ggr: 117600, paymentStatus: 'Partially Paid', collectionRate: 75, rank: 2 },
  { name: 'Lucky Star', system: 'Alpha', revenue: 87000, ggr: 104400, paymentStatus: 'Fully Paid', collectionRate: 100, rank: 3 },
  { name: 'Diamond Casino', system: 'Kiron 2', revenue: 76000, ggr: 91200, paymentStatus: 'Unpaid', collectionRate: 0, rank: 4 },
  { name: 'Phoenix Bet', system: 'Alpha', revenue: 65000, ggr: 78000, paymentStatus: 'Partially Paid', collectionRate: 50, rank: 5 },
];

export default function TopAgentsTable({ agents = [] }: TopAgentsTableProps) {
  const [tableData, setTableData] = useState<Agent[]>(defaultAgents);
  const [sortBy, setSortBy] = useState<keyof Agent>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (agents && agents.length > 0) {
      const rankedAgents = agents.map((agent, index) => ({ ...agent, rank: index + 1 }));
      setTableData(rankedAgents);
    }
  }, [agents]);

  const handleSort = (column: keyof Agent) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    
    const sorted = [...tableData].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    setTableData(sorted);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'Fully Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'Partially Paid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Unpaid': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors['Unpaid'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Agents
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Highest revenue generating agents this month
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FaTrophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Leaderboard
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => handleSort('name')}
              >
                Agent Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                System
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => handleSort('revenue')}
              >
                Revenue
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => handleSort('ggr')}
              >
                GGR
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => handleSort('collectionRate')}
              >
                Collection Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((agent, index) => (
              <motion.tr
                key={agent.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {agent.rank === 1 && (
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <FaTrophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    )}
                    {agent.rank === 2 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">2</span>
                      </div>
                    )}
                    {agent.rank === 3 && (
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">3</span>
                      </div>
                    )}
                    {agent.rank && agent.rank > 3 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{agent.rank}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agent.system === 'Alpha' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {agent.system}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                  ${agent.revenue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                  ${agent.ggr.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${agent.collectionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {agent.collectionRate}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(agent.paymentStatus)}`}>
                    {agent.paymentStatus}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiUsers className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Agents: {tableData.length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FiTrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Revenue: ${tableData.reduce((sum, a) => sum + a.revenue, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            View All →
          </button>
        </div>
      </div>
    </motion.div>
  );
}