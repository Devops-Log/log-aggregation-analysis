import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Log, LogLevel } from '../models/Log';

dotenv.config();

const SERVICES = [
  'auth-service',
  'gateway-service',
  'payment-api',
  'billing-worker',
  'user-cache',
];

const SAMPLE_LOG_TEMPLATES: Record<string, Array<{ level: LogLevel; message: string; path?: string; statusCode?: number }>> = {
  'auth-service': [
    { level: 'INFO', message: 'User login successful', path: '/api/v1/auth/login', statusCode: 200 },
    { level: 'INFO', message: 'JWT authentication token refreshed', path: '/api/v1/auth/refresh', statusCode: 200 },
    { level: 'INFO', message: 'User password reset requested', path: '/api/v1/auth/reset-password', statusCode: 200 },
    { level: 'WARN', message: 'Failed login attempt for user@example.com (Invalid credentials)', path: '/api/v1/auth/login', statusCode: 401 },
    { level: 'WARN', message: 'High latency detected in identity provider handshake', path: '/api/v1/auth/oauth', statusCode: 200 },
    { level: 'ERROR', message: 'OAuth provider token validation failed: Connection timeout', path: '/api/v1/auth/oauth/callback', statusCode: 502 },
    { level: 'ERROR', message: 'Failed to dispatch password reset email via SMTP', path: '/api/v1/auth/reset-password', statusCode: 500 },
    { level: 'CRITICAL', message: 'Auth database connection pool exhausted', path: '/api/v1/auth/login', statusCode: 503 },
    { level: 'CRITICAL', message: 'Brute-force login attack detected from IP 192.168.1.102', path: '/api/v1/auth/login', statusCode: 429 },
  ],
  'gateway-service': [
    { level: 'INFO', message: 'HTTP GET /api/v1/logs executed successfully', path: '/api/v1/logs', statusCode: 200 },
    { level: 'INFO', message: 'HTTP POST /api/v1/auth/login proxied to upstream', path: '/api/v1/auth/login', statusCode: 200 },
    { level: 'INFO', message: 'Health check probe passed', path: '/health', statusCode: 200 },
    { level: 'WARN', message: 'Rate limit threshold reached for IP client', path: '/api/v1/logs', statusCode: 429 },
    { level: 'WARN', message: 'Request body payload approaching maximum 10MB limit', path: '/api/v1/logs/batch', statusCode: 200 },
    { level: 'ERROR', message: 'Upstream payment-api returned HTTP 502 Bad Gateway', path: '/api/v1/payments/charge', statusCode: 502 },
    { level: 'ERROR', message: 'CORS header validation error for origin untrusted.com', path: '/api/v1/users', statusCode: 403 },
    { level: 'CRITICAL', message: 'API Gateway buffer overflow: 5000 requests in queue', path: '/api/v1/logs', statusCode: 503 },
  ],
  'payment-api': [
    { level: 'INFO', message: 'Payment intent created successfully ($49.99)', path: '/api/v1/payments/intent', statusCode: 201 },
    { level: 'INFO', message: 'Stripe webhook payment_intent.succeeded processed', path: '/api/v1/payments/webhook', statusCode: 200 },
    { level: 'INFO', message: 'Refund initiated for transaction tx_8912304', path: '/api/v1/payments/refund', statusCode: 200 },
    { level: 'WARN', message: 'Payment gateway API response time exceeded 800ms threshold', path: '/api/v1/payments/charge', statusCode: 200 },
    { level: 'WARN', message: 'Payment retry attempt 2 triggered for transaction tx_991283', path: '/api/v1/payments/retry', statusCode: 200 },
    { level: 'ERROR', message: 'Credit card charge failed: Card declined (Insufficient funds)', path: '/api/v1/payments/charge', statusCode: 400 },
    { level: 'ERROR', message: 'Merchant payment gateway API key expired', path: '/api/v1/payments/charge', statusCode: 500 },
    { level: 'CRITICAL', message: 'Double spending detection triggered for user_3910', path: '/api/v1/payments/charge', statusCode: 409 },
  ],
  'billing-worker': [
    { level: 'INFO', message: 'Monthly recurring subscription renewal batch finished (450 users)', path: '/jobs/subscriptions', statusCode: 200 },
    { level: 'INFO', message: 'Invoice PDF generated #INV-2026-0812', path: '/jobs/invoices', statusCode: 200 },
    { level: 'WARN', message: 'Receipt email delivery delayed for invoice #INV-2026-0810', path: '/jobs/invoices', statusCode: 200 },
    { level: 'WARN', message: 'Tax calculation fallback invoked due to external API timeout', path: '/jobs/tax-calc', statusCode: 200 },
    { level: 'ERROR', message: 'Tax service API rate limit exceeded during batch processing', path: '/jobs/tax-calc', statusCode: 429 },
    { level: 'ERROR', message: 'Failed to update user subscription status in DB for sub_7712', path: '/jobs/subscriptions', statusCode: 500 },
    { level: 'CRITICAL', message: 'Billing queue worker crashed: Memory leak in PDF generator', path: '/jobs/worker', statusCode: 500 },
  ],
  'user-cache': [
    { level: 'INFO', message: 'Redis cache warm-up completed: 2500 keys initialized', path: '/cache/warmup', statusCode: 200 },
    { level: 'INFO', message: 'Cache hit ratio at 94.2% over last 60 minutes', path: '/cache/stats', statusCode: 200 },
    { level: 'WARN', message: 'Redis memory usage reached 82% threshold', path: '/cache/health', statusCode: 200 },
    { level: 'WARN', message: 'LRU key eviction spike: 120 keys evicted in 1 second', path: '/cache/evict', statusCode: 200 },
    { level: 'ERROR', message: 'Redis connection refused on redis.internal:6379', path: '/cache/query', statusCode: 500 },
    { level: 'ERROR', message: 'Cache serialization error for key user:session:99812', path: '/cache/set', statusCode: 500 },
    { level: 'CRITICAL', message: 'Redis cluster split-brain condition detected across nodes', path: '/cache/cluster', statusCode: 503 },
  ],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTraceId(): string {
  return `tr-${Math.random().toString(36).substring(2, 11)}`;
}

export const seedDatabase = async (dropExisting: boolean = true): Promise<void> => {
  console.log('[Seeder] Starting database seeding process...');

  if (dropExisting) {
    console.log('[Seeder] Dropping existing database collections...');
    await User.deleteMany({});
    await Log.deleteMany({});
  }

  // 1. Seed Default Admin User
  console.log('[Seeder] Seeding default admin user...');
  const adminEmail = 'admin@centrallog.local';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: 'DevOps Lead',
      email: adminEmail,
      password: 'password123',
      role: 'admin',
    });
    console.log(`[Seeder] Default admin created: ${adminEmail} / password123`);
  } else {
    console.log(`[Seeder] Default admin already exists: ${adminEmail}`);
  }

  // 2. Generate 60+ Realistic Logs across 5 services spanning past 48 hours
  console.log('[Seeder] Generating 60+ realistic log documents...');
  const logsToInsert: Array<{
    service: string;
    level: LogLevel;
    message: string;
    metadata: Record<string, any>;
    timestamp: Date;
  }> = [];

  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  // Generate 12-15 logs per service (Total ~65 logs)
  for (const service of SERVICES) {
    const templates = SAMPLE_LOG_TEMPLATES[service];
    const logCountForService = 12 + Math.floor(Math.random() * 4); // 12 to 15 entries per service

    for (let i = 0; i < logCountForService; i++) {
      const template = randomItem(templates);
      const randomOffsetMs = Math.floor(Math.random() * fortyEightHoursMs);
      const timestamp = new Date(now - randomOffsetMs);
      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];

      logsToInsert.push({
        service,
        level: template.level,
        message: template.message,
        metadata: {
          traceId: generateTraceId(),
          httpMethod: randomItem(httpMethods),
          path: template.path || '/api/v1/resource',
          statusCode: template.statusCode || 200,
          responseTimeMs: Math.floor(Math.random() * 450) + 12,
          clientIp: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
          environment: 'production',
          host: `pod-${service}-${Math.floor(Math.random() * 3) + 1}`,
          userId: `usr_${Math.floor(Math.random() * 9000) + 1000}`,
        },
        timestamp,
      });
    }
  }

  // Sort logs by timestamp ascending for clean insertion
  logsToInsert.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  await Log.insertMany(logsToInsert);
  console.log(`[Seeder] Successfully seeded ${logsToInsert.length} log documents across 5 services.`);
  console.log('[Seeder] Database seeding completed successfully.');
};

// Standalone execution entrypoint
if (require.main === module || process.argv[1]?.replace(/\\/g, '/').endsWith('config/seed.ts')) {
  (async () => {
    try {
      const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/centrallog';
      console.log(`[Seeder] Connecting to MongoDB at ${connStr}...`);
      await mongoose.connect(connStr);
      await seedDatabase(true);
      await mongoose.disconnect();
      console.log('[Seeder] Connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Seeder] Error executing database seed script:', err);
      process.exit(1);
    }
  })();
}
