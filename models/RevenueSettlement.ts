import mongoose from 'mongoose';

export interface IRevenueSettlement {
  agentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  systemType: 'Alpha' | 'Kiron2';
  totalGGR: number;
  totalNetRevenueCollect: number;
  totalSystemPayment: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid';
  settlementDate: Date;
  createdAt: Date;
}

const RevenueSettlementSchema = new mongoose.Schema<IRevenueSettlement>({
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadBatch',
    required: true,
  },
  systemType: {
    type: String,
    enum: ['Alpha', 'Kiron2'],
    required: true,
  },
  totalGGR: {
    type: Number,
    required: true,
    default: 0,
  },
  totalNetRevenueCollect: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSystemPayment: {
    type: Number,
    required: true,
    default: 0,
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  remainingBalance: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['Fully Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid',
  },
  settlementDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RevenueSettlementSchema.index({ agentId: 1, batchId: 1 }, { unique: true });

export default mongoose.models.RevenueSettlement || mongoose.model<IRevenueSettlement>('RevenueSettlement', RevenueSettlementSchema);