import React, { useState } from 'react';
import { Building2, Calendar, Download, LogOut, UserCircle2, ShieldCheck, Lock, Menu, X, Droplets, Trash2 } from 'lucide-react';

export default function Navbar({
  user,
  targetDate,
  setTargetDate,
  onLogout,
  onOpenExport,
  onOpenMasterSettings,
  activeModule = 'SWM',
  setActiveModule
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSwm = activeModule === 'SWM';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
      {/* Top Directorate Banner */}
      <div className={`py-1 px-3 sm:px-4 text-[11px] sm:text-xs font-medium flex items-center justify-between border-b transition-colors ${
        isSwm
          ? 'bg-emerald-700 text-emerald-100 border-emerald-600/50'
          : 'bg-cyan-800 text-cyan-100 border-cyan-700/50'
      }`}>
        <div className="flex items-center space-x-1.5 truncate">
          <span className="font-semibold text-white truncate">Govt of Tamil Nadu</span>
          <span>•</span>
          <span className="hidden sm:inline">Directorate of Municipal Administration (DMA)</span>
          <span className="sm:hidden">DMA</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs flex-shrink-0">
          <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${
            isSwm ? 'bg-emerald-400' : 'bg-cyan-400'
          }`}></span>
          <span className="hidden sm:inline">
            {isSwm ? 'State Municipal SWM Network • 170 ULBs' : 'State Used Water & STP Network • 170 ULBs'}
          </span>
          <span className="sm:hidden">170 ULBs Live</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`p-2 rounded-lg border flex-shrink-0 transition-colors ${
              isSwm
                ? 'bg-emerald-600/30 border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-600/30 border-cyan-500/30 text-cyan-400'
            }`}>
              {isSwm ? <Building2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{isSwm ? 'SWM Monitoring Portal' : 'UWM Monitoring Portal'}</span>
                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-normal flex-shrink-0 border ${
                  isSwm
                    ? 'bg-emerald-900/60 border-emerald-700 text-emerald-300'
                    : 'bg-cyan-900/60 border-cyan-700 text-cyan-300'
                }`}>
                  2026
                </span>
              </h1>
              <p className="hidden md:block text-xs text-slate-400 truncate">
                {isSwm
                  ? 'Daily Waste Collection, Processing Facilities & Disposal'
                  : 'Used Water Generation, STP/FSTP Operations & Water Reuse'}
              </p>
            </div>
          </div>

          {/* Module Switcher Tabs (Desktop & Tablet) */}
          {setActiveModule && (
            <div className="hidden sm:flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setActiveModule('SWM')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  isSwm
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Solid Waste (SWM)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('UWM')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  !isSwm
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Used Water (UWM)</span>
              </button>
            </div>
          )}

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 shadow-inner">
              <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
              <label htmlFor="target-date-desktop" className="sr-only">Report Date</label>
              <input
                id="target-date-desktop"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* HQ / Admin Master Baselines Manager */}
            {user && (user.role === 'DIRECTOR' || user.role === 'HQ_USER' || user.role === 'ADMIN') && (
              <button
                onClick={onOpenMasterSettings}
                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Master Targets (HQ)</span>
              </button>
            )}

            {/* Excel Export Button */}
            {user && (user.role === 'DIRECTOR' || user.role === 'HQ_USER' || user.role === 'ADMIN') && (
              <button
                onClick={onOpenExport}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            )}

            {/* User Profile Badge */}
            {user && (
              <div className="flex items-center pl-2 border-l border-slate-700 space-x-2">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{user.full_name || user.username}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {user.role === 'ULB_USER' ? `${user.ulb_name || 'ULB Operator'}` : user.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Date + Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent text-white text-[11px] focus:outline-none cursor-pointer w-24 sm:w-auto"
              />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in duration-150">
            {/* Mobile Module Switcher */}
            {setActiveModule && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveModule('SWM'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-bold transition-all ${
                    isSwm
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Solid Waste (SWM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveModule('UWM'); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-bold transition-all ${
                    !isSwm
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Used Water (UWM)</span>
                </button>
              </div>
            )}

            {/* User Info Bar */}
            {user && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user.full_name || user.username}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    {user.role === 'ULB_USER' ? `${user.ulb_name || 'ULB'}` : user.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/40"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {user && (user.role === 'DIRECTOR' || user.role === 'HQ_USER' || user.role === 'ADMIN') && (
                <>
                  <button
                    onClick={() => { onOpenMasterSettings(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 py-2 rounded-lg text-xs font-medium"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Master Targets (HQ)</span>
                  </button>

                  <button
                    onClick={() => { onOpenExport(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel Report</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
