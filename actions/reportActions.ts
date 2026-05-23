'use server';

import dbConnect from '@/lib/dbConnect';
import RevenueSettlement from '@/models/RevenueSettlement';
import Payment from '@/models/Payment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getSettlements(filters: {
  startDate?: Date | null;
  endDate?: Date | null;
  agent?: string;
  system?: string;
  paymentStatus?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  const query: any = {};

  if (filters.startDate) {
    query.settlementDate = { $gte: filters.startDate };
  }
  if (filters.endDate) {
    query.settlementDate = { ...query.settlementDate, $lte: filters.endDate };
  }
  if (filters.system && filters.system !== '') {
    query.systemType = filters.system;
  }
  if (filters.paymentStatus && filters.paymentStatus !== '') {
    query.paymentStatus = filters.paymentStatus;
  }
  if (filters.agent && filters.agent !== '') {
    const Agent = (await import('@/models/Agent')).default;
    const agents = await Agent.find({ 
      name: { $regex: filters.agent, $options: 'i' } 
    });
    const agentIds = agents.map(a => a._id);
    query.agentId = { $in: agentIds };
  }

  const settlements = await RevenueSettlement.find(query)
    .populate('agentId')
    .sort({ settlementDate: -1 })
    .lean();

  return JSON.parse(JSON.stringify(settlements));
}

export async function getPaymentHistory(settlementId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  const payments = await Payment.find({ revenueSettlementId: settlementId })
    .populate('createdBy', 'userName')
    .sort({ paymentDate: -1 })
    .lean();

  return JSON.parse(JSON.stringify(payments));
}

export async function exportSettlementsToExcel(filters: any) {
  const settlements = await getSettlements(filters);
  
  // Transform data for Excel export
  const exportData = settlements.map((s:any) => ({
    'Agent Name': s.agentId?.name || 'Unknown',
    'System': s.systemType,
    'GGR': s.totalGGR,
    'Net Revenue Collect': s.totalNetRevenueCollect,
    'System Payment': s.totalSystemPayment,
    'Total Paid': s.totalPaid,
    'Remaining Balance': s.remainingBalance,
    'Payment Status': s.paymentStatus,
    'Settlement Date': new Date(s.settlementDate).toLocaleDateString(),
    'Created At': new Date(s.createdAt).toLocaleString(),
  }));

  return exportData;
}