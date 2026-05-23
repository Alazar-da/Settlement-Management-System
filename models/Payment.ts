import mongoose from 'mongoose';

export interface IPayment {
  revenueSettlementId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  note: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>({
  revenueSettlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RevenueSettlement',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  note: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);