// components/reports/PaymentStatusChart.tsx

'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function PaymentStatusChart({
  settlements,
}: any) {
  const paid = settlements.filter(
    (x: any) =>
      x.payment_status === 'PAID'
  ).length;

  const progress = settlements.filter(
    (x: any) =>
      x.payment_status ===
      'IN_PROGRESS'
  ).length;

  const unpaid = settlements.filter(
    (x: any) =>
      x.payment_status === 'UNPAID'
  ).length;

  return (
    <div className="glass-card p-5 rounded-2xl">
      <h2 className="font-bold text-lg mb-4">
        Payment Status
      </h2>

      <Pie
        data={{
          labels: [
            'Paid',
            'In Progress',
            'Unpaid',
          ],

          datasets: [
            {
              data: [
                paid,
                progress,
                unpaid,
              ],
            },
          ],
        }}
      />
    </div>
  );
}