import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, CheckCircle2, AlertCircle, Building2, LayoutGrid, Table as TableIcon, Layers, ShieldCheck, Scale, Award, Recycle } from 'lucide-react';

const REGION_ORDER = [
  { key: "Corporation", label: "Corporations (24 ULBs)", isCorp: true },
  { key: "Chengalpattu Region", label: "Chengalpattu Region (20 ULBs)", isCorp: false },
  { key: "Salem region", label: "Salem Region (17 ULBs)", isCorp: false },
  { key: "Vellore Region", label: "Vellore Region (23 ULBs)", isCorp: false },
  { key: "Tiruppur Region", label: "Tiruppur Region (24 ULBs)", isCorp: false },
  { key: "Madurai Region", label: "Madurai Region (19 ULBs)", isCorp: false },
  { key: "Thanjavur region", label: "Thanjavur Region (20 ULBs)", isCorp: false },
  { key: "Tirunelveli Region", label: "Tirunelveli Region (22 ULBs)", isCorp: false },
];

export default function MasterRegionalTable({ logs, loading, selectedRegion, setSelectedRegion, filterMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const toggleCollapse = (regionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [regionKey]: !prev[regionKey]
    }));
  };

  // Filter logs by search, compliance status, and selected region tab
  const filteredLogs = logs.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterMode === 'SUBMITTED' && !item.is_submitted) return false;
    if (filterMode === 'PENDING' && item.is_submitted) return false;
    if (selectedRegion && selectedRegion !== 'ALL' && item.region !== selectedRegion) {
      return false;
    }
    return true;
  });

  // Group by region
  const groupedData = {};
  filteredLogs.forEach(log => {
    if (!groupedData[log.region]) groupedData[log.region] = [];
    groupedData[log.region].push(log);
  });

  // Calculate Subtotals for a group
  const calcSubtotal = (items) => {
    const totHH = items.reduce((acc, curr) => acc + (curr.total_households || 0), 0);
    const segHH = items.reduce((acc, curr) => acc + (curr.segregated_hh_collected || curr.door_to_door_hhs || 0), 0);
    const avgSegPct = totHH > 0 ? ((segHH / totHH) * 100).toFixed(1) : '0.0';

    const genMT = items.reduce((acc, curr) => acc + (curr.total_generation_today_mt || 0), 0);

    const wetProc = items.reduce((acc, curr) => acc + (curr.wet_waste_processed_mt || (curr.mcc_actual + curr.biometh_actual) || 0), 0);
    const compostMT = items.reduce((acc, curr) => acc + (curr.compost_output_mt || 0), 0);

    const dryCap = items.reduce((acc, curr) => acc + (curr.dry_facilities_capacity_mt || (curr.mrf_capacity + curr.other_capacity) || 0), 0);
    const recycMT = items.reduce((acc, curr) => acc + (curr.recyclable_sold_mt || 0), 0);
    const cementMT = items.reduce((acc, curr) => acc + (curr.dry_waste_cement_mt || 0), 0);

    const procMT = items.reduce((acc, curr) => acc + (curr.total_processed_mt || 0), 0);
    const dumpMT = items.reduce((acc, curr) => acc + (curr.dump_yard_mt || 0), 0);
    const totWaste = procMT + dumpMT;
    const avgProcPct = totWaste > 0 ? ((procMT / totWaste) * 100).toFixed(1) : '0.0';

    return {
      totHH, segHH, avgSegPct,
      genMT,
      wetProc, compostMT,
      dryCap, recycMT, cementMT,
      procMT, dumpMT, avgProcPct
    };
  };

  const grandTotal = calcSubtotal(filteredLogs);

  const getFlagBadge = (flag, segHH, totHH) => {
    const isExceeded = (totHH > 0 && segHH > totHH) || flag === 'Segregated HH>Total HH' || flag === 'CRITICAL';
    if (isExceeded) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
          Segregated HH&gt;Total HH
        </span>
      );
    }
    if (flag === 'PENDING') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
          PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
        OK
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Table Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col gap-3">
        {/* Top Controls Row: View Toggle & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-lg self-start">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Full Master Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards (Mobile)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ULB name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Region Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
          <button
            onClick={() => setSelectedRegion('ALL')}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
              selectedRegion === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All 169 ULBs
          </button>
          {REGION_ORDER.map(r => (
            <button
              key={r.key}
              onClick={() => setSelectedRegion(r.key)}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                selectedRegion === r.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r.isCorp ? '24 Corporations' : r.label.replace(' Region', '').replace(' region', '')}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: Mobile Cards View */}
      {viewMode === 'cards' && (
        <div className="p-3 sm:p-4 space-y-4 bg-slate-50/50">
          {REGION_ORDER.map(reg => {
            const items = groupedData[reg.key] || [];
            if (items.length === 0) return null;
            const isCollapsed = collapsedSections[reg.key];
            const subtotal = calcSubtotal(items);

            return (
              <div key={reg.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {/* Region Banner Header */}
                <div
                  onClick={() => toggleCollapse(reg.key)}
                  className="bg-indigo-50/90 hover:bg-indigo-100/90 cursor-pointer p-3 flex items-center justify-between border-b border-indigo-100"
                >
                  <div className="flex items-center space-x-2">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-700" /> : <ChevronDown className="w-4 h-4 text-indigo-700" />}
                    <h3 className="font-bold text-xs uppercase text-indigo-950 tracking-wide">{reg.label}</h3>
                  </div>
                  <span className="text-[11px] font-semibold bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-full">
                    {items.filter(i => i.is_submitted).length}/{items.length} Submitted
                  </span>
                </div>

                {!isCollapsed && (
                  <div className="p-3 space-y-3">
                    {/* Subtotal Ribbon */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-amber-800">Segregated HHs:</span>
                        <strong className="block font-mono text-amber-950">{subtotal.segHH.toLocaleString()} ({subtotal.avgSegPct}%)</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Gen Today MT:</span>
                        <strong className="block font-mono text-amber-950">{subtotal.genMT.toFixed(1)} MT</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Wet Proc / Compost:</span>
                        <strong className="block font-mono text-emerald-800">{subtotal.wetProc.toFixed(1)} / {subtotal.compostMT.toFixed(1)} MT</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Processed / Dump:</span>
                        <strong className="block font-mono text-indigo-900">{subtotal.procMT.toFixed(1)} / {subtotal.dumpMT.toFixed(1)} MT</strong>
                      </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map(row => (
                        <div
                          key={row.ulb_id}
                          className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-xs space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-mono">#{row.s_no}</span>
                              <span className="text-sm">{row.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getFlagBadge(row.data_quality_flag, row.segregated_hh_collected || row.door_to_door_hhs, row.total_households)}
                              {row.is_submitted ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Segregation Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-500">Source Segregation:</span>
                              <span className="font-bold font-mono text-emerald-700">{row.segregation_pct ?? row.collection_pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (row.segregation_pct || row.collection_pct) >= 90 ? 'bg-emerald-500' : (row.segregation_pct || row.collection_pct) >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(row.segregation_pct || row.collection_pct, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                              <span>{(row.segregated_hh_collected || row.door_to_door_hhs || 0).toLocaleString()} segregated</span>
                              <span>{(row.total_households || 0).toLocaleString()} HHs</span>
                            </div>
                          </div>

                          {/* Generation & Wet Waste Strip */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div className="text-[9px] text-slate-400">Gen Today</div>
                              <div className="font-mono font-bold text-slate-800">{row.total_generation_today_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                              <div className="text-[9px] text-emerald-700">Wet Proc</div>
                              <div className="font-mono font-bold text-emerald-900">{row.wet_waste_processed_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-teal-50/70 p-1.5 rounded border border-teal-100">
                              <div className="text-[9px] text-teal-700">Compost</div>
                              <div className="font-mono font-bold text-teal-900">{row.compost_output_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                          </div>

                          {/* Dry Waste Strip */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="bg-cyan-50/70 p-1.5 rounded border border-cyan-100">
                              <div className="text-[9px] text-cyan-700">MRF Sorting</div>
                              <div className="font-mono font-bold text-cyan-900">{row.mrf_actual?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-blue-50/70 p-1.5 rounded border border-blue-100">
                              <div className="text-[9px] text-blue-700">Recyc Sold</div>
                              <div className="font-mono font-bold text-blue-900">{row.recyclable_sold_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-indigo-50/70 p-1.5 rounded border border-indigo-100">
                              <div className="text-[9px] text-indigo-700">Cement RDF</div>
                              <div className="font-mono font-bold text-indigo-900">{row.dry_waste_cement_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                          </div>

                          {/* Processed vs Dump yard */}
                          <div className="flex justify-between text-[11px] pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-500">Processed: </span>
                              <strong className="font-mono text-emerald-700">{row.total_processed_mt?.toFixed(1)} MT</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Dump Yard: </span>
                              <strong className="font-mono text-rose-600">{row.dump_yard_mt?.toFixed(1)} MT</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Rate: </span>
                              <strong className="font-mono text-indigo-700">{row.processed_waste_pct ?? row.diversion_rate_pct}%</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Full Master Table (Official Multi-Tier Layout) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
            {/* Multi-tier Table Head */}
            <thead className="bg-slate-800 text-white font-semibold">
              {/* Level 1 Header */}
              <tr className="border-b border-slate-700 text-center text-[11px]">
                <th rowSpan={3} className="py-2.5 px-2 border-r border-slate-700 w-12 sticky left-0 bg-slate-800 z-20">S.No</th>
                <th rowSpan={3} className="py-2.5 px-3 border-r border-slate-700 w-48 text-left sticky left-12 bg-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">Name of Corporation / Municipality</th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-700 bg-slate-900/60 font-bold">
                  Door to Door Collection
                </th>
                <th rowSpan={3} className="py-2 px-2 border-r border-slate-700 w-28 bg-slate-900/40">
                  Total waste generation Today (MT)
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-700 bg-emerald-950/60 font-bold text-emerald-200">
                  WET WASTE
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-700 bg-cyan-950/60 font-bold text-cyan-200">
                  DRY WASTE
                </th>
                <th colSpan={4} className="py-1.5 px-2 bg-indigo-950/60 font-bold text-indigo-200">
                  STATUS
                </th>
              </tr>

              {/* Level 2 Header */}
              <tr className="bg-slate-700 text-slate-100 text-center border-b border-slate-600 text-[10px]">
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-24">No. of HHs</th>
                <th colSpan={2} className="py-1 px-2 border-r border-slate-600 bg-slate-800/80">Door to Door Collection Today</th>

                {/* Wet Waste */}
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-32 bg-emerald-900/40">
                  Wet waste processed MCC / BIO-METHA (MT)
                </th>
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-28 bg-emerald-900/40">
                  Output quantity as compost per day (MT)
                </th>

                {/* Dry Waste */}
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-28 bg-cyan-900/40">
                  Processing facilities available (MT)
                </th>
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-32 bg-cyan-900/40">
                  Recyclable waste sold by sanitary workers (MT)
                </th>
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-32 bg-cyan-900/40">
                  Dry waste disposed (Cement / recycling) (MT)
                </th>

                {/* Status */}
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-24 bg-slate-800">
                  Total processed waste (MT)
                </th>
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-28 bg-rose-950/50 text-rose-200">
                  Waste sent to dumping yard (MT)
                </th>
                <th rowSpan={2} className="py-1.5 px-2 border-r border-slate-600 w-20 bg-slate-800">
                  % of processed waste
                </th>
                <th rowSpan={2} className="py-1.5 px-2 w-24 bg-slate-800">
                  Data-quality flag
                </th>
              </tr>

              {/* Level 3 Header */}
              <tr className="bg-slate-600 text-slate-200 text-center border-b border-slate-500 font-normal text-[10px]">
                <th className="py-1 px-2 border-r border-slate-500 w-28 text-[9px] leading-tight" title="No. of HHs segregated waste collected">No. of HHs segregated waste collected</th>
                <th className="py-1 px-2 border-r border-slate-500 w-16">% Col.</th>
              </tr>
            </thead>

            {/* Table Body: Grouped by Regions */}
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {REGION_ORDER.map((reg) => {
                const items = groupedData[reg.key] || [];
                if (items.length === 0) return null;
                const isCollapsed = collapsedSections[reg.key];
                const subtotal = calcSubtotal(items);

                return (
                  <React.Fragment key={reg.key}>
                    {/* Region Banner Row */}
                    <tr
                      onClick={() => toggleCollapse(reg.key)}
                      className="bg-indigo-50/80 hover:bg-indigo-100/80 cursor-pointer border-t-2 border-indigo-200 select-none transition-colors"
                    >
                      <td colSpan={15} className="py-2 px-3 text-indigo-950 font-bold text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-700" /> : <ChevronDown className="w-4 h-4 text-indigo-700" />}
                            <span className="uppercase tracking-wider">{reg.label}</span>
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800">
                              {items.filter(i => i.is_submitted).length} / {items.length} Submitted
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-normal">Click to {isCollapsed ? 'expand' : 'collapse'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Individual ULB Rows */}
                    {!isCollapsed && items.map((row) => {
                      const isPending = !row.is_submitted;
                      return (
                        <tr
                          key={row.ulb_id}
                          className={`hover:bg-slate-50/90 transition-colors ${
                            isPending ? 'bg-amber-50/20 text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          <td className="py-2 px-2 text-center border-r border-slate-100 font-mono sticky left-0 bg-white z-10">
                            {row.s_no}
                          </td>
                          <td className="py-2 px-3 font-semibold border-r border-slate-100 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{row.name}</span>
                              {isPending && <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded ml-1 font-normal">Pending</span>}
                            </div>
                          </td>

                          {/* D2D Columns */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono bg-slate-50/40">
                            {(row.total_households || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono">
                            {(row.segregated_hh_collected || row.door_to_door_hhs || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-semibold text-emerald-700">
                            {row.segregation_pct ?? row.collection_pct}%
                          </td>

                          {/* Generation Today */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900 bg-slate-50/30">
                            {row.total_generation_today_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Wet Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-emerald-800 bg-emerald-50/20">
                            {row.wet_waste_processed_mt?.toFixed(2) || (row.mcc_actual + row.biometh_actual).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-teal-800">
                            {row.compost_output_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Dry Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono bg-slate-50/40">
                            {row.dry_facilities_capacity_mt?.toFixed(2) || (row.mrf_capacity + row.other_capacity).toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-blue-800">
                            {row.recyclable_sold_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-indigo-800">
                            {row.dry_waste_cement_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Status */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900 bg-slate-50/50">
                            {row.total_processed_mt?.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-rose-600 bg-rose-50/20">
                            {row.dump_yard_mt?.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-emerald-700">
                            {row.processed_waste_pct ?? row.diversion_rate_pct}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            {getFlagBadge(row.data_quality_flag, row.segregated_hh_collected || row.door_to_door_hhs, row.total_households)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Regional Subtotal Row */}
                    <tr className="bg-amber-100/60 font-bold border-t border-b border-amber-300 text-amber-950 text-[10px]">
                      <td className="py-1.5 px-2 text-center sticky left-0 bg-amber-100/90 z-10">-</td>
                      <td className="py-1.5 px-3 uppercase sticky left-12 bg-amber-100/90 z-10">
                        {reg.label.replace(/\(.*\)/, '').trim()} Total
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.totHH.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.segHH.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{subtotal.avgSegPct}%</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.genMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{subtotal.wetProc.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-teal-900">{subtotal.compostMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.dryCap.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-900">{subtotal.recycMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-indigo-900">{subtotal.cementMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.procMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-900">{subtotal.dumpMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{subtotal.avgProcPct}%</td>
                      <td className="py-1.5 px-2 text-center">
                        {getFlagBadge(subtotal.segHH > subtotal.totHH ? "Segregated HH>Total HH" : "OK", subtotal.segHH, subtotal.totHH)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* State Grand Total Row */}
              <tr className="bg-emerald-100 font-extrabold border-t-2 border-b-2 border-emerald-500 text-emerald-950 text-xs">
                <td className="py-2.5 px-2 text-center sticky left-0 bg-emerald-100 z-10">★</td>
                <td className="py-2.5 px-3 uppercase sticky left-12 bg-emerald-100 z-10">
                  STATE GRAND TOTAL (169 ULBs)
                </td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.totHH.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.segHH.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-right font-mono text-emerald-900">{grandTotal.avgSegPct}%</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.genMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-emerald-900">{grandTotal.wetProc.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-teal-900">{grandTotal.compostMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.dryCap.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-blue-900">{grandTotal.recycMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-indigo-900">{grandTotal.cementMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.procMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-900">{grandTotal.dumpMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-emerald-900">{grandTotal.avgProcPct}%</td>
                <td className="py-2.5 px-2 text-center">
                  {getFlagBadge(grandTotal.segHH > grandTotal.totHH ? "Segregated HH>Total HH" : "OK", grandTotal.segHH, grandTotal.totHH)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
