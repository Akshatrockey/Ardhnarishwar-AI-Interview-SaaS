import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AppDataStore, copyToClipboard } from '../../services/storage';
import { ApiClient } from '../../services/apiClient';
import { Candidate, JobPosition } from '../../types';
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
  Sparkles,
  Inbox,
  UserPlus,
  X,
  Send,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

interface CompanyDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectCandidate: (candidateId: string) => void;
  onLaunchLiveInterview?: (candidate: Candidate) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  onNavigateTab,
  onSelectCandidate,
  onLaunchLiveInterview,
}) => {
  const { currentCompany } = useTenant();
  const [candidates, setCandidates] = useState<Candidate[]>(() => 
    AppDataStore.getCandidates().filter(c => 
      !currentCompany || c.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    )
  );
  const [jobs, setJobs] = useState<JobPosition[]>(() =>
    AppDataStore.getJobs().filter(j => 
      !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    )
  );

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteJobId, setInviteJobId] = useState<string>('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteExperience, setInviteExperience] = useState<number>(3);
  const [inviteSkillCategory, setInviteSkillCategory] = useState<'SKILLED' | 'UNSKILLED' | 'SEMI_SKILLED'>('SKILLED');
  const [createdInviteResult, setCreatedInviteResult] = useState<{ candidate: Candidate; link: string; jobTitle: string } | null>(null);
  const [copiedLinkState, setCopiedLinkState] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const refreshDashboardData = () => {
    const cands = AppDataStore.getCandidates().filter(c => 
      !currentCompany || c.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setCandidates(cands);
    const jbs = AppDataStore.getJobs().filter(j => 
      !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setJobs(jbs);
  };

  const handleOpenInvite = (jobId?: string) => {
    setInviteError(null);
    setCreatedInviteResult(null);
    setInviteFirstName('');
    setInviteLastName('');
    setInviteEmail('');
    setInvitePhone('');
    setInviteExperience(3);
    setInviteSkillCategory('SKILLED');
    if (jobId) {
      setInviteJobId(jobId);
    } else if (jobs.length > 0) {
      setInviteJobId(jobs[0].id);
    } else {
      setInviteJobId('');
    }
    setShowInviteModal(true);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()) {
      setInviteError('First Name, Last Name, and Email are required.');
      return;
    }

    const assignedJobId = inviteJobId || (jobs.length > 0 ? jobs[0].id : '');
    if (!assignedJobId) {
      setInviteError('Please select a valid Job Opening.');
      return;
    }

    const targetJob = jobs.find(j => j.id === assignedJobId) || jobs[0];
    const companyId = currentCompany?.id || targetJob?.companyId || 'comp_ardhnarishwar';

    setInviteSubmitting(true);
    const cleanFirstName = inviteFirstName.trim();
    const cleanLastName = inviteLastName.trim();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    const token = `TOKEN_${cleanFirstName.toUpperCase().replace(/[^A-Z]/g, '') || 'CAND'}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const candidateId = `cand_${Date.now()}`;

    const newCandidate: Candidate = {
      id: candidateId,
      companyId,
      jobId: assignedJobId,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      phone: invitePhone.trim() || '',
      skillCategory: inviteSkillCategory,
      yearsOfExperience: Number(inviteExperience) || 0,
      status: 'INVITED',
      interviewToken: token,
      appliedAt: new Date().toISOString(),
      resumeFileName: `${cleanFirstName}_${cleanLastName}_CV.pdf`,
    };

    const allCands = AppDataStore.getCandidates();
    AppDataStore.saveCandidates([newCandidate, ...allCands]);

    const allJobs = AppDataStore.getJobs();
    const updatedJobs = allJobs.map(j => j.id === assignedJobId ? { ...j, totalApplicants: (j.totalApplicants || 0) + 1 } : j);
    AppDataStore.saveJobs(updatedJobs);

    try {
      await ApiClient.applyForJob({
        first_name: newCandidate.firstName,
        last_name: newCandidate.lastName,
        email: newCandidate.email,
        phone: newCandidate.phone,
        job_id: assignedJobId,
        skill_category: newCandidate.skillCategory,
        years_of_experience: newCandidate.yearsOfExperience,
        skills: targetJob?.requiredSkills || [],
      });
    } catch {
      // Local fallback active
    }

    AppDataStore.logActivity({
      companyId,
      actorId: 'usr_recruiter',
      actorName: 'Recruiter Lead',
      actorRole: 'RECRUITER',
      action: 'INTERVIEW_INVITATION_SENT',
      resource: `Candidate: ${newCandidate.firstName} ${newCandidate.lastName}`,
      details: `Generated single-use magic token: ${token} for position ${targetJob?.title || assignedJobId}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    refreshDashboardData();
    setInviteSubmitting(false);
    setShowInviteModal(false);

    const magicLink = `${window.location.origin}/?token=${token}`;
    setCreatedInviteResult({
      candidate: newCandidate,
      link: magicLink,
      jobTitle: targetJob?.title || 'Open Position',
    });
  };

  const handleCopyInviteLink = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedLinkState(true);
      setTimeout(() => setCopiedLinkState(false), 2500);
    }
  };

  const evaluated = candidates.filter(c => c.status === 'EVALUATED' || c.status === 'SHORTLISTED' || c.status === 'REJECTED' || c.status === 'HIRED');
  const shortlisted = candidates.filter(c => c.status === 'SHORTLISTED' || c.status === 'HIRED');
  const latestEvaluated = evaluated[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-semibold">
            <Bot className="w-3.5 h-3.5" />
            {currentCompany?.name || 'Enterprise'} Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Interview & Recruitment Dashboard</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Autonomous talent screening, timestamped interview video analysis, and multi-vector candidate scorecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenInvite()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            title="Invite a candidate to interview with AI"
          >
            <UserPlus className="w-4 h-4" />
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
            <span className="text-xs text-slate-400 flex items-center font-semibold">
              Pipeline total
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
          <p className="text-[11px] text-slate-500">Completed interviews</p>
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
          <p className="text-[11px] text-slate-500">Passed score benchmarks</p>
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

          {latestEvaluated ? (
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-900/40 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    {latestEvaluated.firstName[0]}{latestEvaluated.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{latestEvaluated.firstName} {latestEvaluated.lastName}</h3>
                    <p className="text-xs text-slate-400">{latestEvaluated.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {latestEvaluated.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Applied: {new Date(latestEvaluated.appliedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => onSelectCandidate(latestEvaluated.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Scorecard</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No evaluated candidates yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Invite candidates to take AI proctored interviews to see automated evaluation scorecards here.
              </p>
            </div>
          )}
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

          {jobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">No active job positions created yet.</div>
              <button
                onClick={() => onNavigateTab('jobs')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Create First Job
              </button>
            </div>
          ) : (
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                      {j.status}
                    </span>
                    <button
                      onClick={() => handleOpenInvite(j.id)}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 active:scale-95"
                      title={`Invite Candidate to ${j.title}`}
                    >
                      <UserPlus className="w-3 h-3 text-cyan-400" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD INVITE CANDIDATE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  <UserPlus className="w-3 h-3" />
                  <span>Interview Invitation</span>
                </div>
                <h2 className="text-xl font-black text-white">Generate Candidate Invite</h2>
                <p className="text-xs text-slate-400">
                  Provision an autonomous AI screening session and single-use magic access token.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Target Job Opening *</label>
                <select
                  value={inviteJobId}
                  onChange={(e) => setInviteJobId(e.target.value)}
                  required
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} • {j.department} ({j.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">First Name *</label>
                  <input
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="e.g. Arjun"
                    className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Last Name *</label>
                  <input
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="arjun.sharma@example.com"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={inviteExperience}
                    onChange={(e) => setInviteExperience(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Role Classification</label>
                <select
                  value={inviteSkillCategory}
                  onChange={(e) => setInviteSkillCategory(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
                >
                  <option value="SKILLED">Skilled Technical (Autonomous Questions + Code)</option>
                  <option value="SEMI_SKILLED">Semi-Skilled / Technician (Practical Evaluation)</option>
                  <option value="UNSKILLED">Workforce / Entry Level (Conversational Verification)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{inviteSubmitting ? 'Generating...' : 'Generate Invitation Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD INVITE CREATED SUCCESS DIALOG */}
      {createdInviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Invitation Created!</h2>
              <p className="text-xs text-slate-400">
                Candidate is registered in your pipeline and the magic interview link is active.
              </p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-semibold">Candidate:</span>
                <span className="font-bold text-white">
                  {createdInviteResult.candidate.firstName} {createdInviteResult.candidate.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-semibold">Email:</span>
                <span className="font-mono text-cyan-300">{createdInviteResult.candidate.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-semibold">Position:</span>
                <span className="font-bold text-indigo-300">{createdInviteResult.jobTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-semibold">Access Token:</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                  {createdInviteResult.candidate.interviewToken}
                </span>
              </div>
            </div>

            {/* Magic Link */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Candidate Direct Chamber URL
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-cyan-900/60 text-xs">
                <input
                  readOnly
                  value={createdInviteResult.link}
                  className="flex-1 bg-transparent font-mono text-cyan-300 outline-none truncate text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => handleCopyInviteLink(createdInviteResult.link)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiedLinkState
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                  }`}
                >
                  {copiedLinkState ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {onLaunchLiveInterview && (
                <button
                  type="button"
                  onClick={() => {
                    const cand = createdInviteResult.candidate;
                    setCreatedInviteResult(null);
                    onLaunchLiveInterview(cand);
                  }}
                  className="w-full sm:flex-1 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Candidate Chamber Now</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCreatedInviteResult(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
