'use client';
import { useEffect, useState } from 'react';
import DashboardStats from '@/components/admin/DashboardStats';
import AgentSettlementTable from '@/components/admin/AgentSettlementTable';
import UploadedBatchTable from '@/components/admin/UploadedBatchTable';
import { FiUpload } from 'react-icons/fi';
import UploadSettlementModal from '@/components/admin/UploadSettlementModal';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAgentSettlementModal, setShowAgentSettlementModal] = useState(false);


   
const [stats, setStats] = useState({
  totalRevenue: 0,
  totalAgents: 0,
  totalUnpaid: 0,
});

useEffect(() => {
  fetchDashboardStats();
}, []);

async function fetchDashboardStats() {
  try {
    // settlements
    const { data: settlements, error } =
      await supabase
        .from('revenue_settlements')
        .select(`
          *,
          agents(id)
        `);

    if (error) {
      console.log(error);
      return;
    }

    const agentData =
       await supabase
        .from('agents')
        .select(`
          * 
        `);

    const settlementData =
      settlements || [];

    // total revenue
    const totalRevenue =
      settlementData.reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_paid|| 0
          ),
        0
      );

    // total paid
    const totalPaid =
      settlementData.reduce(
        (sum, item) =>
          sum +
          Number(item.total_paid.toFixed(2) || 0),
        0
      );

  // agents count
    const agentCount = agentData.data?.length || 0; 

    // unpaid count
    const totalUnpaid =
      settlementData.reduce(
        (sum, item) =>
          sum +
          Number(item.remaining_balance.toFixed(2) || 0),
        0
      );

    setStats({
      totalRevenue,

      totalAgents:
        agentCount,

      totalUnpaid,
    });
  } catch (err) {
    console.log(err);
  }
}

const handleAgentSettlementModal=(batch: any) =>{ 
  setSelectedBatch(batch);
  setShowAgentSettlementModal(true);
}


  return (
    <div className="flex flex-col gap-6">
       {   
          !showAgentSettlementModal && 
      (
      <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back!</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your settlements today.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          <FiUpload className="w-4 h-4" />
          <span>Upload Settlement</span>
        </button>
      </div>

     <DashboardStats
  stats={{
    totalRevenue: stats.totalRevenue,
    totalAgents: stats.totalAgents,
    totalUnpaid: stats.totalUnpaid,
  }}
/>
</>
      )
     
}
        <div className="space-y-6">
       {   
          !showAgentSettlementModal &&   <UploadedBatchTable onView={handleAgentSettlementModal} />
       }
      {selectedBatch && showAgentSettlementModal && (
        <AgentSettlementTable batchId={selectedBatch.id} onBack={() => setShowAgentSettlementModal(false)} />
      )}
    </div>
    {/* Upload Modal */}
      <UploadSettlementModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={fetchDashboardStats}
      />

    </div>
  );
}