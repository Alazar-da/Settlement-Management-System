'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import {
  FiDownload,
  FiSearch,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiPrinter,
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
    setCurrentPage(1);
  }, [selectedWeek, selectedAgent, selectedSystem, search]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: settlements, error } = await supabase
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

      const sorted = (processed || []).sort((a, b) => {
        const dateA = new Date(a.batch?.settlement_week || a.settlement_date).getTime();
        const dateB = new Date(b.batch?.settlement_week || b.settlement_date).getTime();
        return dateB - dateA;
      });

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

  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const grandTotal = filteredData.reduce((sum, item) => sum + Number(item.cashier_amount || 0), 0);

  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Group data by owner
  const getOwnerTotals = () => {
    const ownerMap = new Map();
    filteredData.forEach((item) => {
      const ownerName = item.agent?.name || 'Unknown';
      ownerMap.set(ownerName, (ownerMap.get(ownerName) || 0) + Number(item.cashier_amount || 0));
    });
    return Array.from(ownerMap.entries()).map(([name, total]) => ({ name, total }));
  };

  // Group data by system
  const getSystemTotals = () => {
    const systemMap = new Map();
    filteredData.forEach((item) => {
      const systemName = item.system_type || 'Unknown';
      systemMap.set(systemName, (systemMap.get(systemName) || 0) + Number(item.cashier_amount || 0));
    });
    return Array.from(systemMap.entries()).map(([name, total]) => ({ name, total }));
  };

  // Group cashiers with their amounts
  const getCashierDetails = () => {
    const cashierMap = new Map();
    filteredData.forEach((item) => {
      const cashierName = item.cashier?.name || 'Unknown';
      cashierMap.set(cashierName, (cashierMap.get(cashierName) || 0) + Number(item.cashier_amount || 0));
    });
    return Array.from(cashierMap.entries()).map(([name, total]) => ({ name, total }));
  };

  // Export Excel with new format
// Export Formatted Excel with hierarchy
const exportFormattedExcel = () => {
  try {
    const exportData: any[] = [];

    // Report title
    exportData.push({
      A: 'CASHIER SETTLEMENT REPORT',
      B: '',
    });

    exportData.push({
      A: `Generated: ${new Date().toLocaleString()}`,
      B: '',
    });

    exportData.push({ A: '', B: '' });

    // Table Header
    exportData.push({
      A: 'Owner Name',
      B: 'Grand Total',
    });

    // Group by Agent
    const agentGroups = new Map();

    filteredData.forEach((item) => {
      const agentName = item.agent?.name || 'Unknown Agent';

      if (!agentGroups.has(agentName)) {
        agentGroups.set(agentName, []);
      }

      agentGroups.get(agentName).push({
        system: item.system_type,
        cashier: item.cashier?.name,
        amount: Number(item.cashier_amount || 0),
      });
    });

    let grandTotalCalc = 0;

    // Sort agents alphabetically
    const agentEntries = Array.from(agentGroups.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );

    agentEntries.forEach(([agentName, items]: [string, any], index) => {
      const agentTotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      grandTotalCalc += agentTotal;

      // Owner Row
      exportData.push({
        A: agentName,
        B: agentTotal,
      });

      // Group by system
      const systemGroups = new Map();

      items.forEach((item: any) => {
        const systemName = item.system || 'Unknown';

        if (!systemGroups.has(systemName)) {
          systemGroups.set(systemName, {
            total: 0,
            cashiers: [],
          });
        }

        systemGroups.get(systemName).total += item.amount;
        systemGroups.get(systemName).cashiers.push({
          name: item.cashier,
          amount: item.amount,
        });
      });

      // Sort systems alphabetically
      const systemEntries = Array.from(systemGroups.entries()).sort((a, b) => 
        a[0].localeCompare(b[0])
      );

      // Systems & Cashiers
      systemEntries.forEach(([systemName, systemData]: [string, any]) => {
        exportData.push({
          A: `  ${systemName}`,
          B: systemData.total,
        });

        // Sort cashiers alphabetically within each system
        const sortedCashiers = systemData.cashiers.sort((a: any, b: any) => 
          (a.name || '').localeCompare(b.name || '')
        );

        sortedCashiers.forEach((cashier: any) => {
          exportData.push({
            A: `    ${cashier.name}`,
            B: cashier.amount,
          });
        });
      });

      // Agent Total
      exportData.push({
        A: `${agentName} TOTAL`,
        B: agentTotal,
      });

      if (index < agentEntries.length - 1) {
        exportData.push({
          A: '',
          B: '',
        });
      }
    });

    // Final Grand Total
    exportData.push({
      A: '',
      B: '',
    });

    exportData.push({
      A: 'GRAND TOTAL',
      B: grandTotalCalc,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      skipHeader: true,
    });

    worksheet['!cols'] = [
      { wch: 40 },
      { wch: 20 },
    ];

    const range = XLSX.utils.decode_range(
      worksheet['!ref'] || 'A1:B1'
    );

    for (let row = range.s.r; row <= range.e.r; row++) {
      const label = worksheet[`A${row + 1}`]?.v?.toString() || '';

      const isTitle = row === 0;
      const isGenerated = row === 1;
      const isHeader = row === 3;

      const isSystemRow = label.startsWith('  ') && !label.startsWith('    ');
      const isCashierRow = label.startsWith('    ');
      const isTotalRow = label.includes('TOTAL') || label === 'GRAND TOTAL';
      const isOwnerRow =
        !isTitle &&
        !isGenerated &&
        !isHeader &&
        !isSystemRow &&
        !isCashierRow &&
        !isTotalRow &&
        label !== '';

      for (let col = 0; col <= 1; col++) {
        const cellRef = XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

        if (!worksheet[cellRef]) continue;

        let bgColor = 'D9E2F3';
        let fontColor = '2F5597';
        let bold = true;
        let fontSize = 14;

        if (isHeader) {
          bgColor = 'A9B9D3';
          fontColor = '2F5597';
          bold = true;
          fontSize = 18;
        } else if (isOwnerRow) {
          bold = true;
          fontColor = '000000';
          fontSize = 16;
        } else if (isTotalRow) {
          bold = true;
          fontColor = '2F5597';
          fontSize = 16;
        }

        worksheet[cellRef].s = {
          font: {
            bold: true,
            sz:
              col === 1 && !isHeader && !isOwnerRow && !isTotalRow
                ? 12 // Amount column always 12
                : isHeader
                ? 18
                : isOwnerRow || isTotalRow
                ? 16
                : 14,
            color: {
              rgb: isOwnerRow ? '000000' : '2F5597',
            },
          },
          fill: {
            patternType: 'solid',
            fgColor: {
              rgb: col === 0 ? 'AFC4E8' : 'D9E2F3',
            },
          },
          alignment: {
            vertical: 'center',
            horizontal: col === 1 ? 'right' : 'left',
          },
          border: {
            top: {
              style: 'thin',
              color: { rgb: '000000' },
            },
            bottom: {
              style: 'thin',
              color: { rgb: '000000' },
            },
            left: {
              style: 'thin',
              color: { rgb: '000000' },
            },
            right: {
              style: 'thin',
              color: { rgb: '000000' },
            },
          },
        };
      }
    }

    // Format amount column
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellRef = XLSX.utils.encode_cell({
        r: row,
        c: 1,
      });

      if (
        worksheet[cellRef] &&
        typeof worksheet[cellRef].v === 'number'
      ) {
        worksheet[cellRef].z = '#,##0.00';
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Cashier Report'
    );

    XLSX.writeFile(
      workbook,
      `cashier-report-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );

    toast.success('Formatted Excel exported');
  } catch (error) {
    console.error(error);
    toast.error('Failed to export excel');
  }
};

  // Export standard Excel (original format)
  const exportStandardExcel = () => {
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
      XLSX.writeFile(workbook, `cashier-report-standard-${new Date().toISOString()}.xlsx`);
      toast.success('Standard Excel exported');
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

          <div className="flex sm:flex-row flex-col gap-2">
            <button
              onClick={exportStandardExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              <span>Export Standard</span>
            </button>
            <button
              onClick={exportFormattedExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FiPrinter className="w-4 h-4" />
              <span>Export Formatted</span>
            </button>
          </div>
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