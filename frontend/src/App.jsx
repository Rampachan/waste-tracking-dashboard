import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatCards from './components/StatCards';
import ComplianceTracker from './components/ComplianceTracker';
import MasterRegionalTable from './components/MasterRegionalTable';
import DailyEntryForm from './components/DailyEntryForm';
import UwmDataEntryForm from './components/UwmDataEntryForm';
import UwmDirectorDashboard from './components/UwmDirectorDashboard';
import ExportModal from './components/ExportModal';
import MasterBaselineModal from './components/MasterBaselineModal';
import LoginPage from './components/LoginPage';
import { dashboardService, logService } from './services/api';
import { ShieldAlert, ArrowLeft, RefreshCw, AlertTriangle, WifiOff, Wifi } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem('active_module') || 'SWM';
  });
  const [user, setUser] = useState(null);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'PENDING'
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMasterSettingsOpen, setIsMasterSettingsOpen] = useState(false);

  // URL Hash Routing & Permission Enforcement
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  // Restore user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Set initial appropriate hash if empty
        if (!window.location.hash) {
          window.location.hash = parsed.role === 'ULB_USER' ? '#/entry' : '#/dashboard';
        }
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Listen to URL hash changes for permission guard
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen to global network online / offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);  

  // Listen to session expiration events from api interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Fetch data when date, user, or selectedRegion changes
  useEffect(() => {
    if (!user) return;

    if (user.role === 'DIRECTOR' || user.role === 'HQ_USER' || user.role === 'ADMIN') {
      fetchDirectorData();
    }
  }, [user, targetDate, selectedRegion]);

  const fetchDirectorData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [sumData, compData, logsData] = await Promise.all([
        dashboardService.getSummary(targetDate, selectedRegion),
        dashboardService.getCompliance(targetDate),
        logService.getDaily(targetDate, selectedRegion)
      ]);
      setSummary(sumData);
      setCompliance(compData);
      setDailyLogs(logsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const isNet = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setFetchError(
        isNet
          ? 'Network connection failure: Unable to reach the DMA monitoring server. Please verify your internet connection.'
          : (err.response?.data?.detail || 'Failed to fetch statewide monitoring records.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData, module = 'SWM') => {
    setUser(userData);
    setActiveModule(module);
    localStorage.setItem('active_module', module);
    window.location.hash = userData.role === 'ULB_USER' ? '#/entry' : '#/dashboard';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.hash = '#/login';
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Permission Guard: Check if a ULB User manually entered a restricted URL in address bar
  const isRequestingRestricted = (
    currentHash.includes('dashboard') ||
    currentHash.includes('admin') ||
    currentHash.includes('hq') ||
    currentHash.includes('master-targets') ||
    window.location.pathname.includes('dashboard') ||
    window.location.pathname.includes('admin')
  );

  const isUlbAccessDenied = user.role === 'ULB_USER' && isRequestingRestricted;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Offline Network Alert */}
      {isOffline && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Network Disconnected: You are currently offline. Live synchronization is paused until connection is restored.</span>
        </div>
      )}

      {/* Online Restored Toast */}
      {showOnlineToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-in fade-in">
          <Wifi className="w-4 h-4" />
          <span>Network Connection Restored: You are back online.</span>
        </div>
      )}

      <Navbar
        user={user}
        targetDate={targetDate}
        setTargetDate={setTargetDate}
        onLogout={handleLogout}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenMasterSettings={() => setIsMasterSettingsOpen(true)}
        activeModule={activeModule}
        setActiveModule={(mod) => {
          setActiveModule(mod);
          localStorage.setItem('active_module', mod);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Permission Guard: 403 Forbidden Screen for Restricted URL Navigation */}
        {isUlbAccessDenied ? (
          <div className="max-w-xl mx-auto my-12 bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-xl text-center animate-in fade-in">
            <div className="w-16 h-16 bg-rose-100 border border-rose-300 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-3">
              HTTP 403 • Restricted Page
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Access Denied: Protected Screen
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              You attempted to manually access a protected URL (<code>{currentHash || window.location.pathname}</code>).
              Your account <strong>{user.username}</strong> is registered as an Operator for <strong>{user.ulb_name}</strong>.
              Statewide command analytics, cross-ULB tables, and master baseline targets are strictly restricted to Directorate and HQ leadership.
            </p>
            <button
              onClick={() => {
                window.location.hash = '#/entry';
                setCurrentHash('#/entry');
              }}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {user.ulb_name} Daily Data Entry</span>
            </button>
          </div>
        ) : user.role === 'ULB_USER' ? (
          /* ULB Operator Screen: Focused Entry Form */
          activeModule === 'UWM' ? (
            <UwmDataEntryForm user={user} />
          ) : (
            <DailyEntryForm user={user} />
          )
        ) : (
          /* Director & HQ Screen: Statewide Command Center */
          activeModule === 'UWM' ? (
            <UwmDirectorDashboard
              user={user}
              targetDate={targetDate}
              setTargetDate={setTargetDate}
            />
          ) : (
            <div>
              {/* Network Fetch Error Banner with Immediate Retry */}
              {fetchError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Statewide Data Synchronization Failed</p>
                      <p className="text-xs text-rose-700">{fetchError}</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchDirectorData}
                    disabled={loading}
                    className="self-start sm:self-auto inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Retry Connection</span>
                  </button>
                </div>
              )}

              {/* Submission Compliance Progress */}
              <ComplianceTracker
                compliance={compliance}
                filterMode={filterMode}
                setFilterMode={setFilterMode}
              />

              {/* High-level KPIs */}
              <StatCards summary={summary} loading={loading} />

              {/* Hierarchical Regional Data Grid (169 ULBs) */}
              <MasterRegionalTable
                logs={dailyLogs}
                loading={loading}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                filterMode={filterMode}
              />
            </div>
          )
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultDate={targetDate}
      />

      {/* Master Baseline Management Modal (HQ / Admin Only) */}
      <MasterBaselineModal
        isOpen={isMasterSettingsOpen}
        onClose={() => setIsMasterSettingsOpen(false)}
        onUpdated={fetchDirectorData}
      />

      {/* Clean Municipal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Government of Tamil Nadu • Directorate of Municipal Administration (DMA)</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {activeModule === 'SWM'
            ? 'Solid Waste Management Daily Monitoring Portal • 100% Open-Source'
            : 'Used Water Management & Sanitation Monitoring Portal • 100% Open-Source'}
        </p>
      </footer>
    </div>
  );
}
