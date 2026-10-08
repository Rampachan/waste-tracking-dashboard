import React, { useState, useEffect } from 'react';
import { logService, ulbService, facilityService } from '../services/api';
import {
  Save, CheckCircle2, AlertCircle, History, Factory, Home, Trash2, Calendar,
  Lock, ShieldAlert, Sparkles, Scale, Recycle, Award, RotateCcw, RefreshCw,
  AlertTriangle, Plus, Building2, Layers, X
} from 'lucide-react';

export default function DailyEntryForm({ user }) {
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [ulbData, setUlbData] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [facilityLogs, setFacilityLogs] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Modal state for adding a new facility
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacility, setNewFacility] = useState({
    facility_type: 'MCC',
    name: '',
    capacity_mt: 2.0,
    location: ''
  });
  const [addingFacility, setAddingFacility] = useState(false);

  // Form state with all SWM fields
  const [formData, setFormData] = useState({
    total_households: 0,
    door_to_door_hhs: 0,
    segregated_hh_collected: 0,
    total_generation_today_mt: 0,
    
    // Wet Waste
    mcc_capacity: 0,
    mcc_actual: 0,
    biometh_capacity: 0,
    biometh_actual: 0,
    compost_output_mt: 0,
    
    // Dry Waste
    mrf_capacity: 0,
    mrf_actual: 0,
    other_capacity: 0,
    other_actual: 0,
    recyclable_sold_mt: 0,
    dry_waste_cement_mt: 0,
    
    // Final Status
    dump_yard_mt: 0
  });

  // Load ULB profile, facilities & existing log for targetDate
  useEffect(() => {
    if (!user || !user.ulb_id) return;
    loadUlbAndLog();
    loadHistory();
  }, [user, targetDate]);

  const loadUlbAndLog = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const ulb = await ulbService.getById(user.ulb_id);
      setUlbData(ulb);

      // Fetch specific facilities (MCCs & MRFs) for this ULB
      let facs = [];
      try {
        facs = await facilityService.getFacilities(user.ulb_id);
        setFacilities(facs);
      } catch (fErr) {
        console.error('Error loading facilities:', fErr);
      }

      // Check if there is an existing log for targetDate
      const dailyLogs = await logService.getDaily(targetDate);
      const existing = dailyLogs.find(l => l.ulb_id === user.ulb_id && l.is_submitted);

      if (existing) {
        setFormData({
          total_households: existing.total_households || ulb.households,
          door_to_door_hhs: existing.door_to_door_hhs || 0,
          segregated_hh_collected: existing.segregated_hh_collected ?? existing.door_to_door_hhs ?? 0,
          total_generation_today_mt: existing.total_generation_today_mt || 0,

          mcc_capacity: existing.mcc_capacity ?? ulb.default_mcc_capacity,
          mcc_actual: existing.mcc_actual || 0,
          biometh_capacity: existing.biometh_capacity ?? ulb.default_biometh_capacity,
          biometh_actual: existing.biometh_actual || 0,
          compost_output_mt: existing.compost_output_mt || 0,

          mrf_capacity: existing.mrf_capacity ?? ulb.default_mrf_capacity,
          mrf_actual: existing.mrf_actual || 0,
          other_capacity: existing.other_capacity ?? ulb.default_other_capacity,
          other_actual: existing.other_actual || 0,
          recyclable_sold_mt: existing.recyclable_sold_mt || 0,
          dry_waste_cement_mt: existing.dry_waste_cement_mt || 0,

          dump_yard_mt: existing.dump_yard_mt || 0
        });

        // Map existing itemized facility logs if available
        const fLogMap = {};
        if (existing.facility_logs && existing.facility_logs.length > 0) {
          existing.facility_logs.forEach(fl => {
            fLogMap[fl.facility_id] = {
              actual_processed_mt: fl.actual_processed_mt || 0,
              operational_status: fl.operational_status || 'Operational',
              notes: fl.notes || ''
            };
          });
        } else {
          // Initialize with 0 for each facility
          facs.forEach(f => {
            fLogMap[f.id] = {
              actual_processed_mt: 0,
              operational_status: 'Operational',
              notes: ''
            };
          });
        }
        setFacilityLogs(fLogMap);
        setDraftRestored(false);
      } else {
        // Check for unsaved local draft
        const draftKey = `swm_draft_${user.ulb_id}_${targetDate}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setFormData(parsed.formData || parsed);
            if (parsed.facilityLogs) {
              setFacilityLogs(parsed.facilityLogs);
            } else {
              const defaultFLogs = {};
              facs.forEach(f => {
                defaultFLogs[f.id] = { actual_processed_mt: 0, operational_status: 'Operational', notes: '' };
              });
              setFacilityLogs(defaultFLogs);
            }
            setDraftRestored(true);
          } catch (e) {
            localStorage.removeItem(draftKey);
          }
        } else {
          // Pre-fill default frozen targets
          const defaultCovered = Math.round(ulb.households * 0.92);
          setFormData({
            total_households: ulb.households,
            door_to_door_hhs: defaultCovered,
            segregated_hh_collected: Math.round(defaultCovered * 0.95),
            total_generation_today_mt: 0,

            mcc_capacity: ulb.default_mcc_capacity,
            mcc_actual: 0,
            biometh_capacity: ulb.default_biometh_capacity,
            biometh_actual: 0,
            compost_output_mt: 0,

            mrf_capacity: ulb.default_mrf_capacity,
            mrf_actual: 0,
            other_capacity: ulb.default_other_capacity,
            other_actual: 0,
            recyclable_sold_mt: 0,
            dry_waste_cement_mt: 0,

            dump_yard_mt: 0
          });

          const defaultFLogs = {};
          facs.forEach(f => {
            defaultFLogs[f.id] = { actual_processed_mt: 0, operational_status: 'Operational', notes: '' };
          });
          setFacilityLogs(defaultFLogs);
          setDraftRestored(false);
        }
      }
    } catch (err) {
      console.error('Error loading ULB data:', err);
      const isNet = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setLoadError(
        isNet
          ? 'Network connection failed: Unable to fetch ULB master baseline data. Please verify your connection.'
          : (err.response?.data?.detail || 'Failed to load ULB data.')
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await logService.getHistory(user.ulb_id, 14);
      setHistory(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field, val) => {
    const num = parseFloat(val);
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: isNaN(num) ? 0 : num
      };
      saveDraftToLocalStorage(updated, facilityLogs);
      return updated;
    });
  };

  const handleFacilityLogChange = (facilityId, field, val) => {
    setFacilityLogs(prev => {
      const existing = prev[facilityId] || { actual_processed_mt: 0, operational_status: 'Operational', notes: '' };
      let updatedVal = val;
      if (field === 'actual_processed_mt') {
        const num = parseFloat(val);
        updatedVal = isNaN(num) ? 0 : num;
      }
      const updated = {
        ...prev,
        [facilityId]: {
          ...existing,
          [field]: updatedVal
        }
      };
      saveDraftToLocalStorage(formData, updated);
      return updated;
    });
  };

  const saveDraftToLocalStorage = (fData, fLogs) => {
    try {
      localStorage.setItem(`swm_draft_${user.ulb_id}_${targetDate}`, JSON.stringify({
        formData: fData,
        facilityLogs: fLogs
      }));
    } catch (e) {}
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    if (!newFacility.name.trim()) return;
    setAddingFacility(true);
    try {
      const created = await facilityService.createFacility({
        ulb_id: user.ulb_id,
        facility_type: newFacility.facility_type,
        name: newFacility.name.trim(),
        capacity_mt: parseFloat(newFacility.capacity_mt) || 0,
        location: newFacility.location ? newFacility.location.trim() : null,
        status: 'Active'
      });
      setFacilities(prev => [...prev, created]);
      setFacilityLogs(prev => ({
        ...prev,
        [created.id]: { actual_processed_mt: 0, operational_status: 'Operational', notes: '' }
      }));
      setShowAddModal(false);
      setNewFacility({ facility_type: 'MCC', name: '', capacity_mt: 2.0, location: '' });
      setMessage({ type: 'success', text: `New facility "${created.name}" added successfully!` });
    } catch (err) {
      console.error('Error adding facility:', err);
      alert(err.response?.data?.detail || 'Failed to create facility');
    } finally {
      setAddingFacility(false);
    }
  };

  // Facilities filtered by type
  const mccFacilities = facilities.filter(f => f.facility_type === 'MCC');
  const mrfFacilities = facilities.filter(f => f.facility_type === 'MRF');

  // Compute live itemized MCC actual & capacity
  const computedMccActual = mccFacilities.reduce((sum, f) => {
    return sum + (facilityLogs[f.id]?.actual_processed_mt || 0);
  }, 0);

  const computedMccCapacity = mccFacilities.length > 0
    ? mccFacilities.reduce((sum, f) => sum + (f.capacity_mt || 0), 0)
    : (ulbData?.default_mcc_capacity ?? formData.mcc_capacity ?? 0);

  // Compute live itemized MRF actual & capacity
  const computedMrfActual = mrfFacilities.reduce((sum, f) => {
    return sum + (facilityLogs[f.id]?.actual_processed_mt || 0);
  }, 0);

  const computedMrfCapacity = mrfFacilities.length > 0
    ? mrfFacilities.reduce((sum, f) => sum + (f.capacity_mt || 0), 0)
    : (ulbData?.default_mrf_capacity ?? formData.mrf_capacity ?? 0);

  // Effective actual values (facility sum if facilities exist, else manual top-level)
  const effectiveMccActual = mccFacilities.length > 0 ? computedMccActual : formData.mcc_actual;
  const effectiveMrfActual = mrfFacilities.length > 0 ? computedMrfActual : formData.mrf_actual;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Build facility_logs payload array
    const facilityLogsPayload = facilities.map(f => ({
      facility_id: f.id,
      actual_processed_mt: facilityLogs[f.id]?.actual_processed_mt || 0,
      operational_status: facilityLogs[f.id]?.operational_status || 'Operational',
      notes: facilityLogs[f.id]?.notes || ''
    }));

    try {
      await logService.submitLog({
        ulb_id: user.ulb_id,
        log_date: targetDate,
        ...formData,
        mcc_actual: effectiveMccActual,
        mrf_actual: effectiveMrfActual,
        facility_logs: facilityLogsPayload
      });

      // Clear draft after success
      try {
        localStorage.removeItem(`swm_draft_${user.ulb_id}_${targetDate}`);
      } catch (e) {}
      setDraftRestored(false);
      setMessage({ type: 'success', text: `Daily Solid Waste record for ${targetDate} saved successfully!` });
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const isNet = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setMessage({
        type: 'error',
        isNetworkError: isNet,
        text: isNet
          ? 'Network connection failed: Unable to communicate with the DMA server. Your entered data has been preserved in your browser. Check your connection and click "Retry Submission".'
          : (err.response?.data?.detail || 'Failed to save daily log.')
      });
    } finally {
      setSaving(false);
    }
  };

  // Real-time calculations
  const totalHH = ulbData?.households || formData.total_households || 1;
  const d2dCoveragePct = ((formData.door_to_door_hhs / totalHH) * 100).toFixed(1);
  const segregationPct = ((formData.segregated_hh_collected / totalHH) * 100).toFixed(1);

  // Wet waste stream
  const wetWasteProcessedMT = effectiveMccActual + formData.biometh_actual;
  const wetCapacityMT = computedMccCapacity + (ulbData?.default_biometh_capacity ?? formData.biometh_capacity ?? 0);

  // Dry waste stream
  const dryFacilitiesCapacityMT = computedMrfCapacity + (ulbData?.default_other_capacity ?? formData.other_capacity ?? 0);
  const dryWasteProcessedMT = effectiveMrfActual + formData.recyclable_sold_mt + formData.dry_waste_cement_mt + formData.other_actual;

  // Totals & diversion
  const totalProcessedMT = wetWasteProcessedMT + dryWasteProcessedMT;
  const totalWasteHandledMT = totalProcessedMT + formData.dump_yard_mt;
  const processedWastePct = totalWasteHandledMT > 0 ? ((totalProcessedMT / totalWasteHandledMT) * 100).toFixed(1) : '0.0';

  // Live Data Quality Pre-Check: Rule: Segregated HH > Total HH
  const isSegregatedExceeded = totalHH > 0 && formData.segregated_hh_collected > totalHH;

  const getQualityPreview = () => {
    if (isSegregatedExceeded) {
      return {
        flag: 'Segregated HH>Total HH',
        text: `Data-Quality Flag Warning: Segregated HH (${Number(formData.segregated_hh_collected).toLocaleString()}) exceeds Total Registered Households (${Number(totalHH).toLocaleString()})!`,
        color: 'bg-rose-100 text-rose-900 border-rose-300'
      };
    }
    return {
      flag: 'OK',
      text: 'Verified: Segregated households within official registered target (Segregated HH ≤ Total HH).',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
  };

  const qualityInfo = getQualityPreview();

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-24 sm:pb-8 px-1 sm:px-0">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800">
              {ulbData?.category || 'ULB'}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">{ulbData?.region}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            {ulbData?.name || user.ulb_name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official Registered Households: <strong className="text-slate-800 font-mono">{(ulbData?.households || 0).toLocaleString()}</strong>
          </p>
        </div>

        {/* Date Selector for Entry */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 self-start sm:self-auto w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-600 flex-shrink-0">Log Date:</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer w-full"
          />
        </div>
      </div>

      {loadError && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-800 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{loadError}</span>
          </div>
          <button
            onClick={() => { loadUlbAndLog(); loadHistory(); }}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {draftRestored && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Draft Restored:</strong> Unsaved numbers from your previous session on <strong>{targetDate}</strong> were automatically recovered.
            </span>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(`swm_draft_${user.ulb_id}_${targetDate}`);
              } catch (e) {}
              setDraftRestored(false);
              loadUlbAndLog();
            }}
            className="text-[11px] underline font-medium text-amber-800 hover:text-amber-950 flex-shrink-0"
          >
            Discard Draft
          </button>
        </div>
      )}

      {message && (
        <div className={`p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
        }`}>
          <div className="flex items-start sm:items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <span className="leading-snug">{message.text}</span>
          </div>
          {message.type === 'error' && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="self-start sm:self-auto inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>Retry Submission</span>
            </button>
          )}
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* SECTION 1: Door to Door Collection & Source Segregation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-800 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                1. Door to Door Collection & Segregation
              </h3>
            </div>
            <div className="text-xs text-emerald-300 font-mono">
              Segregation: <strong className="text-white text-sm">{segregationPct}%</strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Frozen Static Households */}
            <div className="bg-slate-100/90 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>No. of Households</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-normal bg-slate-200/90 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5 text-slate-500" /> Frozen
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 my-1">
                {(ulbData?.households || formData.total_households || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Official registered master baseline</span>
            </div>

            {/* Segregated Waste Collected HHs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. of HHs segregated waste collected *
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={formData.segregated_hh_collected}
                onChange={(e) => handleChange('segregated_hh_collected', e.target.value)}
                required
                className={`w-full px-3 py-2 text-base sm:text-sm rounded-lg focus:outline-none font-mono font-bold shadow-sm transition-colors ${
                  isSegregatedExceeded
                    ? 'border-2 border-rose-500 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border-2 border-emerald-500 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
                }`}
                placeholder="e.g. 18500"
              />
              {isSegregatedExceeded ? (
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                  ⚠️ Segregated HH ({Number(formData.segregated_hh_collected).toLocaleString()}) &gt; Total HH ({Number(totalHH).toLocaleString()})
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Households providing segregated waste</span>
              )}
            </div>

            {/* Door to Door Collection Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total D2D Covered HHs (Optional)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={formData.door_to_door_hhs}
                onChange={(e) => handleChange('door_to_door_hhs', e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-900 shadow-sm"
                placeholder="e.g. 19500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>D2D: <strong className="text-slate-700">{d2dCoveragePct}%</strong></span>
                <span>Segregated: <strong className="text-emerald-700">{segregationPct}%</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Total Waste Generation Today */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-800 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                2. Daily Waste Generation
              </h3>
            </div>
            <span className="text-xs text-slate-300 font-mono">Weighbridge / Estimated</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total waste generation Today (MT) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={formData.total_generation_today_mt}
                onChange={(e) => handleChange('total_generation_today_mt', e.target.value)}
                required
                className="w-full px-3 py-2 text-base sm:text-sm bg-white border-2 border-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 shadow-sm"
                placeholder="e.g. 45.50"
              />
              <span className="text-[10px] text-slate-500">Total estimated or weighbridge waste generated today in MT</span>
            </div>

            <div className="w-full sm:w-1/2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Daily Generation Benchmark:</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-bold font-mono text-slate-800">
                  {formData.total_generation_today_mt > 0 ? `${formData.total_generation_today_mt.toFixed(2)} MT` : 'Not recorded'}
                </span>
                {formData.total_generation_today_mt > 0 && totalHH > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    (~{((formData.total_generation_today_mt * 1000) / (totalHH * 4.2)).toFixed(2)} kg/capita/day)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: WET WASTE Processing & Output (MCC Facilities) */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-900 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Factory className="w-4 h-4 text-emerald-300" />
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                3. WET WASTE Processing (MCC Facilities) & Output
              </h3>
            </div>
            <div className="text-xs text-emerald-200 font-mono">
              Total Wet: <strong className="text-white">{wetWasteProcessedMT.toFixed(2)} MT</strong> / Cap: <strong className="text-emerald-200">{wetCapacityMT.toFixed(2)} MT</strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Summary Banner for MCC Facilities */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Micro Composting Centres (MCC) Aggregated Output</span>
                <span className="text-[11px] text-emerald-800">
                  Input waste processed across specific MCC facilities is automatically summed for overall SWM state dashboard KPIs.
                </span>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Total MCC Actual</span>
                  <span className="text-lg font-bold font-mono text-emerald-900">{effectiveMccActual.toFixed(2)} MT</span>
                </div>
                <div className="text-right border-l border-emerald-300 pl-3">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Total Capacity</span>
                  <span className="text-lg font-bold font-mono text-slate-700">{computedMccCapacity.toFixed(2)} MT</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewFacility({ facility_type: 'MCC', name: '', capacity_mt: 2.0, location: '' });
                    setShowAddModal(true);
                  }}
                  className="ml-2 inline-flex items-center space-x-1 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add MCC</span>
                </button>
              </div>
            </div>

            {/* Individual MCC Facility Cards */}
            {mccFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mccFacilities.map((f, idx) => {
                  const logItem = facilityLogs[f.id] || { actual_processed_mt: 0, operational_status: 'Operational', notes: '' };
                  return (
                    <div key={f.id} className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Capacity: <strong>{f.capacity_mt} MT</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Processed Today (MT) *
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={logItem.actual_processed_mt}
                            onChange={(e) => handleFacilityLogChange(f.id, 'actual_processed_mt', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm bg-white border border-emerald-400 rounded-lg font-mono font-bold text-emerald-900 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Status
                          </label>
                          <select
                            value={logItem.operational_status}
                            onChange={(e) => handleFacilityLogChange(f.id, 'operational_status', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none"
                          >
                            <option value="Operational">Operational</option>
                            <option value="Partial">Partial</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Non-Functional">Non-Functional</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-emerald-950">MCCs / Windrow (Overall Daily Input)</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                    <Lock className="w-2 h-2" /> Cap: {(ulbData?.default_mcc_capacity ?? formData.mcc_capacity ?? 0).toFixed(1)} MT
                  </span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.mcc_actual}
                  onChange={(e) => handleChange('mcc_actual', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border border-emerald-400 rounded font-mono font-bold text-emerald-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Wet waste incoming to MCC in MT</span>
              </div>
            )}

            {/* Other Wet Components: BioMethanation & Compost Output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-100">
              {/* BioMethanation Actual */}
              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-950">BioMethanation Plant</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                    <Lock className="w-2 h-2" /> Cap: {(ulbData?.default_biometh_capacity ?? formData.biometh_capacity ?? 0).toFixed(1)} MT
                  </span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.biometh_actual}
                  onChange={(e) => handleChange('biometh_actual', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border border-amber-400 rounded font-mono font-bold text-amber-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Wet waste incoming to BioMeth in MT</span>
              </div>

              {/* Output quantity as compost per day (MT) */}
              <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-teal-600" /> Output Compost (MT) *
                  </span>
                  <span className="text-[10px] bg-teal-200/80 text-teal-900 px-1.5 py-0.2 rounded font-medium">Product</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.compost_output_mt}
                  onChange={(e) => handleChange('compost_output_mt', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border-2 border-teal-500 rounded font-mono font-bold text-teal-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Finished compost harvested today in MT</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DRY WASTE Processing & Off-take (MRF Facilities) */}
        <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
          <div className="bg-cyan-900 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Recycle className="w-4 h-4 text-cyan-300" />
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                4. DRY WASTE Processing (MRF Facilities), Recovery & Disposal
              </h3>
            </div>
            <div className="text-xs text-cyan-200 font-mono">
              Facilities Cap: <strong className="text-white">{dryFacilitiesCapacityMT.toFixed(2)} MT</strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Summary Banner for MRF Facilities */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-cyan-950 block">Material Recovery Facilities (MRF) Aggregated Output</span>
                <span className="text-[11px] text-cyan-800">
                  Dry waste processed across specific MRF sorting facilities is automatically aggregated for official state tracking.
                </span>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-cyan-700 block uppercase font-bold">Total MRF Actual</span>
                  <span className="text-lg font-bold font-mono text-cyan-900">{effectiveMrfActual.toFixed(2)} MT</span>
                </div>
                <div className="text-right border-l border-cyan-300 pl-3">
                  <span className="text-[10px] text-cyan-700 block uppercase font-bold">Total Capacity</span>
                  <span className="text-lg font-bold font-mono text-slate-700">{computedMrfCapacity.toFixed(2)} MT</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewFacility({ facility_type: 'MRF', name: '', capacity_mt: 3.0, location: '' });
                    setShowAddModal(true);
                  }}
                  className="ml-2 inline-flex items-center space-x-1 bg-cyan-700 hover:bg-cyan-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add MRF</span>
                </button>
              </div>
            </div>

            {/* Individual MRF Facility Cards */}
            {mrfFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mrfFacilities.map((f, idx) => {
                  const logItem = facilityLogs[f.id] || { actual_processed_mt: 0, operational_status: 'Operational', notes: '' };
                  return (
                    <div key={f.id} className="p-3.5 bg-cyan-50/40 border border-cyan-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-700 text-white text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{f.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Capacity: <strong>{f.capacity_mt} MT</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Processed Today (MT) *
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={logItem.actual_processed_mt}
                            onChange={(e) => handleFacilityLogChange(f.id, 'actual_processed_mt', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm bg-white border border-cyan-400 rounded-lg font-mono font-bold text-cyan-900 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Status
                          </label>
                          <select
                            value={logItem.operational_status}
                            onChange={(e) => handleFacilityLogChange(f.id, 'operational_status', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none"
                          >
                            <option value="Operational">Operational</option>
                            <option value="Partial">Partial</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Non-Functional">Non-Functional</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-cyan-950">MRF Sorting / Processed</span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                    <Lock className="w-2 h-2" /> Cap: {(ulbData?.default_mrf_capacity ?? formData.mrf_capacity ?? 0).toFixed(1)} MT
                  </span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.mrf_actual}
                  onChange={(e) => handleChange('mrf_actual', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border border-cyan-400 rounded font-mono font-bold text-cyan-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Dry waste processed in MRF in MT</span>
              </div>
            )}

            {/* Other Dry Recovery Components */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-100">
              {/* Recyclable waste sold by sanitary workers (MT) */}
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-950">Recyclables Sold by Workers *</span>
                  <span className="text-[10px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded font-medium">Recovery</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.recyclable_sold_mt}
                  onChange={(e) => handleChange('recyclable_sold_mt', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border-2 border-blue-500 rounded font-mono font-bold text-blue-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Sold recyclables (paper, plastic, scrap) in MT</span>
              </div>

              {/* Dry waste disposed (Cement industries / recycling units) (MT) */}
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-950">Dry Waste to Cement / Plants *</span>
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded font-medium">RDF</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.dry_waste_cement_mt}
                  onChange={(e) => handleChange('dry_waste_cement_mt', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-base sm:text-sm bg-white border-2 border-indigo-500 rounded font-mono font-bold text-indigo-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">RDF / combustible waste to cement kilns</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Dump Yard & Real-Time Status */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="bg-rose-900 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-300" />
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
                5. Dump Yard & SWM Performance Status
              </h3>
            </div>
            <span className="text-xs text-rose-200">Reject / Landfill Load</span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waste sent to dumping yard (MT) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={formData.dump_yard_mt}
                  onChange={(e) => handleChange('dump_yard_mt', e.target.value)}
                  required
                  className="w-full px-3 py-2 text-base sm:text-sm bg-white border-2 border-rose-400 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold text-rose-900"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-500">Unprocessed waste sent to dump yard</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">Total Processed Waste:</span>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                  {totalProcessedMT.toFixed(2)} MT
                </div>
                <span className="text-[10px] text-slate-400">Wet ({wetWasteProcessedMT.toFixed(1)}) + Dry ({dryWasteProcessedMT.toFixed(1)})</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">% of Processed Waste:</span>
                <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                  {processedWastePct}%
                </div>
                <span className="text-[10px] text-slate-400">Diversion from landfill</span>
              </div>
            </div>

            {/* Live Data Quality Pre-Check Badge */}
            <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${qualityInfo.color}`}>
              {qualityInfo.flag === 'VALID' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold uppercase tracking-wide">
                  Data-Quality Flag: {qualityInfo.flag}
                </div>
                <div className="text-[11px] mt-0.5 leading-relaxed">
                  {qualityInfo.text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Submit Button */}
        <div className="hidden sm:flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Daily Log...' : `Submit Daily Log (${targetDate})`}</span>
          </button>
        </div>
      </form>

      {/* Floating Sticky Mobile Submit Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-30 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 truncate">
            Proc: <strong className="text-emerald-700">{totalProcessedMT.toFixed(1)} MT</strong> • Flag: <strong className={qualityInfo.flag === 'VALID' ? 'text-emerald-600' : 'text-amber-600'}>{qualityInfo.flag}</strong>
          </div>
          <div className="text-[11px] font-bold text-slate-700 truncate">{targetDate}</div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-shrink-0 inline-flex items-center space-x-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md active:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Submit Log'}</span>
        </button>
      </div>

      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Add New SWM Facility</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facility Type *
                </label>
                <select
                  value={newFacility.facility_type}
                  onChange={(e) => setNewFacility({ ...newFacility, facility_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="MCC">MCC (Micro Composting Centre - Wet Waste)</option>
                  <option value="MRF">MRF (Material Recovery Facility - Dry Waste)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  required
                  placeholder="e.g. MCC #3 - Bus Stand Unit"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Processing Capacity (MT/day) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={newFacility.capacity_mt}
                  onChange={(e) => setNewFacility({ ...newFacility, capacity_mt: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Ward (Optional)
                </label>
                <input
                  type="text"
                  value={newFacility.location}
                  onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
                  placeholder="e.g. Ward 12, Main Road"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFacility}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {addingFacility ? 'Creating...' : 'Save Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Grid (Desktop Table + Mobile Cards) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mt-6">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
            Past Submissions for {ulbData?.name} (Recent 14 Days)
          </h3>
        </div>

        {/* Mobile View: Clean Touch Cards */}
        <div className="block sm:hidden space-y-2.5">
          {history.map((h) => (
            <div key={h.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                <span className="font-bold text-slate-800">{h.log_date}</span>
                <button
                  onClick={() => {
                    setTargetDate(h.log_date);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-emerald-700 font-semibold text-[11px] hover:underline"
                >
                  Edit Record
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Segregated HHs:</span>
                  <span className="font-bold font-mono ml-1">{(h.segregated_hh_collected || h.door_to_door_hhs || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">Gen Today:</span>
                  <span className="font-bold font-mono ml-1">{h.total_generation_today_mt?.toFixed(1) || '0.0'} MT</span>
                </div>
                <div>
                  <span className="text-slate-500">Processed:</span>
                  <span className="font-bold font-mono text-emerald-700 ml-1">{h.total_processed_mt?.toFixed(1)} MT</span>
                </div>
                <div>
                  <span className="text-slate-500">Dump Yard:</span>
                  <span className="font-bold font-mono text-rose-600 ml-1">{h.dump_yard_mt?.toFixed(1)} MT</span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Processing: {h.processed_waste_pct ?? h.diversion_rate_pct}%</span>
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                  h.data_quality_flag === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {h.data_quality_flag || 'VALID'}
                </span>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No recent submission history found for this ULB.
            </div>
          )}
        </div>

        {/* Desktop View Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-2">Segregated HHs</th>
                <th className="py-2.5 px-2">Gen Today</th>
                <th className="py-2.5 px-2">Wet Proc MT</th>
                <th className="py-2.5 px-2">Compost MT</th>
                <th className="py-2.5 px-2">Dry Recyc MT</th>
                <th className="py-2.5 px-2">Cement RDF MT</th>
                <th className="py-2.5 px-2">Total Proc</th>
                <th className="py-2.5 px-2">Dump Yard</th>
                <th className="py-2.5 px-2">% Processed</th>
                <th className="py-2.5 px-2">Flag</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-800">{h.log_date}</td>
                  <td className="py-2 px-2 font-mono">{(h.segregated_hh_collected || h.door_to_door_hhs || 0).toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono font-semibold">{h.total_generation_today_mt?.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 font-mono text-emerald-700 font-bold">{h.wet_waste_processed_mt?.toFixed(2) || (h.mcc_actual + h.biometh_actual).toFixed(2)}</td>
                  <td className="py-2 px-2 font-mono text-teal-700">{h.compost_output_mt?.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 font-mono text-blue-700">{h.recyclable_sold_mt?.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 font-mono text-indigo-700">{h.dry_waste_cement_mt?.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 font-mono font-bold text-slate-900">{h.total_processed_mt?.toFixed(2)}</td>
                  <td className="py-2 px-2 font-mono font-bold text-rose-600">{h.dump_yard_mt?.toFixed(2)}</td>
                  <td className="py-2 px-2 font-mono font-semibold text-emerald-600">{h.processed_waste_pct ?? h.diversion_rate_pct}%</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      h.data_quality_flag === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {h.data_quality_flag || 'VALID'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => {
                        setTargetDate(h.log_date);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-emerald-600 hover:text-emerald-800 font-semibold"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
