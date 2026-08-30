import React, { useState } from 'react';
import { Candidate, CandidateStatus, JobPosition } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  Clock, 
  Sparkles, 
  Download, 
  User, 
  Briefcase, 
  Calendar, 
  X,
  Send,
  Video
} from 'lucide-react';

interface ResumeShortlistPanelProps {
  onScheduleCandidate?: (candidate: Candidate) => void;
  onViewEvaluation?: (candidateId: string) => void;
  onLaunchConference?: (candidate: Candidate) => void;
}

export const ResumeShortlistPanel: React.FC<ResumeShortlistPanelProps> = ({
  onScheduleCandidate,
  onViewEvaluation,
  onLaunchConference,
}) => {
  const { t, formatDateTime } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>(() => AppDataStore.getCandidates());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showResumeModal, setShowResumeModal] = useState<boolean>(false);

  const jobs = AppDataStore.getJobs();

  const getJobTitle = (jobId: string) => {
    return jobs.find(j => j.id === jobId)?.title || 'Robotics Engineer';
  };

  const handleUpdateStatus = (candId: string, newStatus: CandidateStatus) => {
    const updated = candidates.map(c => {
      if (c.id === candId) {
        return { ...c, status: newStatus };
      }
      return c;
    });
    setCandidates(updated);
    AppDataStore.saveCandidates(updated);

    const targetCand = candidates.find(c => c.id === candId);
    AppDataStore.logActivity({
      companyId: targetCand?.companyId,
      actorId: 'admin_usr',
      actorName: 'Talent Lead',
      actorRole: 'COMPANY_ADMIN',
      action: `CANDIDATE_STATUS_UPDATED_TO_${newStatus}`,
      resource: `${targetCand?.firstName} ${targetCand?.lastName} (${candId})`,
      details: `Candidate resume status updated to ${newStatus}.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    if (selectedCandidate && selectedCandidate.id === candId) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesFilter = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch = 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getJobTitle(c.jobId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>{t('nav.resumes', 'Resume Shortlisting & AI Screenings')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming candidate applications, inspect AI parsed competencies, and shortlist for interview rounds.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, email, ID..."
              className="bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-52"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Applications ({candidates.length})</option>
            <option value="INVITED">Invited</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="HIRED">Hired / Selected</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidate List Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredCandidates.map((cand) => {
          const matchScore = 80 + Math.abs((cand.firstName.charCodeAt(0) * 7) % 18);
          return (
            <div
              key={cand.id}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Left Column: Avatar & Basic Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {cand.firstName[0]}{cand.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{cand.firstName} {cand.lastName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
                      {cand.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Briefcase className="w-3 h-3 text-cyan-400" />
                      {getJobTitle(cand.jobId)}
                    </span>
                    <span>•</span>
                    <span>{cand.yearsOfExperience} yrs exp</span>
                    <span>•</span>
                    <span>{cand.email}</span>
                  </div>
                </div>
              </div>

              {/* Middle: AI Match & Resume File */}
              <div className="flex items-center gap-4">
                <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">AI Match</div>
                  <div className="text-sm font-extrabold text-emerald-400">{matchScore}%</div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    {cand.resumeFileName || 'Candidate_Resume.pdf'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Applied: {formatDateTime(cand.appliedAt, 'short')}
                  </span>
                </div>
              </div>

              {/* Right Column: Status & Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  cand.status === 'SHORTLISTED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  cand.status === 'HIRED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  cand.status === 'EVALUATED' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                  cand.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {cand.status}
                </span>

                <button
                  onClick={() => { setSelectedCandidate(cand); setShowResumeModal(true); }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Resume</span>
                </button>

                {onLaunchConference && (
                  <button
                    onClick={() => onLaunchConference(cand)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all active:scale-95"
                    title="Connect candidate with HR, Company Admin & Super Admin in Live Zoom Meeting"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Live Zoom Panel</span>
                  </button>
                )}

                {onScheduleCandidate && (
                  <button
                    onClick={() => onScheduleCandidate(cand)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">No applications match your criteria</div>
            <div className="text-xs text-slate-500">Try changing the status filter or clearing your search.</div>
          </div>
        )}
      </div>

      {/* Inspect Resume Modal */}
      {showResumeModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {selectedCandidate.firstName[0]}{selectedCandidate.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedCandidate.firstName} {selectedCandidate.lastName} — Resume Profile
                  </h3>
                  <div className="text-xs text-cyan-400 font-mono">{selectedCandidate.id} • {selectedCandidate.email}</div>
                </div>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Extracted Competency Overview */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Semantic Extraction Summary</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-bold border border-emerald-800">
                  94% Role Fit
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Core Expertise</div>
                  <div className="font-semibold text-slate-200">Robotics Control & ROS2</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Experience</div>
                  <div className="font-semibold text-slate-200">{selectedCandidate.yearsOfExperience} Years Track Record</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Education</div>
                  <div className="font-semibold text-slate-200">M.S. Robotics Engineering</div>
                </div>
              </div>
            </div>

            {/* Resume Text Simulation */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto space-y-3">
              <div className="font-bold text-cyan-400">SUMMARY & BACKGROUND:</div>
              <p>
                Highly experienced engineer specializing in real-time robotic systems, motion planning, ROS2 distributed node architectures, and LiDAR/Stereo sensor integration. Proven expertise optimizing low-latency trajectory algorithms.
              </p>
              <div className="font-bold text-cyan-400">TECHNICAL SKILLS:</div>
              <p>
                ROS2 (Humble/Iron), C++20, Python, OpenCV, Gazebo, MoveIt2, SLAM Navigation, PyTorch, Embedded RTOS, Docker, Git.
              </p>
              <div className="font-bold text-cyan-400">KEY ACHIEVEMENTS:</div>
              <p>
                • Reduced control loop jitter from 12ms to 1.8ms on 6-DOF robotic manipulator platform.<br/>
                • Designed automated test suite covering 45+ hardware failure scenarios.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleUpdateStatus(selectedCandidate.id, 'REJECTED')}
                className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'SHORTLISTED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shortlist for Chamber</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
