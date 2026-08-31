import React, { useState, useEffect } from 'react';
import { Candidate, JobPosition, InterviewRound, Question, InterviewSession } from '../types';
import { AppDataStore } from '../services/storage';
import { HardwareDiagnostic } from '../components/candidate/HardwareDiagnostic';
import { LiveAIInterviewChamber } from '../components/candidate/LiveAIInterviewChamber';
import { CandidateScorecardView } from '../components/evaluation/CandidateScorecardView';
import { LiveVideoConferenceRoom } from '../components/conference/LiveVideoConferenceRoom';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Laptop,
  Briefcase, 
  Layers, 
  ChevronLeft, 
  Award, 
  Search, 
  Eye, 
  Video, 
  Sun, 
  Moon, 
  Wifi,
  User,
  FileText,
  TrendingUp,
  ExternalLink,
  Github,
  Linkedin,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Save,
  Plus,
  Trash2,
  LogOut
} from 'lucide-react';

interface CandidatePortalProps {
  onBackToApp?: () => void;
  initialToken?: string;
  onViewEvaluation?: (sessionId: string) => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  onBackToApp,
  initialToken = '',
  onViewEvaluation,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { latencyMs } = useRealtime();

  const [activePortalTab, setActivePortalTab] = useState<'dashboard' | 'applications' | 'chamber' | 'profile' | 'history'>('dashboard');
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<JobPosition | null>(null);
  const [round, setRound] = useState<InterviewRound | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'TOKEN_ENTRY' | 'DIAGNOSTICS' | 'INTERVIEW' | 'COMPLETED' | 'SCORECARD_VIEW' | 'LIVE_CONFERENCE'>('TOKEN_ENTRY');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Candidate Profile State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEducation, setProfileEducation] = useState('B.S. in Robotics & Computer Science, Stanford University');
  const [profileExperienceYears, setProfileExperienceYears] = useState(3);
  const [profileSkills, setProfileSkills] = useState('ROS2, Python, C++, PyTorch, Motion Planning, SLAM');
  const [profileCertifications, setProfileCertifications] = useState('AWS Certified Solutions Architect, Certified ROS2 Professional');
  const [profilePortfolioUrl, setProfilePortfolioUrl] = useState('https://github.com/candidate-robotics');
  const [profileLinkedIn, setProfileLinkedIn] = useState('https://linkedin.com/in/candidate');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  const allSessions = AppDataStore.getSessions();
  const allCandidates = AppDataStore.getCandidates();
  const allJobs = AppDataStore.getJobs();

  // Auto-detect candidate from logged in user or saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('ardhnarishwar_candidate_token') || initialToken;
    if (savedToken) {
      setTokenInput(savedToken);
      verifyAndLaunchToken(savedToken, false);
    } else if (currentUser && currentUser.role === 'CANDIDATE') {
      const found = allCandidates.find(c => c.id === currentUser.id || c.email.toLowerCase() === currentUser.email.toLowerCase()) || allCandidates[0];
      if (found) {
        setCandidate(found);
        setProfileFirstName(found.firstName);
        setProfileLastName(found.lastName);
        setProfileEmail(found.email);
        setProfilePhone(found.phone || '');
        setProfileSkills((found.skills || []).join(', '));
        setProfileExperienceYears(found.yearsOfExperience || 0);

        const foundJob = allJobs.find(j => j.id === found.jobId) || allJobs[0];
        setJob(foundJob);
      }
    }
  }, [currentUser, initialToken]);

  const verifyAndLaunchToken = (tokenToVerify: string, autoStart: boolean = true) => {
    setErrorMessage('');
    const trimmed = tokenToVerify.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Please enter your invitation token.');
      return false;
    }

    const allCand = AppDataStore.getCandidates();
    const found = allCand.find(c => 
      c.interviewToken.toUpperCase() === trimmed || 
      c.id.toUpperCase() === trimmed || 
      c.email.toUpperCase() === trimmed
    );

    if (!found) {
      setErrorMessage('Invalid or expired interview token. Please check your invitation email or register on the portal.');
      return false;
    }

    setCandidate(found);
    setProfileFirstName(found.firstName);
    setProfileLastName(found.lastName);
    setProfileEmail(found.email);
    setProfilePhone(found.phone || '');
    setProfileSkills((found.skills || []).join(', '));
    setProfileExperienceYears(found.yearsOfExperience || 0);

    // Fetch Job & Round
    const foundJob = allJobs.find(j => j.id === found.jobId) || allJobs[0];
    setJob(foundJob);

    const allRounds = AppDataStore.getRounds();
    const foundRound = allRounds.find(r => r.jobId === foundJob.id) || allRounds[0];
    setRound(foundRound);

    // Fetch Questions and sanitize
    const allQuestions = AppDataStore.getQuestions();
    const roundQuestions = allQuestions.filter(q => foundRound.questionIds.includes(q.id));
    const rawQuestions = roundQuestions.length > 0 ? roundQuestions : allQuestions.slice(0, 4);
    const sanitized = AppDataStore.sanitizeQuestionsForCandidate(rawQuestions);
    setQuestions(sanitized);

    // If candidate has already completed interview, jump directly to Scorecard & Result
    if (found.status === 'EVALUATED' || found.status === 'HIRED' || found.interviewSessionId) {
      setCompletedSessionId(found.interviewSessionId || '');
      if (autoStart) {
        setStep('SCORECARD_VIEW');
        setActivePortalTab('chamber');
      }
      return true;
    }

    if (autoStart) {
      setStep('DIAGNOSTICS');
      setActivePortalTab('chamber');
    }
    return true;
  };

  const handleVerifyToken = () => {
    verifyAndLaunchToken(tokenInput, true);
  };

  const handleStartInterviewFromDashboard = () => {
    if (candidate) {
      verifyAndLaunchToken(candidate.interviewToken, true);
    } else {
      setActivePortalTab('chamber');
      setStep('TOKEN_ENTRY');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) {
      setProfileSavedMsg('Profile changes cached locally. Enter your token to link to your application.');
      setTimeout(() => setProfileSavedMsg(''), 3500);
      return;
    }

    const updated: Candidate = {
      ...candidate,
      firstName: profileFirstName,
      lastName: profileLastName,
      email: profileEmail,
      phone: profilePhone,
      yearsOfExperience: Number(profileExperienceYears) || 0,
      skills: profileSkills.split(',').map(s => s.trim()).filter(Boolean)
    };

    const updatedList = allCandidates.map(c => c.id === candidate.id ? updated : c);
    AppDataStore.saveCandidates(updatedList);
    setCandidate(updated);
    setProfileSavedMsg('Your candidate dossier & profile have been saved successfully!');
    setTimeout(() => setProfileSavedMsg(''), 3500);
  };

  const candidateSessions = candidate 
    ? allSessions.filter(s => s.candidateId === candidate.id)
    : allSessions.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans">
      {/* Top Candidate Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={false} />
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full font-bold">
            Candidate Portal
          </span>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActivePortalTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActivePortalTab('applications')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Applications</span>
          </button>

          <button
            onClick={() => setActivePortalTab('chamber')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'chamber'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Interview Chamber</span>
          </button>

          <button
            onClick={() => setActivePortalTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Results</span>
          </button>

          <button
            onClick={() => setActivePortalTab('profile')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'profile'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Right User & Logout Controls */}
        <div className="flex items-center gap-3">
          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-[10px]">
              {(candidate?.firstName || currentUser?.name || 'C')[0]}
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-200 leading-tight">
                {candidate ? `${candidate.firstName} ${candidate.lastName}` : (currentUser?.name || 'Candidate')}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">Role: Candidate</div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'enterprise-light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
            title="Logout from Candidate Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
        
        {/* TAB 0: CANDIDATE DASHBOARD */}
        {activePortalTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Welcome Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Candidate Portal • Welcome</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome, {candidate ? `${candidate.firstName} ${candidate.lastName}` : (currentUser?.name || 'Applicant')}!
                </h1>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Track your job applications, complete autonomous AI-proctored technical interviews, and review your instant evaluation scorecards.
                </p>
              </div>

              <button
                onClick={handleStartInterviewFromDashboard}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
              >
                <Bot className="w-4 h-4" />
                <span>{candidate?.status === 'EVALUATED' ? 'View Interview Scorecard' : 'Start AI Interview'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Target Job Position</div>
                <div className="text-base font-extrabold text-white truncate">{job?.title || 'Perception Engineer'}</div>
                <div className="text-[11px] text-cyan-400">{job?.department || 'Autonomous Systems'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Application Status</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    candidate?.status === 'SHORTLISTED' || candidate?.status === 'HIRED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : candidate?.status === 'EVALUATED'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {candidate?.status || 'SHORTLISTED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Application verified</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Interview Token</div>
                <div className="text-sm font-mono font-bold text-emerald-400 truncate">
                  {candidate?.interviewToken || 'TOKEN_AVAILABLE'}
                </div>
                <div className="text-[11px] text-slate-400">Use to re-enter chamber</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">AI Evaluation Result</div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {candidateSessions.length > 0 && candidateSessions[0].overallScore ? `${candidateSessions[0].overallScore}%` : 'Pending'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {candidateSessions.length > 0 ? 'Passing benchmark met' : 'Complete interview to view score'}
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">AI Technical Interview Chamber</h3>
                    <p className="text-xs text-slate-400">Conduct your structured interview with instant evaluation against predefined benchmarks.</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Camera & Mic Hardware Diagnostics Ready</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Structured Questions with Benchmark Rubrics</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Instant Result Scorecard upon Completion</span>
                  </div>
                </div>
                <button
                  onClick={handleStartInterviewFromDashboard}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Enter Chamber Now</span>
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Candidate Profile & Dossier</h3>
                    <p className="text-xs text-slate-400">Keep your resume, skills, and portfolio updated for hiring team review.</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div><strong>Education:</strong> {profileEducation}</div>
                  <div><strong>Experience:</strong> {profileExperienceYears} Years</div>
                  <div><strong>Skills:</strong> {profileSkills}</div>
                </div>
                <button
                  onClick={() => setActivePortalTab('profile')}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Update Profile & Skills</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 0.5: MY APPLICATIONS */}
        {activePortalTab === 'applications' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">My Job Applications</h2>
                <p className="text-xs text-slate-400 mt-1">Review the status of your job applications and proceed with assigned interview rounds.</p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                1 Application Active
              </span>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{job?.title || 'Lead Robotics Perception Engineer'}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {candidate?.status || 'SHORTLISTED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Department: {job?.department || 'Robotics Division'}</span>
                    <span>•</span>
                    <span>Location: {job?.location || 'San Francisco, CA / Remote'}</span>
                    <span>•</span>
                    <span>Applied: {new Date(candidate?.appliedAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStartInterviewFromDashboard}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{candidate?.status === 'EVALUATED' ? 'View Scorecard' : 'Launch AI Chamber'}</span>
                  </button>
                  <button
                    onClick={() => setActivePortalTab('profile')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                  >
                    View Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: AI INTERVIEW CHAMBER */}
        {activePortalTab === 'chamber' && (
          <div>
            {/* Step 1: Token Entry */}
            {step === 'TOKEN_ENTRY' && (
              <div className="max-w-lg mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-8">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">Candidate Interview Chamber</h1>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your invitation token to start your autonomous AI video interview or view your verified scorecard dossier.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Interview Access Token</label>
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Enter your invitation token (e.g. TOKEN_XXXX)"
                      className="w-full mt-1.5 p-3.5 rounded-xl font-mono text-sm bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-cyan-300 font-bold outline-none uppercase tracking-wider"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyToken}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Authenticate & Enter Chamber</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Diagnostics */}
            {step === 'DIAGNOSTICS' && candidate && job && round && (
              <HardwareDiagnostic
                candidateName={`${candidate.firstName} ${candidate.lastName}`}
                jobTitle={job.title}
                roundName={round.name}
                onPassed={(diagData) => {
                  setDiagnosticsData(diagData);
                  setStep('INTERVIEW');
                }}
              />
            )}

            {/* Step 3: Live AI Interview */}
            {step === 'INTERVIEW' && candidate && job && round && (
              <LiveAIInterviewChamber
                candidate={candidate}
                job={job}
                round={round}
                questions={questions}
                diagnostics={diagnosticsData || { cameraModel: 'HD WebCam', micWorking: true, networkLatencyMs: latencyMs, browserAgent: navigator.userAgent }}
                onFinish={(sessionId) => {
                  setCompletedSessionId(sessionId);
                  setStep('SCORECARD_VIEW');
                }}
              />
            )}

            {/* Step 4: Scorecard View */}
            {step === 'SCORECARD_VIEW' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Interview Complete • Dossier Verified</span>
                  </div>
                  <button
                    onClick={() => setStep('TOKEN_ENTRY')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Enter Different Token
                  </button>
                </div>
                <CandidateScorecardView
                  candidateId={candidate?.id || ''}
                  onBack={() => setStep('TOKEN_ENTRY')}
                  onLaunchConference={() => setStep('LIVE_CONFERENCE')}
                />
              </div>
            )}

            {/* Step 5: Live Video Conference */}
            {step === 'LIVE_CONFERENCE' && candidate && job && (
              <LiveVideoConferenceRoom
                candidateName={`${candidate.firstName} ${candidate.lastName}`}
                jobTitle={job.title}
                initialRoomId={candidate.meetingRoomId || 'ROOM-ARDH-ROBOTICS-882'}
                onLeaveRoom={() => setStep('SCORECARD_VIEW')}
              />
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE PROFILE & DOSSIER */}
        {activePortalTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-lg">
                  {profileFirstName[0] || 'C'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">
                    {profileFirstName ? `${profileFirstName} ${profileLastName}` : 'Candidate Profile & Resume'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage your education, skill taxonomy, portfolio links, and certifications for AI matching.
                  </p>
                </div>
              </div>

              {candidate?.interviewToken && (
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                  Token: <strong>{candidate.interviewToken}</strong>
                </div>
              )}
            </div>

            {profileSavedMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Education Background</label>
                <input
                  type="text"
                  value={profileEducation}
                  onChange={(e) => setProfileEducation(e.target.value)}
                  placeholder="e.g. B.S. in Robotics Engineering"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={profileExperienceYears}
                    onChange={(e) => setProfileExperienceYears(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Certifications</label>
                  <input
                    type="text"
                    value={profileCertifications}
                    onChange={(e) => setProfileCertifications(e.target.value)}
                    placeholder="e.g. ROS2 Certified, PyTorch Expert"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Key Technical Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="e.g. Python, ROS2, C++, Kinematics, SLAM, Machine Learning"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Portfolio / GitHub URL</label>
                  <input
                    type="url"
                    value={profilePortfolioUrl}
                    onChange={(e) => setProfilePortfolioUrl(e.target.value)}
                    placeholder="https://github.com/your-handle"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={profileLinkedIn}
                    onChange={(e) => setProfileLinkedIn(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Candidate Profile Dossier</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: INTERVIEW HISTORY & PERFORMANCE TRENDS */}
        {activePortalTab === 'history' && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-xl font-extrabold text-white">Interview Records & Performance Trends</h2>
              <p className="text-xs text-slate-400 mt-1">
                Detailed breakdowns of your completed AI assessments, competency scores, and personalized growth recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Assessments</div>
                <div className="text-2xl font-black text-white font-mono">{candidateSessions.length}</div>
                <div className="text-[11px] text-emerald-400">Verified by AI Proctor Engine</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">Average Technical Score</div>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  {candidateSessions.length > 0
                    ? Math.round(candidateSessions.reduce((acc, s) => acc + (s.overallScore || 85), 0) / candidateSessions.length)
                    : 88}%
                </div>
                <div className="text-[11px] text-slate-400">Top 10% for Robotics Engineering</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">AI Recommendation</div>
                <div className="text-lg font-extrabold text-emerald-400">STRONG HIRE</div>
                <div className="text-[11px] text-slate-400">Exceeds senior core threshold</div>
              </div>
            </div>

            {/* Past Sessions List */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">
                Completed Interview Sessions
              </div>
              <div className="divide-y divide-slate-800/60">
                {candidateSessions.map((sess, idx) => (
                  <div key={idx} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-850 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Autonomous Robotics AI Round</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {sess.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                        <span>Session: {sess.id}</span>
                        <span>•</span>
                        <span>Date: {new Date(sess.completedAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Overall Score</div>
                        <div className="text-base font-black text-cyan-400 font-mono">{sess.overallScore || 91}%</div>
                      </div>
                      <button
                        onClick={() => {
                          setCompletedSessionId(sess.id);
                          setStep('SCORECARD_VIEW');
                          setActivePortalTab('chamber');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                      >
                        Inspect Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
