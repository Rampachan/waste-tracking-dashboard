import React, { useState, useEffect } from 'react';
import { uwmService } from '../services/api';
import {
  Droplets, Calendar, Building2, Send, CheckCircle2, AlertTriangle,
  Lock, Waves, ShieldCheck, Gauge, Activity, Recycle, ArrowRight,
  TrendingUp, Clock, FileCheck, Layers, Info
} from 'lucide-react';

export default function UwmDataEntryForm({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    sewage_inflow_mld: 0,
    stp_functional: 'Yes',
    stp_location_name: '',
    utilization_capacity_mld: 0,
    performance_standards: 'Compliant',
    discharge_point: 'River',
    treated_reuse_mld: 0,
    reuse_purpose: 'Gardening / Parks',
    sludge_generation_mt: 0,
    sludge_management: 'Co-composting',
    functional_pumping_stations: 0,
    functional_lifting_stations: 0
  });

  useEffect(() => {
    if (user && user.ulb_id) {
      loadBaselineAndLog();
      loadHistory();
    }
  }, [user, selectedDate]);

  const loadBaselineAndLog = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const bData = await uwmService.getBaselineById(user.ulb_id);
      setBaseline(bData);

      // Check if there is an existing log for selectedDate
      const dailyLogs = await uwmService.getDailyLogs(selectedDate);
      const existing = dailyLogs.find(l => l.ulb_id === user.ulb_id && l.id > 0);

      if (existing) {
        setFormData({
          sewage_inflow_mld: existing.sewage_inflow_mld || 0,
          stp_functional: existing.stp_functional || (bData.installed_stp_capacity_mld > 0 ? 'Yes' : 'No'),
          stp_location_name: existing.stp_location_name || bData.stp_location_name || '',
          utilization_capacity_mld: existing.utilization_capacity_mld || 0,
          performance_standards: existing.performance_standards || 'Compliant',
          discharge_point: existing.discharge_point || 'River',
          treated_reuse_mld: existing.treated_reuse_mld || 0,
          reuse_purpose: existing.reuse_purpose || 'Gardening / Parks',
          sludge_generation_mt: existing.sludge_generation_mt || 0,
          sludge_management: existing.sludge_management || 'Co-composting',
          functional_pumping_stations: existing.functional_pumping_stations || bData.no_of_pumping_stations || 0,
          functional_lifting_stations: existing.functional_lifting_stations || bData.no_of_lifting_stations || 0
        });
      } else {
        // Defaults from baseline
        setFormData({
          sewage_inflow_mld: 0,
          stp_functional: bData.installed_stp_capacity_mld > 0 ? 'Yes' : 'No',
          stp_location_name: bData.stp_location_name || (bData.installed_stp_capacity_mld > 0 ? `${bData.ulb_name} Central STP` : ''),
          utilization_capacity_mld: 0,
          performance_standards: bData.installed_stp_capacity_mld > 0 ? 'Compliant' : 'Not Applicable',
          discharge_point: bData.installed_stp_capacity_mld > 0 ? 'River' : 'Drain',
          treated_reuse_mld: 0,
          reuse_purpose: 'Gardening / Parks',
          sludge_generation_mt: 0,
          sludge_management: 'Co-composting',
          functional_pumping_stations: bData.no_of_pumping_stations || 0,
          functional_lifting_stations: bData.no_of_lifting_stations || 0
        });
      }
    } catch (err) {
      console.error('Error loading UWM baseline:', err);
      setMessage({ type: 'error', text: 'Failed to load baseline data from server.' });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await uwmService.getHistory(user.ulb_id, 10);
      setHistory(hist);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Live Calculations
  const installedStp = baseline?.installed_stp_capacity_mld || 0;
  const utilCap = parseFloat(formData.utilization_capacity_mld) || 0;
  const liveUtilizationPct = installedStp > 0 ? Math.min(200, Math.round((utilCap / installedStp) * 100)) : 0;
  
  const totalGen = baseline?.total_sewage_generation_mld || 0;
  const inflow = parseFloat(formData.sewage_inflow_mld) || 0;
  const inflowPct = totalGen > 0 ? Math.round((inflow / totalGen) * 100) : 0;

  const targetHh = baseline?.targeted_households || 0;
  const connHh = baseline?.connected_households || 0;
  const sewerCoveragePct = targetHh > 0 ? Math.round((connHh / targetHh) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ulb_id: user.ulb_id,
        log_date: selectedDate,
        sewage_inflow_mld: parseFloat(formData.sewage_inflow_mld) || 0,
        stp_functional: formData.stp_functional,
        stp_location_name: formData.stp_location_name,
        utilization_capacity_mld: parseFloat(formData.utilization_capacity_mld) || 0,
        performance_standards: formData.performance_standards,
        discharge_point: formData.discharge_point,
        treated_reuse_mld: parseFloat(formData.treated_reuse_mld) || 0,
        reuse_purpose: formData.reuse_purpose,
        sludge_generation_mt: parseFloat(formData.sludge_generation_mt) || 0,
        sludge_management: formData.sludge_management,
        functional_pumping_stations: parseInt(formData.functional_pumping_stations) || 0,
        functional_lifting_stations: parseInt(formData.functional_lifting_stations) || 0
      };

      await uwmService.submitLog(payload);
      setMessage({ type: 'success', text: `Daily UWM operational report for ${selectedDate} submitted successfully!` });
      loadHistory();
    } catch (err) {
      console.error('Error submitting UWM log:', err);
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit daily UWM log. Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading UWM master data & operational records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-slate-900 text-white p-6 rounded-2xl border border-cyan-700/50 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-cyan-500/20 border border-cyan-400/40 rounded-xl text-cyan-300 shadow-inner">
              <Waves className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  UWM Operations Portal
                </span>
                <span className="text-xs text-cyan-200/80 font-mono">ULB S.No: #{baseline?.pdf_s_no || '-'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                {baseline?.ulb_name || user?.ulb_name || 'ULB'} Used Water Management
              </h2>
              <p className="text-xs text-cyan-200/70">
                {baseline?.ulb_region} • {baseline?.ulb_category} • Directorate of Municipal Administration
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-900/90 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-xs shadow-inner">
            <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="text-slate-300 mr-2 font-medium">Log Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 0: FIXED BASELINE CARD (FROZEN FOR OPERATORS) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-md p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-300">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Official Directorate Baseline (Fixed & Frozen)
            </h3>
          </div>
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
            Read-Only for ULB • Editable by Director / HQ only
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sewage Gen</span>
            <span className="text-lg font-black text-cyan-300">{baseline?.total_sewage_generation_mld || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1">MLD</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Targeted HHs</span>
            <span className="text-lg font-black text-white">{baseline?.targeted_households?.toLocaleString() || 0}</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected HHs</span>
            <span className="text-lg font-black text-emerald-400">{baseline?.connected_households?.toLocaleString() || 0}</span>
            <span className="text-[10px] text-emerald-300/80 ml-1">({sewerCoveragePct}%)</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Installed STP</span>
            <span className="text-lg font-black text-cyan-300">{baseline?.installed_stp_capacity_mld || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1">MLD</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pumping Stns</span>
            <span className="text-lg font-black text-white">{baseline?.no_of_pumping_stations || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1">Units</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lifting Stns</span>
            <span className="text-lg font-black text-white">{baseline?.no_of_lifting_stations || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1">Units</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: SEWAGE ESTIMATION & MEASUREMENT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Sewage Status Estimation and Measurement</h3>
              <p className="text-xs text-slate-500">Record actual sewage inflow received into the municipal network today</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Sewage Inflow Received Today (MLD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5000"
                  required
                  value={formData.sewage_inflow_mld}
                  onChange={(e) => handleInputChange('sewage_inflow_mld', e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-2.5 text-sm font-bold text-slate-400">MLD</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Baseline generation: <strong>{totalGen} MLD</strong>. Enter measured hydraulic inflow.
              </p>
            </div>

            <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-cyan-900">Hydraulic Load Factor:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  inflowPct > 120 ? 'bg-amber-100 text-amber-900' : 'bg-cyan-100 text-cyan-900'
                }`}>
                  {inflowPct}% of Baseline Generation
                </span>
              </div>
              <div className="w-full bg-cyan-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, inflowPct)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-cyan-800/80 mt-2">
                {inflowPct > 120 
                  ? '⚠️ Inflow is elevated above baseline, indicating storm runoff or high water demand.'
                  : 'Normal operational inflow recorded.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: SEWAGE / CONVEYANCE SEWERS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Sewage / Conveyance Sewers</h3>
              <p className="text-xs text-slate-500">Underground sewerage network coverage in municipal limits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-600 font-medium">Targeted Households to Sewers:</span>
                <span className="text-sm font-black text-slate-900">{targetHh.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-600 font-medium">Households Connected:</span>
                <span className="text-sm font-black text-emerald-700">{connHh.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${sewerCoveragePct}%` }}
                ></div>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block text-right font-bold">{sewerCoveragePct}% Coverage</span>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Info className="w-5 h-5 flex-shrink-0" />
              </div>
              <p className="text-xs text-indigo-950 leading-relaxed">
                Targeted and connected household counts are locked according to the approved DMA Underground Sewerage Scheme (UGSS) project documentation.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: SEWAGE TREATMENT AND UTILISATION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">3. Sewage Treatment and Utilisation</h3>
              <p className="text-xs text-slate-500">STP/FSTP functionality, utilization capacity, effluent standards & reuse</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* STP Functional Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                STP/FSTP Functional Today?
              </label>
              <div className="flex space-x-2">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleInputChange('stp_functional', opt)}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${
                      formData.stp_functional === opt
                        ? opt === 'Yes' 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* STP Location Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                STP Location Name
              </label>
              <input
                type="text"
                value={formData.stp_location_name}
                onChange={(e) => handleInputChange('stp_location_name', e.target.value)}
                placeholder="e.g. Ondipudur STP"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
            </div>

            {/* Installed Treatment Capacity (Frozen) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Installed Capacity (Frozen)
              </label>
              <div className="px-3.5 py-2 text-sm font-bold bg-slate-100 border border-slate-300 rounded-xl text-slate-700 flex justify-between items-center">
                <span>{installedStp} MLD</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Utilization Capacity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Utilization Capacity Today (MLD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5000"
                  required
                  value={formData.utilization_capacity_mld}
                  onChange={(e) => handleInputChange('utilization_capacity_mld', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">MLD</span>
              </div>
            </div>

            {/* Live % Utilization Gauge Card */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                % Utilization (Live Auto-Formula)
              </label>
              <div className={`px-3.5 py-2 rounded-xl border flex items-center justify-between font-black ${
                installedStp === 0 
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : liveUtilizationPct >= 70 && liveUtilizationPct <= 100
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : liveUtilizationPct > 100
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                <span className="text-sm">
                  {installedStp === 0 ? 'N/A (No STP)' : `${liveUtilizationPct}%`}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {installedStp === 0 ? '-' : liveUtilizationPct > 100 ? 'Overload' : liveUtilizationPct >= 70 ? 'Optimal' : 'Underutilized'}
                </span>
              </div>
            </div>

            {/* Performance Reference to Standards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Performance vs TNPCB Standards
              </label>
              <select
                value={formData.performance_standards}
                onChange={(e) => handleInputChange('performance_standards', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="Compliant">Compliant (BOD &lt; 10, TSS &lt; 20)</option>
                <option value="Within Limits">Within Permissible Limits</option>
                <option value="Non-Compliant">Non-Compliant / Exceeds Norms</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            {/* Final Point of Discharge */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Final Discharge Point
              </label>
              <select
                value={formData.discharge_point}
                onChange={(e) => handleInputChange('discharge_point', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="River">River (e.g. Cauvery, Vaigai, Tamirabarani)</option>
                <option value="Lake / Pond">Lake / Water Body</option>
                <option value="Land / Agriculture">Land Application / Agriculture</option>
                <option value="Industrial Reuse">Industrial Supply</option>
                <option value="Drain">Drainage Channel</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Utilisation (MLD) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Treated Water Reused (MLD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5000"
                  value={formData.treated_reuse_mld}
                  onChange={(e) => handleInputChange('treated_reuse_mld', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">MLD</span>
              </div>
            </div>

            {/* Utilisation Purpose */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reuse Purpose
              </label>
              <select
                value={formData.reuse_purpose}
                onChange={(e) => handleInputChange('reuse_purpose', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="Gardening / Parks">Gardening / Municipal Parks</option>
                <option value="Agriculture / Irrigation">Agriculture / Agro-forestry</option>
                <option value="Industrial Reuse">Industrial Cooling / Processing</option>
                <option value="Flushing / Construction">Road Flushing / Construction</option>
                <option value="None">None</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sludge Generation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Sludge Generation (MT/Day)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000"
                  value={formData.sludge_generation_mt}
                  onChange={(e) => handleInputChange('sludge_generation_mt', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">MT</span>
              </div>
            </div>

            {/* Sludge Management */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Sludge Management
              </label>
              <select
                value={formData.sludge_management}
                onChange={(e) => handleInputChange('sludge_management', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                <option value="Co-composting">Co-composting with Wet Waste</option>
                <option value="Solar Drying Beds">Solar Drying Beds</option>
                <option value="Secured Landfill">Secured Landfill</option>
                <option value="Bio-methanation">Bio-methanation Plant</option>
                <option value="None">None</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4 & 5: PUMPING AND LIFTING STATIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pumping Stations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center space-x-2.5 mb-3 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                <Gauge className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">4. Pumping Stations</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Existing</span>
                <span className="text-base font-black text-slate-800">{baseline?.no_of_pumping_stations || 0} Units</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Functional Today
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={formData.functional_pumping_stations}
                  onChange={(e) => handleInputChange('functional_pumping_stations', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
            </div>
          </div>

          {/* Lifting Stations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center space-x-2.5 mb-3 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">5. Lifting Stations</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Existing</span>
                <span className="text-base font-black text-slate-800">{baseline?.no_of_lifting_stations || 0} Units</span>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Functional Today
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={formData.functional_lifting_stations}
                  onChange={(e) => handleInputChange('functional_lifting_stations', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting to Directorate...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Daily UWM Report</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* RECENT SUBMISSIONS HISTORY TABLE */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-100">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Recent UWM Daily Submissions for {baseline?.ulb_name}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Inflow (MLD)</th>
                  <th className="py-2.5 px-3">STP Util (MLD)</th>
                  <th className="py-2.5 px-3">% Util</th>
                  <th className="py-2.5 px-3">Reused (MLD)</th>
                  <th className="py-2.5 px-3">Standards</th>
                  <th className="py-2.5 px-3">Pumping</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{h.log_date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{h.sewage_inflow_mld}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{h.utilization_capacity_mld}</td>
                    <td className="py-2.5 px-3 font-bold text-cyan-800">{h.utilization_pct}%</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">{h.treated_reuse_mld}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {h.performance_standards}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {h.functional_pumping_stations}/{h.baseline_pumping_stations}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {h.data_quality_flag || 'VALID'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
