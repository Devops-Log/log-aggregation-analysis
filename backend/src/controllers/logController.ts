import { Request, Response } from 'express';
import { z } from 'zod';
import { Log, LogLevel } from '../models/Log';

const createLogSchema = z.object({
  service: z.string().min(1, 'Service name is required'),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'CRITICAL']),
  message: z.string().min(1, 'Log message is required'),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().or(z.date()).optional(),
});

export const createLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createLogSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { service, level, message, metadata, timestamp } = parseResult.data;

    const newLog = await Log.create({
      service,
      level,
      message,
      metadata: metadata || {},
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    res.status(201).json(newLog);
  } catch (error: any) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to ingest log entry' });
  }
};

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const service = (req.query.service as string) || '';
    const level = (req.query.level as string) || '';

    const filter: any = {};

    if (service && service !== 'ALL') {
      filter.service = service;
    }

    if (level && level !== 'ALL') {
      filter.level = level;
    }

    if (search.trim()) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
};

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Filter for last 24h
    const logs24h = await Log.find({ timestamp: { $gte: twentyFourHoursAgo } });
    const totalLogs = logs24h.length;

    const severityCounts = {
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    let errorAndCriticalCount = 0;
    let criticalCount = 0;

    logs24h.forEach((log) => {
      if (severityCounts[log.level] !== undefined) {
        severityCounts[log.level]++;
      }
      if (log.level === 'ERROR' || log.level === 'CRITICAL') {
        errorAndCriticalCount++;
      }
      if (log.level === 'CRITICAL') {
        criticalCount++;
      }
    });

    const errorRate = totalLogs > 0 ? parseFloat(((errorAndCriticalCount / totalLogs) * 100).toFixed(1)) : 0;

    // Distinct services
    const services = await Log.distinct('service');

    // Build hourly volume timeseries for last 24 hours
    const hourlyMap: Record<string, { time: string; timestamp: number; INFO: number; WARN: number; ERROR: number; CRITICAL: number; total: number }> = {};
    const now = new Date();

    // Initialize 24 slots (one per hour)
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      const hourStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const key = d.toISOString().substring(0, 13); // "YYYY-MM-DDTHH"
      hourlyMap[key] = {
        time: hourStr,
        timestamp: d.getTime(),
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0,
        total: 0,
      };
    }

    logs24h.forEach((log) => {
      const d = new Date(log.timestamp);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString().substring(0, 13);
      if (hourlyMap[key]) {
        hourlyMap[key][log.level]++;
        hourlyMap[key].total++;
      }
    });

    const timeseries = Object.values(hourlyMap).sort((a, b) => a.timestamp - b.timestamp);

    res.json({
      totalLogs,
      errorRate,
      criticalEvents: criticalCount,
      activeServicesCount: services.length,
      services,
      severityCounts,
      timeseries,
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to calculate log metrics' });
  }
};

export const seedLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear previous logs to provide a fresh realistic snapshot
    await Log.deleteMany({});

    const templates: Array<{
      service: string;
      level: LogLevel;
      message: string;
      metadata: Record<string, any>;
    }> = [
      {
        service: 'api-gateway',
        level: 'INFO',
        message: 'HTTP GET /api/v1/users returned 200 OK in 14ms',
        metadata: { clientIp: '192.168.1.45', userAgent: 'Mozilla/5.0', responseTimeMs: 14, httpStatus: 200 },
      },
      {
        service: 'api-gateway',
        level: 'WARN',
        message: 'Rate limit threshold reached (80%) for IP 203.0.113.195',
        metadata: { clientIp: '203.0.113.195', currentRate: 85, maxRate: 100 },
      },
      {
        service: 'api-gateway',
        level: 'ERROR',
        message: 'Upstream connection timeout connecting to payment-api',
        metadata: { upstream: 'http://payment-api:8080/charge', timeoutMs: 5000, attempts: 3 },
      },
      {
        service: 'auth-service',
        level: 'INFO',
        message: 'JWT Token issued successfully for user admin@centrallog.local',
        metadata: { userId: 'usr_99a8b7c', role: 'admin', authProvider: 'local' },
      },
      {
        service: 'auth-service',
        level: 'WARN',
        message: 'Failed login attempt for user user_dev@company.io from unknown IP',
        metadata: { email: 'user_dev@company.io', clientIp: '198.51.100.42', attemptCount: 3 },
      },
      {
        service: 'auth-service',
        level: 'CRITICAL',
        message: 'Brute force login attack detected! IP 198.51.100.42 temp-banned for 30m',
        metadata: { offendingIp: '198.51.100.42', failedCount: 15, rule: 'BRUTE_FORCE_LOCKOUT' },
      },
      {
        service: 'payment-api',
        level: 'INFO',
        message: 'Stripe webhook received: payment_intent.succeeded (tx_883921)',
        metadata: { stripeId: 'pi_3Mtw2eLkdIW', amount: 14900, currency: 'usd' },
      },
      {
        service: 'payment-api',
        level: 'ERROR',
        message: 'Payment processing failed: CardDeclined (insufficient_funds)',
        metadata: { cardLast4: '4242', declineCode: 'insufficient_funds', amount: 9900 },
      },
      {
        service: 'payment-api',
        level: 'CRITICAL',
        message: 'Payment Gateway API key invalidated or rejected by provider',
        metadata: { provider: 'Stripe', errorCode: 'api_key_expired', priority: 'P1' },
      },
      {
        service: 'worker-queue',
        level: 'INFO',
        message: 'Completed email notification batch task #10492 (250 emails sent)',
        metadata: { jobId: 'job_batch_10492', queue: 'notifications', durationMs: 1240 },
      },
      {
        service: 'worker-queue',
        level: 'WARN',
        message: 'Worker thread pool utilization at 92%',
        metadata: { activeWorkers: 23, totalCapacity: 25, queueDepth: 142 },
      },
      {
        service: 'worker-queue',
        level: 'ERROR',
        message: 'Job #10495 failed after 3 retries: Connection to Redis lost',
        metadata: { jobId: 'job_batch_10495', retries: 3, errorStr: 'ECONNREFUSED 127.0.0.1:6379' },
      },
      {
        service: 'db-cluster',
        level: 'INFO',
        message: 'Replica set secondary node sync completed in 1.2s',
        metadata: { node: 'mongo-sec-02.internal', oplogLagSec: 0 },
      },
      {
        service: 'db-cluster',
        level: 'WARN',
        message: 'Slow query detected (>500ms): aggregate on logs collection',
        metadata: { executionTimeMs: 842, queryFilter: '{ service: "payment-api" }' },
      },
      {
        service: 'db-cluster',
        level: 'CRITICAL',
        message: 'Primary DB node storage capacity exceeded 90% threshold',
        metadata: { node: 'mongo-pri-01.internal', diskUsedGb: 450, diskTotalGb: 500 },
      },
    ];

    const mockLogs = [];
    const now = Date.now();

    // Generate 36 realistic logs distributed across the last 24 hours
    for (let i = 0; i < 36; i++) {
      const template = templates[i % templates.length];
      const randomMinutesAgo = Math.floor(Math.random() * (23 * 60 - 10)) + 10;
      const timestamp = new Date(now - randomMinutesAgo * 60 * 1000);

      mockLogs.push({
        service: template.service,
        level: template.level,
        message: template.message + ` [Seq #${1000 + i}]`,
        metadata: { ...template.metadata, eventSequence: 1000 + i, traceId: `trace-${Math.random().toString(36).substring(2, 9)}` },
        timestamp,
      });
    }

    await Log.insertMany(mockLogs);

    res.status(201).json({ message: 'Successfully seeded 36 mock logs across services', count: mockLogs.length });
  } catch (error: any) {
    console.error('Error seeding logs:', error);
    res.status(500).json({ error: 'Failed to seed log data' });
  }
};
