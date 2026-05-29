'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  FiDownload,
  FiSearch,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';

import { supabase } from '@/lib/supabase';
import { assignWeekNumbers } from '@/utils/batchWeeks';
import { formatCurrency } from '@/utils/formatCurrency';

const ITEMS_PER_PAGE = 10;

export default function RevenueReportTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systems, setSystems] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [search, setSearch] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [selectedWeek, selectedSystem, selectedAgent, search]);

async function fetchData() {
  try {
    setLoading(true);

    const {
      data: settlements,
      error,
    } = await supabase
      .from('revenue_settlements')
      .select(
        `
        *,
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
      console.log(error);
      return;
    }

    // =========================
    // NORMALIZE WEEK SOURCE
    // =========================

    const formatted =
      (settlements || []).map(
        (item) => ({
          ...item,

          settlement_week:
            item.batch
              ?.settlement_week ||
            item.settlement_date,
        })
      );

    // =========================
    // ASSIGN WEEK NUMBERS
    // =========================

    const withWeeks =
      assignWeekNumbers(
        formatted
      );

    // =========================
    // SORT LATEST FIRST
    // =========================

    const sorted =
      (withWeeks || []).sort(
        (a, b) => {
          const dateA =
            new Date(
              a.batch
                ?.settlement_week ||
                a.settlement_week
            ).getTime();

          const dateB =
            new Date(
              b.batch
                ?.settlement_week ||
                b.settlement_week
            ).getTime();

          return (
            dateB - dateA
          );
        }
      );

    setData(sorted);

    // =========================
    // FETCH FILTER DATA
    // =========================

    const {
      data: systemsData,
    } = await supabase
      .from('systems')
      .select('*')
      .order('name');

    const {
      data: agentsData,
    } = await supabase
      .from('agents')
      .select('*')
      .order('name');

    setSystems(
      systemsData || []
    );

    setAgents(
      agentsData || []
    );
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
}

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesWeek = !selectedWeek || String(item.week_number) === selectedWeek;
      const matchesSystem = !selectedSystem || item.system_id === selectedSystem;
      const matchesAgent = !selectedAgent || item.agent_id === selectedAgent;
      const matchesSearch = !search || item.agent?.name?.toLowerCase().includes(search.toLowerCase());

      return matchesWeek && matchesSystem && matchesAgent && matchesSearch;
    });
  }, [data, selectedWeek, selectedSystem, selectedAgent, search]);

  // Pagination calculations
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Grand totals (for all filtered data, not just current page)
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.totalNetCash += Number(item.total_net_cash || 0);
        acc.totalCollection += Number(item.total_net_revenue_collect || 0);
        acc.totalSystemPayment += Number(item.total_system_payment || 0);
        acc.totalPaid += Number(item.total_paid || 0);
        acc.totalRemaining += Number(item.remaining_balance || 0);
        return acc;
      },
      {
        totalNetCash: 0,
        totalCollection: 0,
        totalSystemPayment: 0,
        totalPaid: 0,
        totalRemaining: 0,
      }
    );
  }, [filteredData]);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Export Excel
  function exportExcel() {
    const exportData = filteredData.map((item) => ({
      Week: item.week_number,
      'Week Date': item.settlement_date,
      'Owner Name': item.agent?.name || '',
      System: item.system_type,
      'Net Cash': Number(item.total_net_cash || 0),
      Collection: Number(item.total_net_revenue_collect || 0),
      'System Payment': Number(item.total_system_payment || 0),
      Paid: Number(item.total_paid || 0),
      Remaining: Number(item.remaining_balance || 0),
      Status: item.payment_status,
    }));

    exportData.push({
      Week: '',
      'Week Date': '',
      'Owner Name': 'GRAND TOTAL',
      System: '',
      'Net Cash': totals.totalNetCash,
      Collection: totals.totalCollection,
      'System Payment': totals.totalSystemPayment,
      Paid: totals.totalPaid,
      Remaining: totals.totalRemaining,
      Status: '',
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue Report');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    saveAs(blob, `revenue-report-${new Date().toISOString()}.xlsx`);
  }

  // Unique weeks
  const uniqueWeeks = [...new Set(data.map((x) => x.week_number))];
  

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Agent revenue and collection report
            </p>
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
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
              placeholder="Search owner..."
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
            <option value="">All Weeks</option>
            {uniqueWeeks.map((week) => (
              <option key={String(week)} value={String(week)}>
                Week {week}
              </option>
            ))}
          </select>

          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">All Systems</option>
            {systems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">All Owners</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Net Cash</p>
            <p className="text-lg font-bold">{formatCurrency(totals.totalNetCash)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Collection</p>
            <p className="text-lg font-bold">{formatCurrency(totals.totalCollection)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500">System Payment</p>
            <p className="text-lg font-bold">{formatCurrency(totals.totalSystemPayment)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-xs text-gray-500">Remaining</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totals.totalRemaining)}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th className="text-left py-3 px-4 text-sm font-semibold">Week</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Week Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Owner Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">System</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Net Cash</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Collection</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">System Payment</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Paid</th>
              <th className="text-right py-3 px-4 text-sm font-semibold">Remaining</th>
              <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
             </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              <>
                {paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4">Week {item.week_number}</td>
                    <td className="py-3 px-4">
                      {new Date(item.settlement_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{item.agent?.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {item.system_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.total_net_cash)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.total_net_revenue_collect)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(item.total_system_payment)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(item.total_paid)}</td>
                    <td className="py-3 px-4 text-right text-red-600">{formatCurrency(item.remaining_balance)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.payment_status === 'FULLY_PAID' || item.payment_status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : item.payment_status === 'PARTIALLY_PAID'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.payment_status=== 'FULLY_PAID' || item.payment_status === 'PAID'
                          ? 'Paid'
                          : item.payment_status === 'PARTIALLY_PAID'
                          ? 'Partially Paid'
                          : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* GRAND TOTAL ROW */}
                <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                  <td colSpan={4} className="py-4 px-4">
                    GRAND TOTAL
                  </td>
                  <td className="py-4 px-4 text-right">{formatCurrency(totals.totalNetCash)}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(totals.totalCollection)}</td>
                  <td className="py-4 px-4 text-right">{formatCurrency(totals.totalSystemPayment)}</td>
                  <td className="py-4 px-4 text-right text-green-600">{formatCurrency(totals.totalPaid)}</td>
                  <td className="py-4 px-4 text-right text-red-600">{formatCurrency(totals.totalRemaining)}</td>
                  <td />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
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
    </div>
  );
}