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
  Video,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Award,
  ArrowRight,
  GitCompare,
  ChevronRight,
  Star,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ResumeShortlistPanelProps {
  onScheduleCandidate?: (candidate: Candidate) => void;
  onViewEvaluation?: (candidateId: string) => void;
  onLaunchConference?: (candidate: Candidate) => void;
}

// Circular SVG Match Score Ring
const MatchScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 52 }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = 
    score >= 88 ? 'text-emerald-400 stroke-emerald-400' :
    score >= 75 ? 'text-cyan-400 stroke-cyan-400' : 
    'text-amber-400 stroke-amber-400';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${color}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-mono font-black text-white">{score}%</span>
      </div>
    </div>
  );
};

export const ResumeShortlistPanel: React.FC<ResumeShortlistPanelProps> = ({
  onScheduleCandidate,
  onViewEvaluation,
  onLaunchConference,
}) => {
  const { t, formatDateTime } = useLanguage();
  const [candidates, setCandidates] = useState<Candidate[]>(() => AppDataStore.getCandidates());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Advanced Filter States
  const [minExpFilter, setMinExpFilter] = useState<number>(0);
  const [highScoreOnly, setHighScoreOnly] = useState<boolean>(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');

  // Candidate Comparison Mode
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const jobs = AppDataStore.getJobs();

  const getJobTitle = (jobId: string) => {
    return jobs.find(j => j.id === jobId)?.title || 'Robotics Controls Engineer';
  };

  const computeMatchScore = (cand: Candidate) => {
    return 80 + Math.abs((cand.firstName.charCodeAt(0) * 7 + (cand.yearsOfExperience || 3) * 2) % 19);
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

  const toggleCompareCandidate = (candId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(candId)) {
        return prev.filter(id => id !== candId);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 candidates simultaneously.');
        return prev;
      }
      return [...prev, candId];
    });
  };

  // Filter pipeline
  const filteredCandidates = candidates.filter(c => {
    const matchScore = computeMatchScore(c);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesExp = (c.yearsOfExperience || 0) >= minExpFilter;
    const matchesScore = !highScoreOnly || matchScore >= 85;
    const matchesSkill = selectedSkillFilter === 'ALL' || (c.skills || []).some(s => s.toLowerCase().includes(selectedSkillFilter.toLowerCase()));
    const matchesSearch = 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getJobTitle(c.jobId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesExp && matchesScore && matchesSkill && matchesSearch;
  });

  const comparedCandidatesList = candidates.filter(c => selectedForCompare.includes(c.id));

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>{t('nav.resumes', 'Resume Shortlisting & AI Screenings')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming candidate applications, inspect AI parsed competencies, and compare talent side-by-side.
          </p>
        </div>

        {/* Quick Actions & Compare Pill */}
        <div className="flex items-center gap-3">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/30 flex items-center gap-2 animate-bounce"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Selected ({selectedForCompare.length})</span>
            </button>
          )}

          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-xl font-bold">
            Total Candidates: {candidates.length}
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, candidate ID, role..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="INVITED">Invited</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="EVALUATED">Evaluated</option>
            <option value="HIRED">Hired / Selected</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Skill Filter Dropdown */}
          <select
            value={selectedSkillFilter}
            onChange={(e) => setSelectedSkillFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Competencies</option>
            <option value="ROS2">ROS2 / DDS</option>
            <option value="Kinematics">Kinematics & Dynamics</option>
            <option value="C++">C++20</option>
            <option value="Python">Python / PyTorch</option>
            <option value="SLAM">SLAM / Navigation</option>
          </select>

          {/* High Score Only Toggle */}
          <button
            onClick={() => setHighScoreOnly(!highScoreOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              highScoreOnly 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 shadow' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${highScoreOnly ? 'text-emerald-400 fill-emerald-400' : ''}`} />
            <span>Match ≥ 85%</span>
          </button>
        </div>

        {/* Experience Slider Bar */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Min Experience: <strong className="text-cyan-300">{minExpFilter} Years</strong></span>
          </span>
          <input
            type="range"
            min="0"
            max="10"
            value={minExpFilter}
            onChange={(e) => setMinExpFilter(parseInt(e.target.value))}
            className="flex-1 accent-cyan-400 cursor-pointer"
          />
          {minExpFilter > 0 && (
            <button
              onClick={() => setMinExpFilter(0)}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
            >
              Reset Exp
            </button>
          )}
        </div>
      </div>

      {/* Candidate Card Matrix */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredCandidates.map((cand) => {
          const matchScore = computeMatchScore(cand);
          const isSelected = selectedForCompare.includes(cand.id);

          return (
            <div
              key={cand.id}
              className={`p-4 rounded-2xl bg-slate-900 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                isSelected ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left Column: Compare Checkbox, Avatar & Basic Info */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleCompareCandidate(cand.id)}
                  className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                  title="Select for comparison"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                  {cand.firstName[0]}{cand.lastName[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{cand.firstName} {cand.lastName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
                      {cand.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Briefcase className="w-3 h-3 text-cyan-400" />
                      {getJobTitle(cand.jobId)}
                    </span>
                    <span>•</span>
                    <span>{cand.yearsOfExperience} yrs exp</span>
                    <span>•</span>
                    <span className="hidden sm:inline">{cand.email}</span>
                  </div>
                </div>
              </div>

              {/* Middle: Match Score Ring & Skills Chips */}
              <div className="flex items-center gap-4">
                <MatchScoreRing score={matchScore} size={46} />

                <div className="flex flex-col space-y-1">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(cand.skills || ['ROS2', 'Kinematics', 'C++20']).slice(0, 3).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800 font-mono"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
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
                  onClick={() => { setSelectedCandidate(cand); setShowDrawer(true); }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect Fit</span>
                </button>

                {onLaunchConference && (
                  <button
                    onClick={() => onLaunchConference(cand)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all active:scale-95"
                    title="Connect candidate with HR, Company Admin & Super Admin in Live Zoom Meeting"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Live Panel</span>
                  </button>
                )}

                {onScheduleCandidate && (
                  <button
                    onClick={() => onScheduleCandidate(cand)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Schedule</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-400">No applications match your filtered criteria</div>
            <div className="text-xs text-slate-500">Try lowering minimum experience or clearing search filters.</div>
          </div>
        )}
      </div>

      {/* Slide-Over Drawer: Split-Screen Resume & AI Fit Analysis */}
      {showDrawer && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col justify-between">
            
            {/* Top Bar */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-cyan-500/20">
                    {selectedCandidate.firstName[0]}{selectedCandidate.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      {selectedCandidate.firstName} {selectedCandidate.lastName}
                    </h3>
                    <div className="text-xs text-cyan-400 font-mono">
                      {selectedCandidate.id} • {getJobTitle(selectedCandidate.jobId)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedCandidate.status === 'SHORTLISTED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                    selectedCandidate.status === 'HIRED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {selectedCandidate.status}
                  </span>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Split Screen Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* Left Side: Extracted Resume Document Representation */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Candidate Resume Dossier</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Professional Summary</div>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        Experienced Systems & Robotics Engineer with over {selectedCandidate.yearsOfExperience} years designing low-latency motion planners, ROS2 nodes, and state estimators for high-degree-of-freedom robotic arms.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-850">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Key Technical Skills</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(selectedCandidate.skills || ['ROS2', 'C++20', 'Kinematics', 'SLAM', 'Python', 'OpenCV', 'Gazebo']).map((sk, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200 font-mono">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Education & Credentials</div>
                      <div className="mt-1 text-slate-300">
                        <strong className="text-white">Master of Science in Robotics Engineering</strong>
                        <div className="text-[11px] text-slate-400">Specialization in Kinematics & Real-Time Control Systems</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Patents & Publications</div>
                      <p className="text-slate-400 text-[11px] mt-1 italic">
                        "Singularity Avoidance in Underactuated Manipulators Using Damped Least Squares Optimization" — IEEE ICRA.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: AI Semantic Fit Breakdown */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>AI Semantic Fit & Competency Analysis</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-900/60 space-y-4">
                    {/* Overall Fit Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-purple-300 font-bold">Overall Match Score</div>
                        <div className="text-2xl font-black text-white font-mono mt-0.5">
                          {computeMatchScore(selectedCandidate)}%
                        </div>
                      </div>
                      <MatchScoreRing score={computeMatchScore(selectedCandidate)} size={56} />
                    </div>

                    {/* Competency Progress Bars */}
                    <div className="space-y-2.5 pt-2 border-t border-purple-900/40 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Kinematics & Dynamics Domain</span>
                          <span className="text-cyan-400 font-mono font-bold">96%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: '96%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Software Architecture & C++20</span>
                          <span className="text-indigo-400 font-mono font-bold">92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: '92%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Problem Solving & STAR Alignment</span>
                          <span className="text-emerald-400 font-mono font-bold">88%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '88%' }} />
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation Summary */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>AI Screening Recommendation:</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Strong hire signal for the Senior Robotics Controls track. Candidate’s background directly mirrors required DDS and actuator kinematics benchmarks. Proceed to live AI Chamber.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions Drawer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleUpdateStatus(selectedCandidate.id, 'REJECTED')}
                className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'SHORTLISTED')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shortlist for Chamber</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Side-by-Side Candidate Comparison Modal */}
      {showCompareModal && comparedCandidatesList.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold shadow-lg shadow-purple-500/20">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Head-to-Head Candidate Comparison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing {comparedCandidatesList.length} shortlisted candidates across competencies and experience
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Columns */}
            <div className={`grid gap-4 ${
              comparedCandidatesList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {comparedCandidatesList.map((cand) => {
                const score = computeMatchScore(cand);
                return (
                  <div key={cand.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-sm">
                          {cand.firstName[0]}{cand.lastName[0]}
                        </div>
                        <MatchScoreRing score={score} size={46} />
                      </div>

                      <div>
                        <div className="font-extrabold text-sm text-white">{cand.firstName} {cand.lastName}</div>
                        <div className="text-xs text-cyan-400 font-mono">{cand.id}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{getJobTitle(cand.jobId)}</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Experience:</span>
                          <span className="text-white font-mono font-bold">{cand.yearsOfExperience} Years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className="text-cyan-300 font-bold">{cand.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Kinematics Fit:</span>
                          <span className="text-emerald-400 font-mono font-bold">95%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {(cand.skills || ['ROS2', 'Kinematics', 'C++']).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleUpdateStatus(cand.id, 'SHORTLISTED');
                        setShowCompareModal(false);
                      }}
                      className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Select This Candidate</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
