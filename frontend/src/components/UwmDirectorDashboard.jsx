import React, { useState, useEffect, useMemo } from 'react';
import { uwmService } from '../services/api';
import {
  Droplets, Calendar, Filter, Waves, Activity, CheckCircle2, AlertCircle,
  FileSpreadsheet, Search, Edit3, X, Save, Lock, ArrowUpDown, ChevronRight,
  TrendingUp, Gauge, Building2, ShieldCheck, Check, Layers, RefreshCw
} from 'lucide-react';

const REGIONS = [
  'ALL',
  'Corporation',
  'Chengalpattu Region',
  'Vellore Region',
  'Salem region',
  'Tiruppur Region',
  'Thanjavur region',
  'Tirunelveli Region',
  'Madurai Region'
];

export default function UwmDirectorDashboard({ user, targetDate: initialTargetDate, setTargetDate: setParentTargetDate }) {
  const [targetDate, setTargetDate] = useState(initialTargetDate || new Date().toISOString().split('T')[0]);
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [kpis, setKpis] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState('pdf_s_no');
  const [sortOrder, setSortOrder] = useState('asc');

  // Baseline Editing Modal (Strictly for Director, HQ, Admin)
  const [editingBaseline, setEditingBaseline] = useState(null);
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  const canEditBaseline = user?.role === 'DIRECTOR' || user?.role === 'HQ_USER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadDashboardData();
  }, [targetDate, selectedRegion]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiData, logsData] = await Promise.all([
        uwmService.getSummary(targetDate, selectedRegion),
        uwmService.getDailyLogs(targetDate, selectedRegion)
      ]);
      setKpis(kpiData);
      setLogs(logsData);
    } catch (err) {
      console.error('Error loading UWM dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await uwmService.downloadDailyExcel(targetDate);
    } catch (err) {
      console.error('Error exporting UWM excel:', err);
      alert('Failed to export UWM Excel report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenEdit = (ulbRow) => {
    setEditingBaseline({
      ulb_id: ulbRow.ulb_id,
      ulb_name: ulbRow.ulb_name,
      pdf_s_no: ulbRow.pdf_s_no,
      total_sewage_generation_mld: ulbRow.total_sewage_generation_mld,
      targeted_households: ulbRow.targeted_households,
      connected_households: ulbRow.connected_households,
      installed_stp_capacity_mld: ulbRow.installed_stp_capacity_mld,
      stp_location_name: ulbRow.stp_location_name || '',
      no_of_pumping_stations: ulbRow.baseline_pumping_stations || 0,
      no_of_lifting_stations: ulbRow.baseline_lifting_stations || 0
    });
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSaveBaseline = async (e) => {
    e.preventDefault();
    if (!editingBaseline) return;
    setSavingBaseline(true);
    setEditError(null);

    try {
      await uwmService.updateBaseline(editingBaseline.ulb_id, {
        total_sewage_generation_mld: parseFloat(editingBaseline.total_sewage_generation_mld),
        targeted_households: parseInt(editingBaseline.targeted_households),
        connected_households: parseInt(editingBaseline.connected_households),
        installed_stp_capacity_mld: parseFloat(editingBaseline.installed_stp_capacity_mld),
        stp_location_name: editingBaseline.stp_location_name,
        no_of_pumping_stations: parseInt(editingBaseline.no_of_pumping_stations),
        no_of_lifting_stations: parseInt(editingBaseline.no_of_lifting_stations)
      });

      setEditSuccess(`Baseline for ${editingBaseline.ulb_name} updated successfully!`);
      setTimeout(() => {
        setEditingBaseline(null);
        loadDashboardData();
      }, 900);
    } catch (err) {
      console.error('Failed to update baseline:', err);
      setEditError(err.response?.data?.detail || 'Failed to update static baseline.');
    } finally {
      setSavingBaseline(false);
    }
  };

  // Filtered and sorted table rows
  const filteredRows = useMemo(() => {
    return logs
      .filter((row) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          row.ulb_name?.toLowerCase().includes(q) ||
          row.ulb_region?.toLowerCase().includes(q) ||
          String(row.pdf_s_no).includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [logs, searchTerm, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* State Leadership UWM Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-cyan-950 text-white p-6 rounded-2xl border border-cyan-800/60 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-cyan-500/20 border border-cyan-400/40 rounded-xl text-cyan-300 shadow-inner">
              <Waves className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Statewide Command Center
                </span>
                <span className="text-xs text-slate-300">170 ULBs Used Water Monitoring</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Used Water Management (UWM) Command Center
              </h2>
              <p className="text-xs text-cyan-200/80">
                Consolidated Sewage Treatment Plants (STP), Faecal Sludge Treatment, & Effluent Recycling Monitoring
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center bg-slate-900/90 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white shadow-inner">
              <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  if (setParentTargetDate) setParentTargetDate(e.target.value);
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Export to Excel */}
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download UWM Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STATEWIDE KPI CARDS */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sewage Generation vs Inflow */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sewage Generation & Inflow</span>
              <span className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Activity className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{kpis.total_sewage_inflow_mld}</span>
              <span className="text-xs font-bold text-slate-500">/ {kpis.total_sewage_generation_mld} MLD</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Inflow Received</span>
                <span className="font-bold text-cyan-800">
                  {kpis.total_sewage_generation_mld > 0 ? Math.round((kpis.total_sewage_inflow_mld / kpis.total_sewage_generation_mld) * 100) : 0}% of Baseline
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((kpis.total_sewage_inflow_mld / kpis.total_sewage_generation_mld) * 100))}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 2: Household Sewerage Coverage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sewer Connections</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Layers className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{(kpis.total_connected_households / 100000).toFixed(2)}L</span>
              <span className="text-xs font-bold text-slate-500">/ {(kpis.total_targeted_households / 100000).toFixed(2)}L HHs</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Coverage Ratio</span>
                <span className="font-bold text-emerald-700">{kpis.household_sewer_coverage_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${kpis.household_sewer_coverage_pct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 3: STP Installed Capacity & Utilization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">STP Capacity & Utilization</span>
              <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Gauge className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{kpis.total_utilization_capacity_mld}</span>
              <span className="text-xs font-bold text-slate-500">/ {kpis.total_installed_stp_capacity_mld} MLD</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Avg Utilization</span>
                <span className="font-bold text-teal-800">{kpis.avg_stp_utilization_pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, kpis.avg_stp_utilization_pct)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 4: Compliance & Water Reuse */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting & Reuse</span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-slate-900">{kpis.compliance_pct}%</span>
              <span className="text-xs font-bold text-slate-500">({kpis.submitted_ulbs}/{kpis.total_ulbs} ULBs)</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-medium">Treated Reused:</span>
              <span className="font-bold text-indigo-700">{kpis.total_treated_reuse_mld} MLD</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Region Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          {REGIONS.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedRegion === reg
                  ? 'bg-cyan-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {reg === 'ALL' ? 'All 170 ULBs' : reg}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ULB name or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statewide Used Water Monitoring Master Ledger ({filteredRows.length} ULBs)
            </h3>
            <p className="text-xs text-slate-500">
              Includes baseline sewage generation, daily inflow, STP installed & utilized capacity, and standards compliance.
            </p>
          </div>
          {canEditBaseline && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-600" />
              Director / HQ Baseline Editing Enabled
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th onClick={() => toggleSort('pdf_s_no')} className="py-3 px-3 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center space-x-1">
                    <span>S.No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => toggleSort('ulb_name')} className="py-3 px-3 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center space-x-1">
                    <span>ULB Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Sewage Gen (MLD)</th>
                <th className="py-3 px-3 text-right">Inflow Today (MLD)</th>
                <th className="py-3 px-3 text-right">Target HH</th>
                <th className="py-3 px-3 text-right">Connected HH</th>
                <th className="py-3 px-3 text-center">STP Func</th>
                <th className="py-3 px-3 text-right">Inst STP (MLD)</th>
                <th className="py-3 px-3 text-right">Util STP (MLD)</th>
                <th onClick={() => toggleSort('utilization_pct')} className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center justify-center space-x-1">
                    <span>% Util</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Standards</th>
                <th className="py-3 px-3 text-right">Reuse (MLD)</th>
                <th className="py-3 px-3 text-center">Pumping</th>
                <th className="py-3 px-3 text-center">Lifting</th>
                {canEditBaseline && <th className="py-3 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const instCap = row.installed_stp_capacity_mld || 0;
                const utilPct = row.utilization_pct || 0;
                return (
                  <tr key={row.ulb_id} className="hover:bg-cyan-50/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">{row.pdf_s_no}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{row.ulb_name}</div>
                      <span className="text-[10px] text-slate-500">{row.ulb_region}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-cyan-900">
                      {row.total_sewage_generation_mld}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {row.sewage_inflow_mld > 0 ? row.sewage_inflow_mld : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {row.targeted_households?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                      {row.connected_households?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.stp_functional === 'Yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.stp_functional}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                      {instCap > 0 ? instCap : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {row.utilization_capacity_mld > 0 ? row.utilization_capacity_mld : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {instCap > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          utilPct >= 70 && utilPct <= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : utilPct > 100
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {utilPct}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-slate-600">{row.performance_standards || '-'}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                      {row.treated_reuse_mld > 0 ? row.treated_reuse_mld : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {row.functional_pumping_stations || 0}/{row.baseline_pumping_stations || 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {row.functional_lifting_stations || 0}/{row.baseline_lifting_stations || 0}
                    </td>
                    {canEditBaseline && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="p-1.5 bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 rounded-lg transition-colors"
                          title="Edit Fixed Baseline (Director/HQ Only)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BASELINE EDIT MODAL (RESTRICTED TO DIRECTOR / HQ / ADMIN) */}
      {editingBaseline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                  Baseline Master Editor (RBAC Protected)
                </span>
                <h3 className="text-base font-black text-white">
                  Edit Fixed Baseline: {editingBaseline.ulb_name}
                </h3>
              </div>
              <button
                onClick={() => setEditingBaseline(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBaseline} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                  {editSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Sewage Gen (MLD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingBaseline.total_sewage_generation_mld}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, total_sewage_generation_mld: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Installed STP (MLD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingBaseline.installed_stp_capacity_mld}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, installed_stp_capacity_mld: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Targeted HHs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingBaseline.targeted_households}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, targeted_households: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Connected HHs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingBaseline.connected_households}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, connected_households: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">STP Location Name</label>
                  <input
                    type="text"
                    value={editingBaseline.stp_location_name}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, stp_location_name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                    placeholder="e.g. Ondipudur STP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. of Pumping Stations</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBaseline.no_of_pumping_stations}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, no_of_pumping_stations: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. of Lifting Stations</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBaseline.no_of_lifting_stations}
                    onChange={(e) => setEditingBaseline(p => ({ ...p, no_of_lifting_stations: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBaseline(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBaseline}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {savingBaseline ? <span>Saving...</span> : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Baseline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
