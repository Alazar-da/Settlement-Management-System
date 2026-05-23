// components/reports/SystemComparisonChart.tsx

'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function SystemComparisonChart({
  settlements,
}: any) {
  const kiron =
    settlements.filter(
      (x: any) =>
        x.system_type === 'KIRON2'
    );

  const alpha =
    settlements.filter(
      (x: any) =>
        x.system_type === 'ALPHA'
    );

  return (
    <div className="glass-card p-5 rounded-2xl">
      <h2 className="font-bold text-lg mb-4">
        System Comparison
      </h2>

      <Bar
        data={{
          labels: ['KIRON2', 'ALPHA'],

          datasets: [
            {
              label: 'Revenue',

              data: [
                kiron.reduce(
                  (
                    s: number,
                    x: any
                  ) =>
                    s +
                    Number(
                      x.total_net_revenue_collect
                    ),
                  0
                ),

                alpha.reduce(
                  (
                    s: number,
                    x: any
                  ) =>
                    s +
                    Number(
                      x.total_net_revenue_collect
                    ),
                  0
                ),
              ],
            },
          ],
        }}
      />
    </div>
  );
}