'use server';

import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import RevenueSettlement from '@/models/RevenueSettlement';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

export async function addPayment(settlementId: string, amount: number, note: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();
  
  // Validate settlement exists
  const settlement = await RevenueSettlement.findById(settlementId);
  if (!settlement) throw new Error('Settlement not found');

  // Validate payment amount
  if (amount <= 0) throw new Error('Payment amount must be greater than 0');
  if (amount > settlement.remainingBalance) {
    throw new Error('Payment amount exceeds remaining balance');
  }

  // Calculate new totals
  const totalPaid = settlement.totalPaid + amount;
  const remainingBalance = settlement.totalNetRevenueCollect - totalPaid;
  
  // Determine payment status
  let paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid' = 'Partially Paid';
  if (totalPaid >= settlement.totalNetRevenueCollect) {
    paymentStatus = 'Fully Paid';
  } else if (totalPaid === 0) {
    paymentStatus = 'Unpaid';
  }

  // Get user ID
  const user = await User.findOne({ userName: session.user.name });
  if (!user) throw new Error('User not found');

  // Create payment record
  const payment = await Payment.create({
    revenueSettlementId: new mongoose.Types.ObjectId(settlementId),
    amount,
    paymentDate: new Date(),
    note: note || '',
    createdBy: user._id,
  });

  // Update settlement
  await RevenueSettlement.findByIdAndUpdate(settlementId, {
    totalPaid,
    remainingBalance,
    paymentStatus,
  });

  revalidatePath('/reports');
  revalidatePath('/admin/dashboard');

  return { 
    success: true, 
    payment: {
      id: payment._id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      note: payment.note,
    },
    settlement: {
      totalPaid,
      remainingBalance,
      paymentStatus,
    }
  };
}

export async function getPaymentHistory(settlementId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  // Get all payments for this settlement
  const payments = await Payment.find({ 
    revenueSettlementId: new mongoose.Types.ObjectId(settlementId) 
  })
    .populate('createdBy', 'userName')
    .sort({ paymentDate: -1 })
    .lean();

  // Get settlement details for context
  const settlement = await RevenueSettlement.findById(settlementId)
    .populate('agentId', 'name systemType')
    .lean();

  // Calculate summary statistics
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentCount = payments.length;
  const averagePayment = paymentCount > 0 ? totalPaid / paymentCount : 0;
  
  // Group payments by month for chart data
  const paymentsByMonth: { [key: string]: number } = {};
  payments.forEach(payment => {
    const date = new Date(payment.paymentDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    paymentsByMonth[monthKey] = (paymentsByMonth[monthKey] || 0) + payment.amount;
  });

  const monthlyData = Object.entries(paymentsByMonth).map(([month, amount]) => ({
    month,
    amount,
  })).sort((a, b) => a.month.localeCompare(b.month));

  return {
    payments: JSON.parse(JSON.stringify(payments)),
    settlement: settlement ? {
      id: settlement._id,
      agentName: (settlement.agentId as any)?.name,
      systemType: settlement.systemType,
      totalDue: settlement.totalNetRevenueCollect,
      totalPaid: settlement.totalPaid,
      remainingBalance: settlement.remainingBalance,
      paymentStatus: settlement.paymentStatus,
    } : null,
    summary: {
      totalPaid,
      paymentCount,
      averagePayment,
      lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null,
    },
    monthlyData,
  };
}

export async function getSettlementPaymentSummary(settlementId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  const settlement = await RevenueSettlement.findById(settlementId)
    .populate('agentId', 'name systemType')
    .lean();

  if (!settlement) throw new Error('Settlement not found');

  const payments = await Payment.find({ 
    revenueSettlementId: new mongoose.Types.ObjectId(settlementId) 
  })
    .sort({ paymentDate: -1 })
    .lean();

  return {
    settlement: {
      id: settlement._id,
      agentName: (settlement.agentId as any)?.name,
      systemType: settlement.systemType,
      totalGGR: settlement.totalGGR,
      netRevenue: settlement.totalNetRevenueCollect,
      systemPayment: settlement.totalSystemPayment,
      totalPaid: settlement.totalPaid,
      remainingBalance: settlement.remainingBalance,
      paymentStatus: settlement.paymentStatus,
      settlementDate: settlement.settlementDate,
    },
    payments: payments.map(p => ({
      id: p._id,
      amount: p.amount,
      date: p.paymentDate,
      note: p.note,
    })),
    summary: {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      averagePayment: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
      lastPaymentDate: payments.length > 0 ? payments[0].paymentDate : null,
      fullyPaid: settlement.totalPaid >= settlement.totalNetRevenueCollect,
    },
  };
}

export async function deletePayment(paymentId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  // Find payment
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  // Update settlement
  const settlement = await RevenueSettlement.findById(payment.revenueSettlementId);
  if (!settlement) throw new Error('Settlement not found');

  const newTotalPaid = settlement.totalPaid - payment.amount;
  const newRemainingBalance = settlement.totalNetRevenueCollect - newTotalPaid;
  
  let paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid' = 'Partially Paid';
  if (newTotalPaid >= settlement.totalNetRevenueCollect) {
    paymentStatus = 'Fully Paid';
  } else if (newTotalPaid === 0) {
    paymentStatus = 'Unpaid';
  }

  await RevenueSettlement.findByIdAndUpdate(payment.revenueSettlementId, {
    totalPaid: newTotalPaid,
    remainingBalance: newRemainingBalance,
    paymentStatus,
  });

  // Delete payment
  await Payment.findByIdAndDelete(paymentId);

  revalidatePath('/reports');
  revalidatePath('/admin/dashboard');

  return { success: true };
}

export async function updatePaymentNote(paymentId: string, note: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');

  await dbConnect();

  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { note },
    { new: true }
  );

  if (!payment) throw new Error('Payment not found');

  revalidatePath('/reports');

  return { success: true, payment };
}