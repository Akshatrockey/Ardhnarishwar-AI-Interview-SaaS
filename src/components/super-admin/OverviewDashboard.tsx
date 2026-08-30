import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppDataStore } from '../../services/storage';
import { 
  Building2, 
  Users, 
  Bot, 
  Activity, 
  ArrowUpRight, 
  Cpu, 
  TrendingUp, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const { allCompanies } = useTenant();
  const candidates = AppDataStore.getCandidates();
  const sessions = AppDataStore.getSessions();
  const questions = AppDataStore.getQuestions();
  const auditLogs = AppDataStore.getAuditLogs().slice(0, 5);

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
            onClick={() => onNavigateTab('live_control_center')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Live Control Center</span>
          </button>

          <button
            onClick={() => onNavigateTab('live_conference')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 shadow-md transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Join Live Video Room (Zoom)</span>
          </button>

          <button
            onClick={() => onNavigateTab('ai_training')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-all active:scale-95"
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI Training Studio</span>
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Client Companies</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{allCompanies.length}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              +33% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Active multi-tenant organizations</p>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Interviews Conducted</span>
            <Bot className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{sessions.length}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              +100% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Zero 3rd-party API dependency</p>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shortlist Acceptance</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{acceptanceRatio}%</span>
            <span className="text-xs font-semibold text-cyan-400 font-mono">Calibrated</span>
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
            <span className="text-3xl font-extrabold text-white">{questions.length}</span>
            <span className="text-xs font-semibold text-slate-400 font-mono">Rubrics</span>
          </div>
          <p className="text-[11px] text-slate-500">Curated robotics & engineering Qs</p>
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
