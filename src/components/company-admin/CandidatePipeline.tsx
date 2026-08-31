import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus, JobPosition } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useTenant } from '../../context/TenantContext';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Mail, 
  Sparkles,
  Bot,
  FileText,
  Video
} from 'lucide-react';

interface CandidatePipelineProps {
  onSelectCandidate: (candidateId: string) => void;
  onLaunchLiveInterview: (candidate: Candidate) => void;
  onLaunchConference?: (candidate: Candidate) => void;
}

export const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
  onSelectCandidate,
  onLaunchLiveInterview,
  onLaunchConference,
}) => {
  const { currentCompany } = useTenant();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(4);
  const [selectedJobId, setSelectedJobId] = useState('');

  const refreshData = () => {
    const allCand = AppDataStore.getCandidates().filter(c => 
      !currentCompany || c.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setCandidates(allCand);

    const allJobs = AppDataStore.getJobs().filter(j =>
      !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setJobs(allJobs);
    if (allJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(allJobs[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany]);

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const token = `TOKEN_${firstName.toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newCandidate: Candidate = {
      id: `cand_${Date.now()}`,
      companyId: currentCompany.id,
      jobId: selectedJobId,
      firstName,
      lastName,
      email,
      phone,
      yearsOfExperience,
      status: 'INVITED',
      interviewToken: token,
      appliedAt: new Date().toISOString(),
      resumeFileName: `${firstName}_${lastName}_CV.pdf`,
    };

    const all = AppDataStore.getCandidates();
    AppDataStore.saveCandidates([newCandidate, ...all]);
    setCandidates([newCandidate, ...candidates]);

    AppDataStore.logActivity({
      companyId: currentCompany.id,
      actorId: 'usr_recruiter',
      actorName: 'Recruiter Lead',
      actorRole: 'RECRUITER',
      action: 'INTERVIEW_INVITATION_SENT',
      resource: `Candidate: ${firstName} ${lastName}`,
      details: `Generated single-use magic token: ${token} for position ${selectedJobId}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    setShowInviteModal(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  const copyInviteLink = (cand: Candidate) => {
    const inviteUrl = `${window.location.origin}/?token=${cand.interviewToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(cand.id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Candidate Pipeline & Talent Assessment</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage candidates, send autonomous AI interview invitations, and review timestamped video evaluations.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Candidate</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidates by name, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Status:</span>
          {(['ALL', 'INVITED', 'EVALUATED', 'SHORTLISTED', 'REJECTED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                statusFilter === st 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Target Position</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">AI Scorecard</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCandidates.map(c => {
                const targetJob = jobs.find(j => j.id === c.jobId);
                const hasEvaluation = c.status === 'EVALUATED' || c.status === 'SHORTLISTED' || c.status === 'REJECTED';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs">
                          {c.firstName[0]}
                        </div>
                        <span>{c.firstName} {c.lastName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-9">{c.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-200">
                      <div className="font-medium">{targetJob?.title || 'Lead Robotics Perception Engineer'}</div>
                      <div className="text-[10px] text-slate-500">{targetJob?.department || 'Autonomous Systems'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {c.yearsOfExperience} Years
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                        c.status === 'SHORTLISTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                        c.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        c.status === 'EVALUATED' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                        'bg-indigo-950 text-indigo-300 border-indigo-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {hasEvaluation ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-cyan-400 font-mono">
                            {c.firstName === 'Vikram' ? '91%' : '88%'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                            Strong Hire
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Pending Interview</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {hasEvaluation && (
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => {
                                const updated = candidates.map(cand => cand.id === c.id ? { ...cand, status: 'SHORTLISTED' as CandidateStatus } : cand);
                                AppDataStore.saveCandidates(updated);
                                setCandidates(updated);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                c.status === 'SHORTLISTED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                              }`}
                              title="Mark as Shortlisted"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => {
                                const updated = candidates.map(cand => cand.id === c.id ? { ...cand, status: 'REJECTED' as CandidateStatus } : cand);
                                AppDataStore.saveCandidates(updated);
                                setCandidates(updated);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                c.status === 'REJECTED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                              }`}
                              title="Mark as Rejected"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {onLaunchConference && (c.status === 'SHORTLISTED' || c.status === 'EVALUATED' || c.status === 'HIRED') && (
                          <button
                            onClick={() => onLaunchConference(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all inline-flex items-center gap-1"
                            title="Connect candidate in live video room"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Panel</span>
                          </button>
                        )}

                        {hasEvaluation ? (
                          <button
                            onClick={() => onSelectCandidate(c.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Scorecard</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onLaunchLiveInterview(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all inline-flex items-center gap-1"
                            title="Run Candidate Interview"
                          >
                            <Play className="w-3 h-3" />
                            <span>Interview</span>
                          </button>
                        )}

                        <button
                          onClick={() => copyInviteLink(c)}
                          className="px-2 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors inline-flex items-center gap-1"
                          title="Copy Candidate Magic Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedToken === c.id ? <span className="text-emerald-400">Copied!</span> : <span>Link</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Candidate Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Generate Candidate Interview Invitation</h2>
            <form onSubmit={handleCreateInvite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Arjun"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Patel"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun.patel@robotics-labs.com"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (415) 555-0199"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Select Job Position</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Generate Invitation Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
