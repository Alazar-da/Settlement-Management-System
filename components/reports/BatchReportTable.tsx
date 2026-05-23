// components/reports/BatchReportTable.tsx

'use client';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function BatchReportTable({
  batches,
}: any) {
  function exportExcel() {
    const worksheet =
      XLSX.utils.json_to_sheet(
        batches
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Batches'
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

    const blob = new Blob(
      [excelBuffer],
      {
        type: 'application/octet-stream',
      }
    );

    saveAs(
      blob,
      'batch-report.xlsx'
    );
  }

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">
          Batch Reports
        </h2>

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-xl"
        >
          Export Excel
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">
                Week
              </th>

              <th className="text-left py-3">
                System
              </th>

              <th className="text-left py-3">
                Rows
              </th>

              <th className="text-left py-3">
                Agents
              </th>

              <th className="text-left py-3">
                GGR
              </th>

              <th className="text-left py-3">
                Expected
              </th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch: any) => (
              <tr
                key={batch.id}
                className="border-b"
              >
                <td className="py-3">
                  {
                    batch.settlement_week
                  }
                </td>

                <td className="py-3">
                  {batch.system_type}
                </td>

                <td className="py-3">
                  {batch.total_rows}
                </td>

                <td className="py-3">
                  {batch.total_agents}
                </td>

                <td className="py-3">
                  {Number(
                    batch.total_ggr
                  ).toLocaleString()}
                </td>

                <td className="py-3">
                  {Number(
                    batch.total_expected_collection
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}