import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useTheme } from '../context/ThemeContext';
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LogItem {
  _id: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface MetricsData {
  totalLogs: number;
  errorRate: number;
  criticalEvents: number;
  activeServicesCount: number;
  services: string[];
  severityCounts: {
    INFO: number;
    WARN: number;
    ERROR: number;
    CRITICAL: number;
  };
  timeseries: Array<{
    time: string;
    INFO: number;
    WARN: number;
    ERROR: number;
    CRITICAL: number;
    total: number;
  }>;
}

interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 15,
  });

  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(
    null,
  );

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);

    try {
      const response = await fetch(`${API_BASE_URL}/logs/metrics`);

      if (!response.ok) {
        throw new Error('Unable to retrieve dashboard metrics.');
      }

      const data: MetricsData = await response.json();
      setMetrics(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve dashboard metrics.',
      );
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);

    try {
      const queryParameters = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        search: searchTerm,
        service: selectedService,
        level: selectedLevel,
      });

      const response = await fetch(
        `${API_BASE_URL}/logs?${queryParameters.toString()}`,
      );

      if (!response.ok) {
        throw new Error('Unable to retrieve log records.');
      }

      const data: {
        logs: LogItem[];
        pagination: PaginationData;
      } = await response.json();

      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve log records.',
      );
    } finally {
      setLoadingLogs(false);
    }
  }, [
    currentPage,
    searchTerm,
    selectedService,
    selectedLevel,
  ]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = async () => {
    setError(null);
    await Promise.all([fetchMetrics(), fetchLogs()]);
  };

  const handleSeedLogs = async () => {
    setError(null);
    setSeeding(true);

    try {
      const response = await fetch(`${API_BASE_URL}/logs/seed`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Unable to generate demonstration logs.');
      }

      setCurrentPage(1);
      await Promise.all([fetchMetrics(), fetchLogs()]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate demonstration logs.',
      );
    } finally {
      setSeeding(false);
    }
  };

  const severityData = metrics
    ? [
        {
          name: 'INFO',
          count: metrics.severityCounts.INFO,
          color: '#10b981',
        },
        {
          name: 'WARN',
          count: metrics.severityCounts.WARN,
          color: '#f59e0b',
        },
        {
          name: 'ERROR',
          count: metrics.severityCounts.ERROR,
          color: '#ef4444',
        },
        {
          name: 'CRITICAL',
          count: metrics.severityCounts.CRITICAL,
          color: '#a855f7',
        },
      ]
    : [];

  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#64748b' : '#94a3b8';

  const tooltipStyle =
    theme === 'dark'
      ? {
          backgroundColor: '#0d1322',
          borderColor: '#334155',
          borderRadius: '12px',
          color: '#f8fafc',
          fontSize: '12px',
        }
      : {
          backgroundColor: '#ffffff',
          borderColor: '#cbd5e1',
          borderRadius: '12px',
          color: '#0f172a',
          fontSize: '12px',
        };

  const getLevelClasses = (level: LogItem['level']) => {
    switch (level) {
      case 'INFO':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

      case 'WARN':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400';

      case 'ERROR':
        return 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400';

      case 'CRITICAL':
        return 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300';

      default:
        return '';
    }
  };

  const metricCards = [
    {
      title: 'Total Logs (24h)',
      value: metrics?.totalLogs.toLocaleString() ?? '—',
      subtitle: 'Recorded events',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      iconBackground: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Error Rate',
      value:
        metrics !== null ? `${metrics.errorRate}%` : '—',
      subtitle: 'ERROR + CRITICAL',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      iconBackground: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Active Services',
      value: metrics?.activeServicesCount ?? '—',
      subtitle: 'Microservices online',
      icon: Server,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBackground: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Critical Alerts',
      value: metrics?.criticalEvents ?? '—',
      subtitle: 'P1 action required',
      icon: AlertOctagon,
      color: 'text-purple-600 dark:text-purple-400',
      iconBackground: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 text-slate-900 transition-colors duration-200 dark:bg-[#090d16] dark:text-slate-100 lg:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Observability Dashboard
            </h1>

            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-normal text-blue-600 dark:text-blue-400">
              Live Stream
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time log aggregation, metrics analytics and diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loadingMetrics || loadingLogs}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-50 dark:border-slate-800 dark:bg-[#111726] dark:text-slate-300"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingMetrics || loadingLogs
                  ? 'animate-spin text-blue-500'
                  : ''
              }`}
            />

            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSeedLogs()}
            disabled={seeding}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-violet-500 disabled:opacity-50"
          >
            <Sparkles
              className={`h-4 w-4 ${
                seeding ? 'animate-spin' : ''
              }`}
            />

            <span>
              {seeding ? 'Seeding Telemetry...' : 'Seed Demo Logs'}
            </span>
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#111726]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.iconBackground} ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <span
                  className={`font-mono text-3xl font-extrabold tracking-tight ${card.color}`}
                >
                  {card.value}
                </span>

                <span className="text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                  {card.subtitle}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726] lg:col-span-2">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Log Volume Over Time
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hourly throughput across all connected services
            </p>
          </div>

          <div className="h-64">
            {metrics && metrics.timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.timeseries}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="totalGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="errorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#ef4444"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#ef4444"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    stroke={axisColor}
                    tick={{
                      fill: axisColor,
                      fontSize: 11,
                    }}
                    axisLine={false}
                  />

                  <YAxis
                    stroke={axisColor}
                    tick={{
                      fill: axisColor,
                      fontSize: 11,
                    }}
                    axisLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total logs"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="ERROR"
                    name="Errors"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#errorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs text-slate-500">
                No telemetry data available.
              </div>
            )}
          </div>
        </article>

        <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Severity Breakdown
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution by severity category
            </p>
          </div>

          <div className="h-64">
            {metrics ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={severityData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke={gridColor}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke={axisColor}
                    tick={{
                      fill: axisColor,
                      fontSize: 11,
                    }}
                    axisLine={false}
                  />

                  <YAxis
                    stroke={axisColor}
                    tick={{
                      fill: axisColor,
                      fontSize: 11,
                    }}
                    axisLine={false}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{
                      fill:
                        theme === 'dark'
                          ? '#1e293b'
                          : '#f1f5f9',
                    }}
                  />

                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs text-slate-500">
                No severity data available.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111726]">
        <div className="space-y-4 border-b border-slate-200 p-4 dark:border-slate-800 lg:p-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-500" />

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Log Stream Explorer
            </h2>

            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {pagination.total} entries
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search logs..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 font-mono text-xs text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-[#090d16] dark:text-slate-200"
              />
            </div>

            <div className="relative">
              <select
                value={selectedService}
                onChange={(event) => {
                  setSelectedService(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#090d16] dark:text-slate-200"
              >
                <option value="ALL">All Services</option>

                {metrics?.services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(event) => {
                  setSelectedLevel(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#090d16] dark:text-slate-200"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-[#0d1322] dark:text-slate-400">
              <tr>
                <th className="w-44 px-4 py-3">Timestamp</th>
                <th className="w-28 px-4 py-3">Severity</th>
                <th className="w-36 px-4 py-3">Service</th>
                <th className="px-4 py-3">Message</th>
                <th className="w-12 px-4 py-3 text-center">
                  Data
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loadingLogs ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Loading log stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No records matched your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const expanded = expandedLogId === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() =>
                          setExpandedLogId(
                            expanded ? null : log._id,
                          )
                        }
                        className="cursor-pointer transition hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getLevelClasses(
                              log.level,
                            )}`}
                          >
                            {log.level}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-300">
                            {log.service}
                          </span>
                        </td>

                        <td className="max-w-md truncate px-4 py-3 text-slate-900 dark:text-slate-200">
                          {log.message}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {expanded ? (
                            <ChevronUp className="inline h-4 w-4 text-blue-500" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 text-slate-400" />
                          )}
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="bg-slate-50 dark:bg-[#090d16]/90">
                          <td colSpan={5} className="p-4">
                            <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-emerald-400">
                              {JSON.stringify(
                                log.metadata ?? {},
                                null,
                                2,
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 p-4 font-mono text-xs text-slate-500 dark:border-slate-800">
          <span>
            Page{' '}
            <strong className="text-slate-900 dark:text-white">
              {pagination.page}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-900 dark:text-white">
              {pagination.totalPages || 1}
            </strong>
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1),
                )
              }
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    pagination.totalPages || 1,
                    page + 1,
                  ),
                )
              }
              disabled={
                currentPage >= (pagination.totalPages || 1)
              }
              className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};