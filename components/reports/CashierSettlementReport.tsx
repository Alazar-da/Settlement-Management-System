'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FiDownload,
  FiSearch,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { assignWeekNumbers } from '@/utils/batchWeeks';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

interface CashierSettlement {
  id: string;
  cashier_amount: number;
  settlement_week: string;
  system_type: string;
  created_at: string;
  week_number?: number;
  cashier: {
    id: string;
    name: string;
  };
  agent: {
    id: string;
    name: string;
  };
  batch: {
    id: string;
    settlement_week: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function CashierSettlementReport() {
  const [data, setData] = useState<CashierSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [weekOptions, setWeekOptions] = useState<any[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [selectedWeek, selectedAgent, selectedSystem, search]);

  async function fetchData() {
    try {
      setLoading(true);
 const {
  data: settlements,
  error,
} = await supabase
  .from('cashier_settlements')
  .select(
    `
    *,
    cashier:cashier_id (
      id,
      name
    ),
    agent:agent_id (
      id,
      name
    ),
    batch:batch_id (
      id,
      settlement_week
    )
  `
  );

      if (error) {
        toast.error('Failed to load report');
        return;
      }

      const normalizedData = (settlements || []).map((item) => ({
        ...item,
        settlement_week: item.batch?.settlement_week || item.settlement_week,
      }));

      const processed = assignWeekNumbers(normalizedData);

      const sorted =
  (processed || []).sort(
    (a, b) => {
      const dateA = new Date(
        a.batch
          ?.settlement_week ||
          a.settlement_date
      ).getTime();

      const dateB = new Date(
        b.batch
          ?.settlement_week ||
          b.settlement_date
      ).getTime();

      return dateB - dateA;
    }
  );

      setData(sorted);

      const uniqueWeeks = processed.filter(
        (item, index, self) => index === self.findIndex((w) => w.week_number === item.week_number)
      );
      uniqueWeeks.sort((a, b) => b.week_number - a.week_number);
      setWeekOptions(uniqueWeeks);

      const uniqueAgents = processed.filter(
        (item, index, self) => index === self.findIndex((a) => a.agent?.id === item.agent?.id)
      );
      setAgents(uniqueAgents);

      const uniqueSystems = [...new Set(processed.map((item) => item.system_type))] as string[];
      setSystems(uniqueSystems);
    } catch (error) {
      console.log(error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  // Filtered data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (selectedWeek !== 'all') {
      filtered = filtered.filter((item) => String(item.week_number) === selectedWeek);
    }

    if (selectedAgent !== 'all') {
      filtered = filtered.filter((item) => item.agent?.id === selectedAgent);
    }

    if (selectedSystem !== 'all') {
      filtered = filtered.filter((item) => item.system_type === selectedSystem);
    }

    if (search) {
      filtered = filtered.filter((item) =>
        item.cashier?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [data, selectedWeek, selectedAgent, selectedSystem, search]);

  // Pagination calculations
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Grand total (for filtered data)
  const grandTotal = filteredData.reduce((sum, item) => sum + Number(item.cashier_amount || 0), 0);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Export Excel
  const exportExcel = () => {
    try {
      const exportData = filteredData.map((item, index) => ({
        No: (index + 1).toString(),
        Week: item.week_number,
        'Cashier Name': item.cashier?.name,
        'Owner Name': item.agent?.name,
        'System Type': item.system_type,
        Amount: Number(item.cashier_amount).toFixed(2),
        Date: new Date(item.batch?.settlement_week || item.settlement_week).toLocaleDateString(),
      }));

      exportData.push({
        No: '',
        Week: undefined,
        'Cashier Name': '',
        'Owner Name': '',
        'System Type': 'GRAND TOTAL',
        Amount: grandTotal.toFixed(2),
        Date: '',
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cashier Report');
      XLSX.writeFile(workbook, `cashier-report-${new Date().toISOString()}.xlsx`);
      toast.success('Excel exported');
    } catch (error) {
      console.log(error);
      toast.error('Failed to export excel');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Cashier Settlement Report
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cashier weekly settlement amounts
            </p>
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Weeks</option>
            {weekOptions.map((week) => (
              <option key={week.week_number} value={week.week_number}>
                Week {week.week_number}
              </option>
            ))}
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Owners</option>
            {agents.map((item) => (
              <option key={item.agent?.id} value={item.agent?.id}>
                {item.agent?.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Systems</option>
            {systems.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <FiFileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No cashier settlements found
          </h3>
        </div>
      ) : (
        <>
          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Week</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Cashier</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Owner</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">System</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    <td className="px-4 py-3">Week {item.week_number}</td>
                    <td className="px-4 py-3 font-medium">{item.cashier?.name}</td>
                    <td className="px-4 py-3">{item.agent?.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {item.system_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(item.batch?.settlement_week || item.settlement_week).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.cashier_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Showing {startItem} to {endItem} of {totalCount} entries
              </div>
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <FiChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1">
                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-black dark:bg-primary-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <FiChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FOOTER - GRAND TOTAL */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div className="text-right">
              <p className="text-sm text-gray-500">Grand Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}