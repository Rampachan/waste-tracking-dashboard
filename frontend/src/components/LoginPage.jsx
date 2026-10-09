import React, { useState } from 'react';
import { authService } from '../services/api';
import { Building2, Lock, User, ShieldCheck, ArrowRight, AlertCircle, Loader2, Droplets, Trash2 } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedModule, setSelectedModule] = useState(() => {
    return localStorage.getItem('active_module') || 'SWM';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(() => {
    const msg = sessionStorage.getItem('session_expired_reason');
    if (msg) {
      sessionStorage.removeItem('session_expired_reason');
      return msg;
    }
    return null;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSessionExpiredMsg(null);

    try {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();
      const data = await authService.login(cleanUsername, cleanPassword);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('active_module', selectedModule);
      onLoginSuccess(data, selectedModule);
    } catch (err) {
      const serverDetail = err.response?.data?.detail;
      if (typeof serverDetail === 'string') {
        setError(serverDetail);
      } else if (Array.isArray(serverDetail)) {
        setError(serverDetail.map(d => d.msg || JSON.stringify(d)).join(', '));
      } else if (err.message) {
        setError(err.message === 'Network Error' ? 'Network Error: Cannot connect to server. Please verify backend is running.' : err.message);
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const isSwm = selectedModule === 'SWM';

  return (
    <div className={`min-h-screen bg-gradient-to-br transition-colors duration-500 flex flex-col justify-center py-10 sm:px-6 lg:px-8 ${
      isSwm
        ? 'from-slate-900 via-slate-800 to-emerald-950'
        : 'from-slate-950 via-slate-900 to-cyan-950'
    }`}>
      {/* Tamil Nadu Emblem & Directorate Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className={`inline-flex p-3 rounded-2xl mb-3 shadow-inner border transition-all duration-300 ${
          isSwm
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        }`}>
          {isSwm ? <Building2 className="w-10 h-10" /> : <Droplets className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Government of Tamil Nadu
        </h2>
        <p className={`text-xs font-semibold tracking-wide uppercase mt-1 transition-colors ${
          isSwm ? 'text-emerald-300' : 'text-cyan-300'
        }`}>
          Directorate of Municipal Administration (DMA)
        </p>
        <p className="text-sm text-slate-300 mt-1 font-medium">
          {isSwm
            ? 'Solid Waste Management (SWM) Portal • 170 ULBs'
            : 'Used Water Management (UWM) Portal • 170 ULBs'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Module Switcher Tabs: SWM vs UWM */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl mb-4">
          <button
            type="button"
            onClick={() => { setSelectedModule('SWM'); setError(''); }}
            className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              isSwm
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Solid Waste (SWM)</span>
          </button>
          <button
            type="button"
            onClick={() => { setSelectedModule('UWM'); setError(''); }}
            className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
              !isSwm
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Used Water (UWM)</span>
          </button>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-9">
          {/* Active Module Indicator Banner */}
          <div className={`mb-5 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            isSwm
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-cyan-50/80 border-cyan-200 text-cyan-900'
          }`}>
            <span className="flex items-center gap-1.5">
              {isSwm ? <Trash2 className="w-3.5 h-3.5 text-emerald-600" /> : <Droplets className="w-3.5 h-3.5 text-cyan-600" />}
              <span>{isSwm ? 'SWM Municipal Waste Authentication' : 'UWM Used Water & Sanitation Authentication'}</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isSwm ? 'bg-emerald-200 text-emerald-800' : 'bg-cyan-200 text-cyan-800'
            }`}>
              {selectedModule}
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {sessionExpiredMsg && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 shadow-sm animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Session Expired</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{sessionExpiredMsg}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / ULB Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. director, hq, or ulb_coimbatore"
                  className={`block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 bg-slate-50 focus:bg-white ${
                    isSwm
                      ? 'focus:ring-emerald-500 focus:border-emerald-500'
                      : 'focus:ring-cyan-500 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 bg-slate-50 focus:bg-white ${
                    isSwm
                      ? 'focus:ring-emerald-500 focus:border-emerald-500'
                      : 'focus:ring-cyan-500 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all disabled:opacity-50 ${
                  isSwm
                    ? 'bg-emerald-600 hover:bg-emerald-500 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                    : 'bg-cyan-600 hover:bg-cyan-500 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to {selectedModule} Portal</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Context-Aware Demo Quick Logins */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-2">
              {isSwm ? 'SWM Demo Logins (Click to autofill):' : 'UWM Demo Logins (Click to autofill):'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('director', 'director@123')}
                className={`p-2 text-left rounded-lg border transition-colors ${
                  isSwm
                    ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                    : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                }`}
              >
                <div className="font-bold text-slate-800">
                  {isSwm ? 'SWM Director' : 'UWM Director'}
                </div>
                <div className="text-[10px] text-slate-500">Statewide Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('hq_officer', 'hq@123')}
                className={`p-2 text-left rounded-lg border transition-colors ${
                  isSwm
                    ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                    : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                }`}
              >
                <div className="font-bold text-slate-800">
                  {isSwm ? 'SWM HQ Command' : 'UWM HQ Command'}
                </div>
                <div className="text-[10px] text-slate-500">All 170 ULBs</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('ulb_coimbatore', 'ulb@123')}
                className={`p-2 text-left rounded-lg border transition-colors ${
                  isSwm
                    ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                    : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                }`}
              >
                <div className="font-bold text-slate-800">Coimbatore Corp</div>
                <div className="text-[10px] text-slate-500">
                  {isSwm ? 'SWM Waste Entry' : 'UWM Data Collection'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('ulb_chengalpattu', 'ulb@123')}
                className={`p-2 text-left rounded-lg border transition-colors ${
                  isSwm
                    ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                    : 'border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                }`}
              >
                <div className="font-bold text-slate-800">Chengalpattu Mun.</div>
                <div className="text-[10px] text-slate-500">
                  {isSwm ? 'SWM Waste Entry' : 'UWM Data Collection'}
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Government of Tamil Nadu • Directorate of Municipal Administration (170 ULBs)
        </p>
      </div>
    </div>
  );
}
