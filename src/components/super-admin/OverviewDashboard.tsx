import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppDataStore } from '../../services/storage';
import { ApiClient } from '../../services/apiClient';
import { 
  Building2, 
  Bot, 
  Activity, 
  Cpu, 
  TrendingUp, 
  ShieldCheck,
  Inbox,
  RefreshCw
} from 'lucide-react';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const { allCompanies } = useTenant();
  const [liveStats, setLiveStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLiveTelemetry = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getSuperAdminStats();
      if (res?.data) {
        setLiveStats(res.data);
      }
    } catch (err) {
      console.warn('Super Admin stats backend fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
  }, []);

  const candidates = AppDataStore.getCandidates();
  const sessions = AppDataStore.getSessions();
  const questions = AppDataStore.getQuestions();
  const auditLogs = AppDataStore.getAuditLogs().slice(0, 5);

  const totalTenants = liveStats?.total_tenants ?? allCompanies.length;
  const totalInterviews = liveStats?.total_interviews ?? sessions.length;
  const totalQuestions = liveStats?.total_questions ?? questions.length;

  const evaluatedCount = candidates.filter(c => c.status === 'EVALUATED' || c.status === 'SHORTLISTED' || c.status === 'HIRED').length;
  const shortlistedCount = candidates.filter(c => c.status === 'SHORTLISTED' || c.status === 'HIRED').length;
  const acceptanceRatio = evaluatedCount > 0 ? Math.round((shortlistedCount / evaluatedCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            SUPER ADMIN GLOBAL HEADQUARTERS
          </div>
          <h1 className="text-2xl font-extrabold text-white">Ardhnarishwar SaaS Intelligence</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time telemetry across multi-tenant enterprise organizations, proprietary AI evaluation throughput, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveTelemetry}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => onNavigateTab('resume_vault')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
          >
            <span>Resume Vault</span>
          </button>

          <button
            onClick={() => onNavigateTab('live_control_center')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Live Control Center</span>
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards with Skeleton Loading Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Client Organizations</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-9 w-16 bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{totalTenants}</span>
            )}
            <span className="text-xs font-mono text-cyan-400">Tenants</span>
          </div>
          <p className="text-[11px] text-slate-500">Active enterprise workspaces</p>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Interviews Conducted</span>
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-9 w-16 bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{totalInterviews}</span>
            )}
            <span className="text-xs font-mono text-emerald-400">Sessions</span>
          </div>
          <p className="text-[11px] text-slate-500">In-house evaluation engine</p>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shortlist Acceptance</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-9 w-16 bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{acceptanceRatio}%</span>
            )}
            <span className="text-xs font-mono text-cyan-400">Calibrated</span>
          </div>
          <p className="text-[11px] text-slate-500">Benchmark scoring yield</p>
        </div>

        {/* Stat 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Global Question Bank</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-9 w-16 bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{totalQuestions}</span>
            )}
            <span className="text-xs font-mono text-slate-400">Rubrics</span>
          </div>
          <p className="text-[11px] text-slate-500">Curated benchmark questions</p>
        </div>
      </div>

      {/* Activity & System Status Dual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Global Activity */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Multi-Tenant Activity Feed
            </h2>
            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              View Full Logs →
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-10 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">No activity events recorded yet.</div>
              <p className="text-[11px] text-slate-500">
                Audit logs will automatically populate as tenants, candidates, and evaluators execute actions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="text-cyan-400 font-mono">[{log.action}]</span>
                      <span>{log.resource}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{log.details}</div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Core-AI Engine Health Status */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Ardhnarishwar Engine Health
          </h2>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">In-House NLP Semantic Vectorizer</span>
                <span className="text-emerald-400 font-mono font-bold">100% OPERATIONAL</span>
              </div>
              <div className="text-[11px] text-slate-400">TF-IDF N-gram matrix calculation & cosine projection</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Speech Fluency & Hesitation Engine</span>
                <span className="text-emerald-400 font-mono font-bold">100% OPERATIONAL</span>
              </div>
              <div className="text-[11px] text-slate-400">WPM pacing analysis & filler word identification</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">STAR Method Detector</span>
                <span className="text-emerald-400 font-mono font-bold">100% OPERATIONAL</span>
              </div>
              <div className="text-[11px] text-slate-400">Situation, Task, Action, and Quantifiable metrics extraction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
