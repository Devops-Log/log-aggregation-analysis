import React, { useState, useEffect, useCallback } from 'react';
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface LogItem {
  _id: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
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

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch metrics from backend
  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/logs/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        search: searchTerm,
        service: selectedService,
        level: selectedLevel,
      });

      const res = await fetch(`http://localhost:5000/api/v1/logs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [currentPage, searchTerm, selectedService, selectedLevel]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Seed demo logs handler
  const handleSeedLogs = async () => {
    setSeeding(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/logs/seed', { method: 'POST' });
      if (res.ok) {
        setCurrentPage(1);
        await Promise.all([fetchMetrics(), fetchLogs()]);
      }
    } catch (err) {
      console.error('Error seeding logs:', err);
    } finally {
      setSeeding(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span>INFO</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
            <span>WARN</span>
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30 inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></span>
            <span>ERROR</span>
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 inline-flex items-center space-x-1 animate-pulse shadow-sm shadow-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></span>
            <span>CRITICAL</span>
          </span>
        );
      default:
        return null;
    }
  };

  const severityBarData = metrics
    ? [
        { name: 'INFO', count: metrics.severityCounts.INFO, color: '#10b981' },
        { name: 'WARN', count: metrics.severityCounts.WARN, color: '#f59e0b' },
        { name: 'ERROR', count: metrics.severityCounts.ERROR, color: '#ef4444' },
        { name: 'CRITICAL', count: metrics.severityCounts.CRITICAL, color: '#a855f7' },
      ]
    : [];

  const gridStroke = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisStroke = theme === 'dark' ? '#64748b' : '#94a3b8';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#0d1322', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' } 
    : { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 lg:p-8 space-y-6 transition-colors duration-200">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-3">
            <span>Observability Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-normal">
              Live Stream
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time log aggregation, metrics analytics & security diagnostics</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchMetrics();
              fetchLogs();
            }}
            disabled={loadingMetrics || loadingLogs}
            className="p-2.5 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm flex items-center space-x-2 text-xs font-medium"
            title="Refresh metrics & stream"
          >
            <RefreshCw className={`h-4 w-4 ${loadingMetrics || loadingLogs ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={handleSeedLogs}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding Telemetry...' : 'Seed Demo Logs'}</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Logs (24h)</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
              {metrics ? metrics.totalLogs.toLocaleString() : '—'}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">Recorded events</span>
          </div>
        </div>

        {/* Card 2: Error Rate */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Error Rate</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-amber-600 dark:text-amber-400">
              {metrics ? `${metrics.errorRate}%` : '—'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ERROR + CRITICAL</span>
          </div>
        </div>

        {/* Card 3: Monitored Services */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Services</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
              {metrics ? metrics.activeServicesCount : '—'}
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-mono">Microservices online</span>
          </div>
        </div>

        {/* Card 4: Critical Alerts */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Alerts</span>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-purple-600 dark:text-purple-400">
              {metrics ? metrics.criticalEvents : '—'}
            </span>
            <span className="text-xs text-purple-600/80 dark:text-purple-400/80 font-mono">P1 Action Required</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log Volume Timeseries Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Log Volume Over Time (24h)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hourly throughput across all connected microservices</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Total</span>
              </span>
              <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Errors</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {metrics && metrics.timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="time" stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} axisLine={false} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Logs" />
                  <Area type="monotone" dataKey="ERROR" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorError)" name="Errors" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No telemetry data available. Click "Seed Demo Logs" above.
              </div>
            )}
          </div>
        </div>

        {/* Severity Distribution Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] p-5 shadow-sm dark:shadow-lg space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Severity Breakdown</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution by severity category</p>
          </div>

          <div className="h-64 w-full pt-2">
            {metrics ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} axisLine={false} />
                  <YAxis stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No data available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* LOG EXPLORER SECTION */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] shadow-sm dark:shadow-xl overflow-hidden transition-colors duration-200">
        
        {/* Filter Controls Header */}
        <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Log Stream Explorer</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                {pagination.total} entries
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Auto-updating stream
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search logs by keyword or regex..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-700/80 focus:border-blue-500 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* Service Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-700/80 focus:border-blue-500 text-xs font-mono text-slate-900 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Services</option>
                {metrics?.services.map((srv) => (
                  <option key={srv} value={srv}>{srv}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Severity Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-700/80 focus:border-blue-500 text-xs font-mono text-slate-900 dark:text-slate-200 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-mono">
            <thead className="bg-slate-100 dark:bg-[#0d1322] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-4 w-28">Severity</th>
                <th className="py-3 px-4 w-36">Service Tag</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4 w-12 text-center">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const formattedTime = new Date(log.timestamp).toLocaleString();

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => toggleExpand(log._id)}
                        className={`hover:bg-slate-100/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-100 dark:bg-slate-800/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formattedTime}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getLevelBadge(log.level)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 font-medium">
                            {log.service}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-200 truncate max-w-md">
                          {log.message}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-blue-500 dark:text-blue-400 inline" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 inline" />
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata View */}
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-[#090d16]/90 border-t border-b border-slate-200 dark:border-slate-800">
                          <td colSpan={5} className="p-4">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-4 space-y-2 shadow-inner">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">Contextual Metadata Payload (JSON)</span>
                                <span>ID: {log._id}</span>
                              </div>
                              <pre className="text-emerald-600 dark:text-emerald-400 text-xs font-mono overflow-x-auto p-3 bg-slate-900 dark:bg-[#060910] text-slate-100 rounded-lg border border-slate-800 dark:border-slate-900 leading-relaxed">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                    {loadingLogs ? 'Loading log stream...' : 'No log records matched your query criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-[#111726]">
          <div>
            Showing Page <span className="text-slate-900 dark:text-white font-bold">{pagination.page}</span> of{' '}
            <span className="text-slate-900 dark:text-white font-bold">{pagination.totalPages || 1}</span> ({pagination.total} logs)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
