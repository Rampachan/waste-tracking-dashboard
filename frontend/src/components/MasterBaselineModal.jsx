import React, { useState, useEffect } from 'react';
import { ulbService } from '../services/api';
import { X, Lock, Save, Search, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export default function MasterBaselineModal({ isOpen, onClose, onUpdated }) {
  if (!isOpen) return null;

  const [ulbs, setUlbs] = useState([]);
  const [selectedUlbId, setSelectedUlbId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [editData, setEditData] = useState({
    households: 0,
    default_mcc_capacity: 0,
    default_mrf_capacity: 0,
    default_biometh_capacity: 0,
    default_other_capacity: 0
  });

  useEffect(() => {
    loadUlbs();
  }, []);

  const loadUlbs = async () => {
    setLoading(true);
    try {
      const data = await ulbService.getAll();
      setUlbs(data);
      if (data.length > 0) {
        selectUlb(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectUlb = (ulb) => {
    setSelectedUlbId(ulb.id);
    setMessage(null);
    setEditData({
      households: ulb.households,
      default_mcc_capacity: ulb.default_mcc_capacity,
      default_mrf_capacity: ulb.default_mrf_capacity,
      default_biometh_capacity: ulb.default_biometh_capacity,
      default_other_capacity: ulb.default_other_capacity
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedUlbId) return;

    setSaving(true);
    setMessage(null);
    try {
      const updated = await ulbService.updateStaticData(selectedUlbId, editData);
      setMessage({ type: 'success', text: `Static baseline for ${updated.name} updated successfully!` });
      // Update local list
      setUlbs(prev => prev.map(u => u.id === selectedUlbId ? updated : u));
      if (onUpdated) onUpdated();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update static baseline.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUlbs = ulbs.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUlb = ulbs.find(u => u.id === selectedUlbId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Master Static Baseline Manager
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 font-semibold uppercase">
                  HQ / Admin Access Only
                </span>
              </h3>
              <p className="text-xs text-slate-400">Modify officially frozen household targets and installed capacities</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Left ULB Selector */}
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ULB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
              {filteredUlbs.map(u => (
                <button
                  key={u.id}
                  onClick={() => selectUlb(u)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${
                    u.id === selectedUlbId
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <div>{u.name}</div>
                    <div className={`text-[10px] ${u.id === selectedUlbId ? 'text-slate-400' : 'text-slate-400'}`}>
                      {u.region}
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    u.category === 'Corporation'
                      ? (u.id === selectedUlbId ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800')
                      : (u.id === selectedUlbId ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')
                  }`}>
                    {u.category === 'Corporation' ? 'Corp' : 'Mun'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Edit Form */}
          <div className="md:col-span-2 p-6 overflow-y-auto">
            {currentUlb ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">{currentUlb.region}</span>
                    <h4 className="text-xl font-bold text-slate-800">{currentUlb.name}</h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {currentUlb.category}
                  </span>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Households Target */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Official Target Households
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.households}
                    onChange={(e) => setEditData(prev => ({ ...prev, households: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Base denominator for daily Door-to-Door % calculations</span>
                </div>

                {/* Facility Capacities */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Installed Facility Capacities (MT / day)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                        MCCs / Windrow (MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.default_mcc_capacity}
                        onChange={(e) => setEditData(prev => ({ ...prev, default_mcc_capacity: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="p-3 bg-cyan-50/50 rounded-lg border border-cyan-200">
                      <label className="block text-[11px] font-semibold text-cyan-950 mb-1">
                        MRFs (MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.default_mrf_capacity}
                        onChange={(e) => setEditData(prev => ({ ...prev, default_mrf_capacity: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-cyan-300 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                      <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                        BioMethanation Plant (MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.default_biometh_capacity}
                        onChange={(e) => setEditData(prev => ({ ...prev, default_biometh_capacity: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded font-mono font-bold"
                      />
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200">
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Other Facility (MT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.default_other_capacity}
                        onChange={(e) => setEditData(prev => ({ ...prev, default_other_capacity: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-300 rounded font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Authorized HQ modification</span>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Frozen Baseline</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-slate-400">Select an ULB from the list</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
