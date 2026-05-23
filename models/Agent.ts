import mongoose from 'mongoose';

export interface IAgent {
  name: string;
  systemType: 'Alpha' | 'Kiron2';
  createdAt: Date;
}

const AgentSchema = new mongoose.Schema<IAgent>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  systemType: {
    type: String,
    enum: ['Alpha', 'Kiron2'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AgentSchema.index({ name: 1, systemType: 1 }, { unique: true });

export default mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);