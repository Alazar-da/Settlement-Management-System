import mongoose from 'mongoose';

export interface IUploadBatch {
  systemType: 'Alpha' | 'Kiron2';
  uploadedFileName: string;
  commissionPercent: number;
  systemPaymentPercent: number;
  settlementWeek: Date;
  createdAt: Date;
  originalFileData?: any;
}

const UploadBatchSchema = new mongoose.Schema<IUploadBatch>({
  systemType: {
    type: String,
    enum: ['Alpha', 'Kiron2'],
    required: true,
  },
  uploadedFileName: {
    type: String,
    required: true,
  },
  commissionPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  systemPaymentPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  settlementWeek: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  originalFileData: {
    type: mongoose.Schema.Types.Mixed,
  },
});

export default mongoose.models.UploadBatch || mongoose.model<IUploadBatch>('UploadBatch', UploadBatchSchema);