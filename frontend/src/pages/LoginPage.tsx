import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDemoFill = () => {
    setEmail('admin@centrallog.local');
    setPassword('password123');
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            'Authentication failed. Please check your credentials.',
        );
      }

      loginSession(data.token, data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to connect to the backend service.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#090d16] transition-colors duration-200 overflow-hidden select-none">
      {/* Top-right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Authentication card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726]/80 backdrop-blur-xl p-8 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/80 transition-colors duration-200">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-blue-500/30 mb-4">
            <div className="h-full w-full bg-slate-950 dark:bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <Activity className="h-7 w-7 text-blue-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            CentralLog Hub
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise DevOps Monitoring &amp; Observability
          </p>
        </div>

        {/* Quick demo fill button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm group"
          >
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />

            <span>Quick Demo Fill (Admin)</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2.5"
          >
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />

            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Work Email
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="h-4 w-4" />
              </div>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@centrallog.local"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm font-mono transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="h-4 w-4" />
              </div>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-300 dark:border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm font-mono transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Telemetry Hub</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer information */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
            <span>256-bit TLS Encrypted</span>
          </div>

          <span>MongoDB Integrated</span>
        </div>
      </div>
    </div>
  );
};