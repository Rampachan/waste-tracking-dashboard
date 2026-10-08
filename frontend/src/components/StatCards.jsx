import React from 'react';
import { Home, Factory, Trash2, ArrowUpRight, TrendingUp, Percent, Gauge } from 'lucide-react';

export default function StatCards({ summary, loading }) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm animate-pulse h-28"></div>
        ))}
      </div>
    );
  }

  const {
    total_households,
    d2d_covered_hhs,
    avg_d2d_collection_pct,
    total_processed_mt,
    total_processing_capacity_mt,
    dump_yard_mt_total,
    total_waste_handled_mt,
    landfill_diversion_rate_pct,
    capacity_utilization_pct,
    mcc_actual_total,
    mrf_actual_total,
    biometh_actual_total,
    other_actual_total
  } = summary;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Main Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: D2D Collection */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Door to Door Coverage</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{avg_d2d_collection_pct}%</span>
            <span className="text-xs text-slate-500">State Avg</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${
                avg_d2d_collection_pct >= 90 ? 'bg-emerald-500' : avg_d2d_collection_pct >= 80 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(avg_d2d_collection_pct, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Covered: {(d2d_covered_hhs || 0).toLocaleString()}</span>
            <span>Total: {(total_households || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Waste Processed in MT */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Processed Quantity</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{(total_processed_mt || 0).toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-600">MT</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Capacity: <span className="font-semibold text-slate-700">{(total_processing_capacity_mt || 0).toLocaleString()} MT</span>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 font-mono">
            <span className="text-emerald-700 font-medium">{capacity_utilization_pct}% utilized</span>
          </div>
        </div>

        {/* Card 3: Dump Yard Disposal */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sent to Dump Yard</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-700">{(dump_yard_mt_total || 0).toLocaleString()}</span>
            <span className="text-xs font-semibold text-rose-600">MT</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Total Handled: <span className="font-semibold text-slate-700">{(total_waste_handled_mt || 0).toLocaleString()} MT</span>
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            Unprocessed direct landfill load
          </div>
        </div>

        {/* Card 4: Landfill Diversion Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diversion Rate</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-indigo-900">{landfill_diversion_rate_pct}%</span>
            <span className="text-xs text-emerald-600 font-medium">Diverted</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(landfill_diversion_rate_pct, 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ratio of processed waste over total generated
          </p>
        </div>
      </div>

      {/* Facility Inflow Breakdown Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs mb-3 border-b border-slate-800 pb-2">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Facility-Wise Actual Waste Inflow Today (MT)
          </span>
          <span className="text-slate-400 font-mono">
            Total Processed: <strong className="text-emerald-400">{(total_processed_mt || 0).toLocaleString()} MT</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Wet Waste Processed</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {((mcc_actual_total || 0) + (biometh_actual_total || 0)).toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">MCC ({mcc_actual_total || 0}) + BioMeth ({biometh_actual_total || 0})</div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Compost Harvested</div>
            <div className="text-base font-bold text-teal-400 font-mono mt-0.5">
              {(summary.compost_output_mt_total || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Daily Organic Fertilizer Output</div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Recyclables Sold</div>
            <div className="text-base font-bold text-blue-400 font-mono mt-0.5">
              {(summary.recyclable_sold_mt_total || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sanitary Worker Recovery</div>
          </div>

          <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Cement Kilns (RDF)</div>
            <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">
              {(summary.dry_waste_cement_mt_total || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">MT</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Combustible Industrial Off-take</div>
          </div>
        </div>
      </div>
    </div>
  );
}
