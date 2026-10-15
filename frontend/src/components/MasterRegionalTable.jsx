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

export default function MasterRegionalTable({ logs, loading, selectedRegion, setSelectedRegion, filterMode, targetDate }) {
  const displayDate = targetDate || new Date().toISOString().split('T')[0];
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
  // Calculate Subtotals for a group matching 23-column schema
  const calcSubtotal = (items) => {
    const totHH = items.reduce((acc, curr) => acc + (curr.total_households || 0), 0);
    const segHH = items.reduce((acc, curr) => acc + (curr.segregated_hh_collected || curr.door_to_door_hhs || 0), 0);
    const avgSegPct = totHH > 0 ? ((segHH / totHH) * 100).toFixed(1) : '0.0';

    const genMT = items.reduce((acc, curr) => acc + (curr.total_generation_today_mt || 0), 0);
    const wetGenMT = items.reduce((acc, curr) => acc + (curr.wet_waste_generation_mt || 0), 0);
    const dryGenMT = items.reduce((acc, curr) => acc + (curr.dry_waste_generation_mt || 0), 0);

    const wetProc = items.reduce((acc, curr) => acc + (curr.wet_waste_processed_mt || (curr.mcc_actual + curr.biometh_actual) || 0), 0);
    const compostMT = items.reduce((acc, curr) => acc + (curr.compost_output_mt || 0), 0);
    const manureMT = items.reduce((acc, curr) => acc + (curr.manure_sold_free_mt || 0), 0);

    const recycSoldMT = items.reduce((acc, curr) => acc + (curr.recyclable_sold_mt || 0), 0);
    const recycSentMT = items.reduce((acc, curr) => acc + (curr.recyclable_sent_to_recyclers_mt || 0), 0);
    const cementMT = items.reduce((acc, curr) => acc + (curr.dry_waste_cement_mt || 0), 0);

    const sanCapMT = items.reduce((acc, curr) => acc + (curr.sanitary_waste_incineration_capacity_mt || 0), 0);
    const sanIncinMT = items.reduce((acc, curr) => acc + (curr.sanitary_waste_incinerated_today_mt || 0), 0);
    const specProcMT = items.reduce((acc, curr) => acc + (curr.special_waste_processed_mt || 0), 0);

    const totDryProcMT = recycSoldMT + recycSentMT + cementMT;
    const totProcMT = wetProc + sanIncinMT + specProcMT + totDryProcMT;
    const dumpMT = genMT - totProcMT;
    const avgProcPct = genMT > 0 ? ((totProcMT / genMT) * 100).toFixed(1) : '0.0';

    return {
      totHH, segHH, avgSegPct,
      genMT, wetGenMT, dryGenMT,
      wetProc, compostMT, manureMT,
      recycSoldMT, recycSentMT, cementMT,
      sanCapMT, sanIncinMT, specProcMT,
      totDryProcMT, totProcMT, dumpMT, avgProcPct
    };
  };

  const grandTotal = calcSubtotal(filteredLogs);

  const getFlagBadge = (flag, segHH, totHH, procMT, genMT) => {
    const isSegExceeded = (totHH > 0 && segHH > totHH) || flag === 'Segregated HH>Total HH';
    const isProcExceeded = (genMT > 0 && procMT > genMT) || flag === 'Processed>Generation';
    if (isSegExceeded) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
          Segregated HH&gt;Total HH
        </span>
      );
    }
    if (isProcExceeded) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          Processed&gt;Generation
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
                        <span className="text-[10px] text-amber-800">Segregated HHs (Col 6):</span>
                        <strong className="block font-mono text-amber-950">{subtotal.segHH.toLocaleString()} ({subtotal.avgSegPct}%)</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Waste Gen MT (Cols 7-9):</span>
                        <strong className="block font-mono text-amber-950">{subtotal.genMT.toFixed(1)} MT <span className="text-[10px] font-normal text-amber-700">(Wet: {subtotal.wetGenMT.toFixed(1)}, Dry: {subtotal.dryGenMT.toFixed(1)})</span></strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Wet Proc / Compost / Manure:</span>
                        <strong className="block font-mono text-emerald-800">{subtotal.wetProc.toFixed(1)} / {subtotal.compostMT.toFixed(1)} / {subtotal.manureMT.toFixed(1)} MT</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800">Total Processed / Dump:</span>
                        <strong className="block font-mono text-indigo-900">{subtotal.totProcMT.toFixed(1)} / {subtotal.dumpMT.toFixed(1)} MT ({subtotal.avgProcPct}%)</strong>
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
                              <span className="text-[10px] text-slate-400 font-normal">({row.region})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getFlagBadge(row.data_quality_flag, row.segregated_hh_collected, row.total_households, row.total_processed_waste_mt ?? row.total_processed_mt, row.total_generation_today_mt)}
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
                              <span className="text-slate-500">Source Segregation (Col 6 / Col 5):</span>
                              <span className="font-bold font-mono text-emerald-700">{row.segregation_pct ?? (row.total_households > 0 ? ((row.segregated_hh_collected / row.total_households) * 100).toFixed(1) : 0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (row.segregation_pct || 0) >= 90 ? 'bg-emerald-500' : (row.segregation_pct || 0) >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(row.segregation_pct || 0, 100)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                              <span>{(row.segregated_hh_collected || 0).toLocaleString()} segregated</span>
                              <span>{(row.total_households || 0).toLocaleString()} HHs</span>
                            </div>
                          </div>

                          {/* Waste Generation Strip (Cols 7, 8, 9) */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div className="text-[9px] text-slate-400">Total Gen (7)</div>
                              <div className="font-mono font-bold text-slate-800">{row.total_generation_today_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                              <div className="text-[9px] text-emerald-700">Wet Gen (8)</div>
                              <div className="font-mono font-bold text-emerald-900">{row.wet_waste_generation_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-blue-50/70 p-1.5 rounded border border-blue-100">
                              <div className="text-[9px] text-blue-700">Dry Gen (9)</div>
                              <div className="font-mono font-bold text-blue-900">{row.dry_waste_generation_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                          </div>

                          {/* Wet Waste Processing Strip (Cols 10, 11, 12) */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="bg-emerald-50/70 p-1.5 rounded border border-emerald-100">
                              <div className="text-[9px] text-emerald-700">Wet Proc (10)</div>
                              <div className="font-mono font-bold text-emerald-900">{row.wet_waste_processed_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-teal-50/70 p-1.5 rounded border border-teal-100">
                              <div className="text-[9px] text-teal-700">Compost (11)</div>
                              <div className="font-mono font-bold text-teal-900">{row.compost_output_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                            <div className="bg-amber-50/70 p-1.5 rounded border border-amber-100">
                              <div className="text-[9px] text-amber-700">Manure Sold (12)</div>
                              <div className="font-mono font-bold text-amber-900">{row.manure_sold_free_mt?.toFixed(1) || '0.0'} MT</div>
                            </div>
                          </div>

                          {/* Dry Waste Processing Strip (Cols 13, 14, 15, 19) */}
                          <div className="grid grid-cols-4 gap-1 text-center text-[9px]">
                            <div className="bg-cyan-50/70 p-1 rounded border border-cyan-100">
                              <div className="text-[8px] text-cyan-700">Worker (13)</div>
                              <div className="font-mono font-bold text-cyan-900">{row.recyclable_sold_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                            <div className="bg-blue-50/70 p-1 rounded border border-blue-100">
                              <div className="text-[8px] text-blue-700">Recycler (14)</div>
                              <div className="font-mono font-bold text-blue-900">{row.recyclable_sent_to_recyclers_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                            <div className="bg-indigo-50/70 p-1 rounded border border-indigo-100">
                              <div className="text-[8px] text-indigo-700">Cement (15)</div>
                              <div className="font-mono font-bold text-indigo-900">{row.dry_waste_cement_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                            <div className="bg-violet-50/70 p-1 rounded border border-violet-100">
                              <div className="text-[8px] text-violet-700 font-semibold">Tot Dry (19)</div>
                              <div className="font-mono font-bold text-violet-900">{(row.total_dry_waste_processed_mt ?? ((row.recyclable_sold_mt || 0) + (row.recyclable_sent_to_recyclers_mt || 0) + (row.dry_waste_cement_mt || 0)))?.toFixed(1)}</div>
                            </div>
                          </div>

                          {/* Sanitary (Cols 16, 17) & Special Waste (Col 18) Strip */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                            <div className="bg-rose-50/70 p-1 rounded border border-rose-100">
                              <div className="text-[8px] text-rose-700">Incin Cap (16)</div>
                              <div className="font-mono font-bold text-rose-900">{row.sanitary_waste_incineration_capacity_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                            <div className="bg-rose-50/70 p-1 rounded border border-rose-100">
                              <div className="text-[8px] text-rose-700">San Incin (17)</div>
                              <div className="font-mono font-bold text-rose-900">{row.sanitary_waste_incinerated_today_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                            <div className="bg-amber-50/70 p-1 rounded border border-amber-100">
                              <div className="text-[8px] text-amber-700">Special (18)</div>
                              <div className="font-mono font-bold text-amber-900">{row.special_waste_processed_mt?.toFixed(1) || '0.0'}</div>
                            </div>
                          </div>

                          {/* Calculated Totals (Cols 20, 21, 22) */}
                          <div className="flex justify-between text-[11px] pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-500">Total Proc (20): </span>
                              <strong className="font-mono text-emerald-700">{(row.total_processed_waste_mt ?? row.total_processed_mt)?.toFixed(1)} MT</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Dump Yard (21): </span>
                              <strong className="font-mono text-rose-600">{row.dump_yard_mt?.toFixed(1)} MT</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">% Proc (22): </span>
                              <strong className="font-mono text-indigo-700">{row.processed_waste_pct ?? 0}%</strong>
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

      {/* VIEW 2: Full Master Table (Official 23-Column Layout) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[2200px]">
            {/* Multi-tier Table Head matching Official Circular */}
            <thead className="bg-slate-800 text-white font-semibold">
              {/* Level 1 Header: Group Titles */}
              <tr className="border-b border-slate-700 text-center text-[11px]">
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-24 bg-slate-800">
                  <div>Date</div>
                  <div className="text-[9px] text-slate-400 font-normal">(1)</div>
                </th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-12 sticky left-0 bg-slate-800 z-20">
                  <div>Sl.No.</div>
                  <div className="text-[9px] text-slate-400 font-normal">(2)</div>
                </th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-28 bg-slate-800">
                  <div>Region</div>
                  <div className="text-[9px] text-slate-400 font-normal">(3)</div>
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-48 text-left sticky left-12 bg-slate-800 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  <div>Name of the ULB</div>
                  <div className="text-[9px] text-slate-400 font-normal">(4)</div>
                </th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-24 bg-slate-800">
                  <div>No. of HHs</div>
                  <div className="text-[9px] text-slate-400 font-normal">(5)</div>
                </th>
                <th colSpan={1} className="py-1.5 px-2 border-r border-slate-700 bg-emerald-950/70 font-bold text-emerald-200 uppercase tracking-wide">
                  Source Segregation
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-700 bg-slate-900 font-bold text-slate-200 uppercase tracking-wide">
                  Waste Generation
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-700 bg-teal-950/70 font-bold text-teal-200 uppercase tracking-wide">
                  Wet Waste
                </th>
                <th colSpan={3} className="py-1.5 px-2 border-r border-slate-700 bg-cyan-950/70 font-bold text-cyan-200 uppercase tracking-wide">
                  Dry Waste
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-700 bg-rose-950/70 font-bold text-rose-200 uppercase tracking-wide">
                  Sanitary Waste
                </th>
                <th colSpan={1} className="py-1.5 px-2 border-r border-slate-700 bg-amber-950/70 font-bold text-amber-200 uppercase tracking-wide">
                  Special Waste
                </th>
                <th colSpan={5} className="py-1.5 px-2 bg-indigo-950/70 font-bold text-indigo-200 uppercase tracking-wide">
                  Calculated (Do Not Enter)
                </th>
              </tr>

              {/* Level 2 Header: Columns 6-23 */}
              <tr className="bg-slate-700 text-slate-100 text-center border-b border-slate-600 text-[10px]">
                {/* Col 6 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-emerald-900/40">
                  <div>No. of HHs segregated waste collected</div>
                  <div className="text-[9px] text-emerald-300 font-normal">(6)</div>
                </th>

                {/* Cols 7-9 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-slate-800/80">
                  <div>Total waste generation Today (MT)</div>
                  <div className="text-[9px] text-slate-300 font-normal">(7)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-24 bg-slate-800/80">
                  <div>Wet waste generation (MT)</div>
                  <div className="text-[9px] text-slate-300 font-normal">(8)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-24 bg-slate-800/80">
                  <div>Dry waste generation (MT)</div>
                  <div className="text-[9px] text-slate-300 font-normal">(9)</div>
                </th>

                {/* Cols 10-12 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-36 bg-teal-900/40">
                  <div>Wet waste processed MCC / BIO-METHA (MT) & others</div>
                  <div className="text-[9px] text-teal-300 font-normal">(10)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-teal-900/40">
                  <div>Compost generated today (MT)</div>
                  <div className="text-[9px] text-teal-300 font-normal">(11)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-teal-900/40">
                  <div>Manure sold / given at free of cost (MT)</div>
                  <div className="text-[9px] text-teal-300 font-normal">(12)</div>
                </th>

                {/* Cols 13-15 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-cyan-900/40">
                  <div>Recyclable waste sold by sanitary workers (MT)</div>
                  <div className="text-[9px] text-cyan-300 font-normal">(13)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-cyan-900/40">
                  <div>Recyclable waste sent to recyclers (MT)</div>
                  <div className="text-[9px] text-cyan-300 font-normal">(14)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-cyan-900/40">
                  <div>Dry waste disposed to Cement industries (MT)</div>
                  <div className="text-[9px] text-cyan-300 font-normal">(15)</div>
                </th>

                {/* Cols 16-17 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-rose-900/40">
                  <div>Sanitary waste - incineration capacity (MT/day)</div>
                  <div className="text-[9px] text-rose-300 font-normal">(16)</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-rose-900/40">
                  <div>Sanitary waste incinerated today (MT)</div>
                  <div className="text-[9px] text-rose-300 font-normal">(17)</div>
                </th>

                {/* Col 18 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-32 bg-amber-900/40">
                  <div>Special waste processed / disposed today (MT)</div>
                  <div className="text-[9px] text-amber-300 font-normal">(18)</div>
                </th>

                {/* Cols 19-23 */}
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-indigo-900/50">
                  <div>Total dry waste processed (MT)</div>
                  <div className="text-[9px] text-indigo-300 font-normal">(19) =13+14+15</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-indigo-900/50">
                  <div>Total processed waste (MT)</div>
                  <div className="text-[9px] text-indigo-300 font-normal">(20) =10+17+18+19</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-28 bg-rose-950/50 text-rose-200">
                  <div>Waste sent to dumping yard (MT)</div>
                  <div className="text-[9px] text-rose-300 font-normal">(21) =7-20</div>
                </th>
                <th className="py-1.5 px-2 border-r border-slate-600 w-24 bg-indigo-900/50">
                  <div>% of processed waste</div>
                  <div className="text-[9px] text-indigo-300 font-normal">(22) =20/7</div>
                </th>
                <th className="py-1.5 px-2 w-32 bg-indigo-900/50">
                  <div>Data-quality flag</div>
                  <div className="text-[9px] text-indigo-300 font-normal">(23)</div>
                </th>
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
                      <td colSpan={23} className="py-2 px-3 text-indigo-950 font-bold text-xs">
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
                      const totDryProc = (row.total_dry_waste_processed_mt !== undefined && row.total_dry_waste_processed_mt !== null)
                        ? row.total_dry_waste_processed_mt
                        : ((row.recyclable_sold_mt || 0) + (row.recyclable_sent_to_recyclers_mt || 0) + (row.dry_waste_cement_mt || 0));
                      const totProc = row.total_processed_waste_mt ?? row.total_processed_mt ?? 0;

                      return (
                        <tr
                          key={row.ulb_id}
                          className={`hover:bg-slate-50/90 transition-colors ${
                            isPending ? 'bg-amber-50/20 text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          {/* Col 1: Date */}
                          <td className="py-2 px-2 text-center border-r border-slate-100 font-mono text-[10px] text-slate-600">
                            {row.log_date || row.date || displayDate}
                          </td>

                          {/* Col 2: Sl.No */}
                          <td className="py-2 px-2 text-center border-r border-slate-100 font-mono sticky left-0 bg-white z-10">
                            {row.s_no}
                          </td>

                          {/* Col 3: Region */}
                          <td className="py-2 px-2 text-center border-r border-slate-100 text-[10px] text-slate-600">
                            {row.region}
                          </td>

                          {/* Col 4: Name of ULB */}
                          <td className="py-2 px-3 font-semibold border-r border-slate-100 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{row.name}</span>
                              {isPending && <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded ml-1 font-normal">Pending</span>}
                            </div>
                          </td>

                          {/* Col 5: No. of HHs */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono bg-slate-50/40">
                            {(row.total_households || 0).toLocaleString()}
                          </td>

                          {/* Col 6: Source Segregation */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-emerald-800 bg-emerald-50/20">
                            {(row.segregated_hh_collected || 0).toLocaleString()}
                          </td>

                          {/* Cols 7-9: Waste Generation */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900 bg-slate-50/30">
                            {row.total_generation_today_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-slate-800">
                            {row.wet_waste_generation_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-slate-800">
                            {row.dry_waste_generation_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Cols 10-12: Wet Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-teal-800 bg-teal-50/20">
                            {row.wet_waste_processed_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-teal-800">
                            {row.compost_output_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-teal-800">
                            {row.manure_sold_free_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Cols 13-15: Dry Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-cyan-800">
                            {row.recyclable_sold_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-blue-800">
                            {row.recyclable_sent_to_recyclers_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-indigo-800">
                            {row.dry_waste_cement_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Cols 16-17: Sanitary Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-rose-800">
                            {row.sanitary_waste_incineration_capacity_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-rose-800">
                            {row.sanitary_waste_incinerated_today_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Col 18: Special Waste */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono text-amber-800">
                            {row.special_waste_processed_mt?.toFixed(2) || '0.00'}
                          </td>

                          {/* Cols 19-23: Calculated Columns */}
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-semibold text-violet-900 bg-violet-50/20">
                            {totDryProc.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-slate-900 bg-slate-50/50">
                            {totProc.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-rose-600 bg-rose-50/20">
                            {row.dump_yard_mt?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-2 px-2 text-right border-r border-slate-100 font-mono font-bold text-emerald-700">
                            {row.processed_waste_pct ?? 0}%
                          </td>
                          <td className="py-2 px-2 text-center">
                            {getFlagBadge(row.data_quality_flag, row.segregated_hh_collected, row.total_households, totProc, row.total_generation_today_mt)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Regional Subtotal Row */}
                    <tr className="bg-amber-100/60 font-bold border-t border-b border-amber-300 text-amber-950 text-[10px]">
                      <td className="py-1.5 px-2 text-center text-slate-500">-</td>
                      <td className="py-1.5 px-2 text-center sticky left-0 bg-amber-100/90 z-10">-</td>
                      <td className="py-1.5 px-2 text-center uppercase">{reg.label.replace(/\(.*\)/, '').trim()}</td>
                      <td className="py-1.5 px-3 uppercase sticky left-12 bg-amber-100/90 z-10">
                        {reg.label.replace(/\(.*\)/, '').trim()} Total ({items.length} ULBs)
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.totHH.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{subtotal.segHH.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.genMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.wetGenMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.dryGenMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-teal-900">{subtotal.wetProc.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-teal-900">{subtotal.compostMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-teal-900">{subtotal.manureMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-cyan-900">{subtotal.recycSoldMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-900">{subtotal.recycSentMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-indigo-900">{subtotal.cementMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-900">{subtotal.sanCapMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-900">{subtotal.sanIncinMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-amber-900">{subtotal.specProcMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-violet-900">{subtotal.totDryProcMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{subtotal.totProcMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-rose-900">{subtotal.dumpMT.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{subtotal.avgProcPct}%</td>
                      <td className="py-1.5 px-2 text-center">
                        {getFlagBadge(
                          subtotal.segHH > subtotal.totHH ? "Segregated HH>Total HH" : subtotal.totProcMT > subtotal.genMT ? "Processed>Generation" : "OK",
                          subtotal.segHH,
                          subtotal.totHH,
                          subtotal.totProcMT,
                          subtotal.genMT
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* State Grand Total Row */}
              <tr className="bg-emerald-100 font-extrabold border-t-2 border-b-2 border-emerald-500 text-emerald-950 text-xs">
                <td className="py-2.5 px-2 text-center font-mono text-[10px]">{displayDate}</td>
                <td className="py-2.5 px-2 text-center sticky left-0 bg-emerald-100 z-10">★</td>
                <td className="py-2.5 px-2 text-center uppercase">STATEWIDE</td>
                <td className="py-2.5 px-3 uppercase sticky left-12 bg-emerald-100 z-10">
                  STATE GRAND TOTAL (169 ULBs)
                </td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.totHH.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-right font-mono text-emerald-900">{grandTotal.segHH.toLocaleString()}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.genMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.wetGenMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.dryGenMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-teal-900">{grandTotal.wetProc.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-teal-900">{grandTotal.compostMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-teal-900">{grandTotal.manureMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-cyan-900">{grandTotal.recycSoldMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-blue-900">{grandTotal.recycSentMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-indigo-900">{grandTotal.cementMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-900">{grandTotal.sanCapMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-900">{grandTotal.sanIncinMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-amber-900">{grandTotal.specProcMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-violet-900">{grandTotal.totDryProcMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{grandTotal.totProcMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-rose-900">{grandTotal.dumpMT.toFixed(2)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-emerald-900">{grandTotal.avgProcPct}%</td>
                <td className="py-2.5 px-2 text-center">
                  {getFlagBadge(
                    grandTotal.segHH > grandTotal.totHH ? "Segregated HH>Total HH" : grandTotal.totProcMT > grandTotal.genMT ? "Processed>Generation" : "OK",
                    grandTotal.segHH,
                    grandTotal.totHH,
                    grandTotal.totProcMT,
                    grandTotal.genMT
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
