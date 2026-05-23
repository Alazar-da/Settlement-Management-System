'use server';

import connectDB from '@/DB/connectDB';
import RevenueSettlement from '@/models/RevenueSettlement';
import Payment from '@/models/Payment';
import UploadBatch from '@/models/UploadBatch';
import Agent from '@/models/Agent';

export async function getDashboardStats() {

  await connectDB();

  // Get all settlements
  const settlements = await RevenueSettlement.find()
    .populate('agentId')
    .sort({ createdAt: -1 });

  // Calculate totals
  const totalRevenue = settlements.reduce((sum, s) => sum + s.totalNetRevenueCollect, 0);
  const totalGGR = settlements.reduce((sum, s) => sum + s.totalGGR, 0);
  const pendingPayments = settlements.reduce((sum, s) => sum + s.remainingBalance, 0);

  // Payment status counts
  const fullyPaidAgents = settlements.filter(s => s.paymentStatus === 'Fully Paid').length;
  const unpaidAgents = settlements.filter(s => s.paymentStatus === 'Unpaid').length;
  const partialPayments = settlements.filter(s => s.paymentStatus === 'Partially Paid').length;

  // Revenue trends (last 6 weeks)
  const revenueTrends = await RevenueSettlement.aggregate([
    {
      $group: {
        _id: { $week: '$settlementDate' },
        totalRevenue: { $sum: '$totalNetRevenueCollect' },
        totalGGR: { $sum: '$totalGGR' },
        week: { $first: '$settlementDate' }
      }
    },
    { $sort: { '_id': -1 } },
    { $limit: 6 },
    { $sort: { '_id': 1 } }
  ]);

  // System comparison
  const systemComparison = await RevenueSettlement.aggregate([
    {
      $group: {
        _id: '$systemType',
        revenue: { $sum: '$totalNetRevenueCollect' },
        ggr: { $sum: '$totalGGR' },
        collections: { $sum: '$totalPaid' }
      }
    }
  ]);

  // Top performing agents
  const topAgents = await RevenueSettlement.aggregate([
    {
      $group: {
        _id: '$agentId',
        totalRevenue: { $sum: '$totalNetRevenueCollect' },
        totalGGR: { $sum: '$totalGGR' },
        totalPaid: { $sum: '$totalPaid' },
        paymentStatus: { $first: '$paymentStatus' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'agents',
        localField: '_id',
        foreignField: '_id',
        as: 'agent'
      }
    },
    { $unwind: '$agent' }
  ]);

  // Recent activities
  const recentUploads = await UploadBatch.find()
    .sort({ createdAt: -1 })
    .limit(3);

  const recentPayments = await Payment.find()
    .populate('revenueSettlementId')
    .sort({ createdAt: -1 })
    .limit(3);

  const recentActivities = [
    ...recentUploads.map(u => ({
      id: u._id.toString(),
      type: 'upload',
      title: 'Settlement Uploaded',
      description: `${u.systemType} settlement for week ${new Date(u.settlementWeek).toLocaleDateString()}`,
      timestamp: u.createdAt,
      status: 'success'
    })),
    ...recentPayments.map(p => ({
      id: p._id.toString(),
      type: 'payment',
      title: 'Payment Received',
      description: `Payment of $${p.amount.toLocaleString()} recorded`,
      amount: p.amount,
      timestamp: p.createdAt,
      status: 'success'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 5);

  // Payment status data for pie chart
  const paymentStatusData = [
    { status: 'Fully Paid', value: fullyPaidAgents, color: '#10b981' },
    { status: 'Partially Paid', value: partialPayments, color: '#f59e0b' },
    { status: 'Unpaid', value: unpaidAgents, color: '#ef4444' },
  ];

  return {
    totalRevenue,
    totalGGR,
    pendingPayments,
    fullyPaidAgents,
    unpaidAgents,
    partialPayments,
    revenueTrends: revenueTrends.map(t => ({
      week: `Week ${t._id}`,
      revenue: t.totalRevenue,
      ggr: t.totalGGR,
      collections: settlements.filter(s => s.settlementDate.getTime() === t.week?.getTime())
        .reduce((sum, s) => sum + s.totalPaid, 0)
    })),
    systemComparison: systemComparison.map(s => ({
      system: s._id,
      revenue: s.revenue,
      ggr: s.ggr,
      collections: s.collections
    })),
    topAgents: topAgents.map((a, index) => ({
      name: a.agent.name,
      system: a.agent.systemType,
      revenue: a.totalRevenue,
      ggr: a.totalGGR,
      paymentStatus: a.paymentStatus,
      collectionRate: a.totalRevenue > 0 ? (a.totalPaid / a.totalRevenue) * 100 : 0,
      rank: index + 1
    })),
    recentActivities,
    paymentStatusData
  };
}