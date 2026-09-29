import mongoose, { Schema, Document } from 'mongoose';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface ILog extends Document {
  service: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const logSchema = new Schema<ILog>(
  {
    service: { type: String, required: true, index: true, trim: true },
    level: {
      type: String,
      enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound index for high-throughput log querying
logSchema.index({ service: 1, level: 1, timestamp: -1 });
// Secondary index on timestamp for time-range queries
logSchema.index({ timestamp: -1 });

export const Log = mongoose.model<ILog>('Log', logSchema);
