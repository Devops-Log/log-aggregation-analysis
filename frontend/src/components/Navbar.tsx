import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0d1322]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm dark:shadow-lg transition-colors duration-200">
      {/* Brand logo & status pill */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 dark:bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                CentralLog
              </span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono border border-blue-500/20">
                v2.4 Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DevOps Telemetry Hub</p>
          </div>
        </div>

        {/* Realtime Operational Status Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>System Operational</span>
        </div>
      </div>

      {/* Right side controls: Theme toggle, user info & Sign out */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {user && (
          <div className="flex items-center space-x-3 border-r border-slate-200 dark:border-slate-800 pr-3 sm:pr-4">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden sm:block text-right">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                  user.role === 'admin' 
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-500/40 text-xs font-medium transition-all shadow-sm"
          title="Sign out of session"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
