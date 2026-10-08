import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Filter } from 'lucide-react';

export default function ComplianceTracker({ compliance, filterMode, setFilterMode }) {
  if (!compliance) return null;

  const { total_ulbs, submitted_count, pending_count, compliance_pct } = compliance;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Daily Submission Compliance
          </div>
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
            <span>{submitted_count}</span>
            <span className="text-sm font-normal text-slate-400">/</span>
            <span className="text-sm font-normal text-slate-500">{total_ulbs} ULBs Reported</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {compliance_pct}%
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-48 hidden lg:block">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${compliance_pct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{submitted_count} submitted</span>
            <span className="text-amber-600 font-medium">{pending_count} pending</span>
          </div>
        </div>
      </div>

      {/* Filter Toggle Buttons */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setFilterMode('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterMode === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({total_ulbs})
        </button>

        <button
          onClick={() => setFilterMode('SUBMITTED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'SUBMITTED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Submitted ({submitted_count})</span>
        </button>

        <button
          onClick={() => setFilterMode('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterMode === 'PENDING'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending ({pending_count})</span>
        </button>
      </div>
    </div>
  );
}
