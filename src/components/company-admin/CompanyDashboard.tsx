import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppDataStore } from '../../services/storage';
import { 
  Users, 
  Briefcase, 
  Bot, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Play, 
  Plus, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface CompanyDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectCandidate: (candidateId: string) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  onNavigateTab,
  onSelectCandidate,
}) => {
  const { currentCompany } = useTenant();
  const candidates = AppDataStore.getCandidates().filter(c => 
    !currentCompany || c.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
  );
  const jobs = AppDataStore.getJobs().filter(j => 
    !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
  );

  const evaluated = candidates.filter(c => c.status === 'EVALUATED' || c.status === 'SHORTLISTED' || c.status === 'REJECTED');
  const shortlisted = candidates.filter(c => c.status === 'SHORTLISTED');
  const pending = candidates.filter(c => c.status === 'INVITED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" />
            {currentCompany?.name || 'Cyberdyne Autonomous Systems'} Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Robotics Interview Control Center</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Autonomous talent screening, timestamped interview video analysis, and multi-vector candidate scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('candidates')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Candidate</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Openings</span>
            <Briefcase className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{jobs.length}</span>
            <span className="text-xs font-mono text-cyan-400">Positions</span>
          </div>
          <p className="text-[11px] text-slate-500">Autonomous rounds attached</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Candidates</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{candidates.length}</span>
            <span className="text-xs text-emerald-400 flex items-center font-semibold">
              +4 this week <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Across all engineering tracks</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Evaluated</span>
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{evaluated.length}</span>
            <span className="text-xs font-mono text-emerald-400">Dossiers</span>
          </div>
          <p className="text-[11px] text-slate-500">Complete timestamped videos</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shortlisted Talent</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{shortlisted.length}</span>
            <span className="text-xs font-mono text-purple-400">Ready</span>
          </div>
          <p className="text-[11px] text-slate-500">Passed passing score cutoff</p>
        </div>
      </div>

      {/* Candidate Dossier Spotlight & Open Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spotlight Candidate */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Latest Evaluated Candidate Dossier
            </h2>
            <button
              onClick={() => onNavigateTab('candidates')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              View Pipeline →
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-900/40 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                  VS
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vikram Singh</h3>
                  <p className="text-xs text-slate-400">Lead Robotics Perception & Kinematics Engineer</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-extrabold text-cyan-400 font-mono">91/100</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  STRONG HIRE
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
              "Demonstrates deep mastery of non-linear robot kinematics, Jacobian singularity management, and Damped Least Squares. Extremely crisp communication at 141 WPM with zero hesitation."
            </p>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>4 Video Questions • 18m Duration</span>
              </div>

              <button
                onClick={() => onSelectCandidate('cand_vikram_singh')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Scorecard & Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Openings */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Active Job Positions ({jobs.length})
            </h2>
            <button
              onClick={() => onNavigateTab('jobs')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              Manage →
            </button>
          </div>

          <div className="space-y-2.5">
            {jobs.map(j => (
              <div
                key={j.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-200">{j.title}</div>
                  <div className="text-[11px] text-slate-400">{j.department} • {j.experienceLevel}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
