'use client';
import { useState } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import UploadSettlementCard from '@/components/admin/UploadSettlementCard';
import AgentSettlementTable from '@/components/admin/AgentSettlementTable';
import UploadedBatchTable from '@/components/admin/UploadedBatchTable';

export default function DashboardPage() {
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
  return (
    <div className="space-y-6">
{/*       <DashboardStats
  stats={{
    totalRevenue: stats.totalRevenue,
    totalAgents: stats.totalAgents,
    pendingPayments: stats.pendingPayments,
    collectionRate: stats.collectionRate,
    fullyPaid: stats.fullyPaid,
    unpaid: stats.unpaid,
  }}
/> */}

      <UploadSettlementCard />

        <div className="space-y-6">
      <UploadedBatchTable onView={setSelectedBatch} />

      {selectedBatch && (
        <AgentSettlementTable batchId={selectedBatch.id} />
      )}
    </div>
    </div>
  );
}