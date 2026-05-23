// components/reports/RevenueTrendChart.tsx

'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function RevenueTrendChart({
  batches,
}: any) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <h2 className="font-bold text-lg mb-4">
        Revenue Trend
      </h2>

      <Line
        data={{
          labels: batches.map(
            (b: any) =>
              b.settlement_week
          ),

          datasets: [
            {
              label:
                'Expected Collection',

              data: batches.map(
                (b: any) =>
                  b.total_expected_collection
              ),
            },
          ],
        }}
      />
    </div>
  );
}