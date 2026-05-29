// app/reports/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import KPISection from '@/components/reports/KPISection';
import RevenueTrendChart from '@/components/reports/RevenueTrendChart';
import PaymentStatusChart from '@/components/reports/PaymentStatusChart';
import SystemComparisonChart from '@/components/reports/SystemComparisonChart';
import CachierSettlementReport from '@/components/reports/CashierSettlementReport';
import RevenueReportTable from '@/components/reports/RevenueReportTable';
import BatchReportTable from '@/components/reports/BatchReportTable';
import TopAgentsTable from '@/components/reports/TopAgentsTable';
import PaymentsTable from '@/components/reports/PaymentsTable';

export default function ReportsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  console.log('Settlements:', settlements);

  async function fetchReports() {
    const { data: settlementsData } =
      await supabase
        .from('revenue_settlements')
        .select(`
          *,
          agents(name)
        `);

        const { data: agentsData } =
      await supabase
        .from('agents')
        .select('*');

    const { data: batchesData } =
      await supabase
        .from('upload_batches')
        .select('*')
        .order('settlement_week');

    const { data: paymentsData } =
      await supabase
        .from('payments')
        .select(`
          *,
          revenue_settlements(
            *,
            agents(name)
          )
        `)
        .order('payment_date', {
          ascending: false,
        });

    setSettlements(settlementsData || []);
    setAgents(agentsData || []);
    setBatches(batchesData || []);
    setPayments(paymentsData || []);
  }

  return (
    <div className="space-y-6 p-6">
      <KPISection settlements={settlements} agents={agents} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart settlements={settlements} />

        <PaymentStatusChart
          settlements={settlements}
        />
      </div>

      <SystemComparisonChart
        settlements={settlements} batches={batches} />
    

      <CachierSettlementReport />

      <RevenueReportTable />

{/*       <BatchReportTable
        batches={batches}
        settlements={settlements}
      />

      <TopAgentsTable
        settlements={settlements}
      />

      <PaymentsTable payments={payments} /> */}
    </div>
  );
}