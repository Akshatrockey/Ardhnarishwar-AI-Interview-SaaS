import React, { useState, useEffect } from 'react';
import { Candidate, JobPosition, InterviewRound, Question, InterviewSession } from '../types';
import { AppDataStore } from '../services/storage';
import { ApiClient } from '../services/apiClient';
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
  Calendar,
  Clock,
  BookOpen,
  Save,
  Plus,
  Trash2,
  LogOut,
  Upload,
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface CandidatePortalProps {
  onBackToApp?: () => void;
  initialToken?: string;
  onViewEvaluation?: (sessionId: string) => void;
}

interface UploadedResumeData {
  id: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  status: string;
  download_url: string;
  uploaded_at: string;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  onBackToApp,
  initialToken = '',
  onViewEvaluation,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { latencyMs } = useRealtime();

  const [activePortalTab, setActivePortalTab] = useState<'dashboard' | 'resume' | 'applications' | 'chamber' | 'profile' | 'history'>('dashboard');
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<JobPosition | null>(null);
  const [round, setRound] = useState<InterviewRound | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'TOKEN_ENTRY' | 'DIAGNOSTICS' | 'INTERVIEW' | 'COMPLETED' | 'SCORECARD_VIEW' | 'LIVE_CONFERENCE'>('TOKEN_ENTRY');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Available Open Jobs (Database-backed)
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(false);
  const [selectedJobToApply, setSelectedJobToApply] = useState<any | null>(null);
  const [jobTrackFilter, setJobTrackFilter] = useState<'ALL' | 'SKILLED' | 'UNSKILLED'>('ALL');

  const filteredJobs = availableJobs.filter(j => {
    if (jobTrackFilter === 'ALL') return true;
    return (j.skill_category || 'SKILLED') === jobTrackFilter;
  });

  // Resume Vault State
  const [resumeData, setResumeData] = useState<UploadedResumeData | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState<string | null>(null);

  // Candidate Profile State
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [profileExperienceYears, setProfileExperienceYears] = useState(0);
  const [profileSkills, setProfileSkills] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  const API_BASE_URL: string =
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';

  // Load real jobs from backend API
  const fetchOpenJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await ApiClient.listJobs({ status_filter: 'OPEN' });
      if (res.data?.jobs) {
        setAvailableJobs(res.data.jobs);
      } else {
        setAvailableJobs(AppDataStore.getJobs());
      }
    } catch (e) {
      setAvailableJobs(AppDataStore.getJobs());
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchOpenJobs();
  }, []);

  // Auto-detect candidate from logged in user or saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('ardhnarishwar_candidate_token') || initialToken;
    if (savedToken) {
      setTokenInput(savedToken);
      verifyAndLaunchToken(savedToken, false);
    } else if (currentUser && currentUser.role === 'CANDIDATE') {
      const allCandidates = AppDataStore.getCandidates();
      const found = allCandidates.find(c => c.id === currentUser.id || c.email.toLowerCase() === currentUser.email.toLowerCase());
      if (found) {
        setCandidate(found);
        setProfileFirstName(found.firstName);
        setProfileLastName(found.lastName);
        setProfileEmail(found.email);
        setProfilePhone(found.phone || '');
        setProfileSkills((found.skills || []).join(', '));
        setProfileExperienceYears(found.yearsOfExperience || 0);

        if (found.resumeFileName) {
          setResumeData({
            id: 'res_active',
            file_name: found.resumeFileName || 'Candidate_Resume.pdf',
            file_size_bytes: 1024 * 350,
            file_type: 'application/pdf',
            status: 'ACTIVE',
            download_url: '#',
            uploaded_at: found.appliedAt || new Date().toISOString()
          });
        }
      } else {
        setProfileFirstName(currentUser.name.split(' ')[0] || '');
        setProfileLastName(currentUser.name.split(' ').slice(1).join(' ') || '');
        setProfileEmail(currentUser.email);
      }
    }
  }, [currentUser, initialToken]);

  const verifyAndLaunchToken = async (tokenToVerify: string, autoStart: boolean = true) => {
    setErrorMessage('');
    const trimmed = tokenToVerify.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your invitation token.');
      return false;
    }

    try {
      const res = await ApiClient.initiateInterview(trimmed);
      if (res.data) {
        const initData = res.data;
        const candData: Candidate = {
          id: initData.candidate.id,
          companyId: initData.session_id ? 'comp_active' : 'comp_ardhnarishwar',
          jobId: initData.job.id,
          firstName: initData.candidate.first_name,
          lastName: initData.candidate.last_name,
          email: initData.candidate.email,
          phone: initData.candidate.phone || '',
          yearsOfExperience: 2,
          status: 'IN_PROGRESS',
          interviewToken: trimmed,
          appliedAt: new Date().toISOString()
        };

        const jobData: JobPosition = {
          id: initData.job.id,
          companyId: candData.companyId,
          title: initData.job.title,
          department: initData.job.department,
          location: 'Remote / Hybrid',
          type: 'FULL_TIME',
          experienceLevel: 'SENIOR',
          description: 'Technical Position',
          requiredSkills: [],
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          roundIds: [initData.round.id],
          totalApplicants: 1
        };

        const roundData: InterviewRound = {
          id: initData.round.id,
          companyId: candData.companyId,
          jobId: jobData.id,
          name: initData.round.name,
          roundNumber: 1,
          type: 'TECHNICAL_ROBOTICS',
          timeLimitMinutes: initData.round.time_limit_minutes || 25,
          passingScore: initData.round.passing_score || 70,
          allowRetake: false,
          proctoringStrictness: 'MILITARY_GRADE',
          questionIds: initData.questions.map((q: Question) => q.id)
        };

        setCandidate(candData);
        setJob(jobData);
        setRound(roundData);
        setQuestions(initData.questions);
        localStorage.setItem('ardhnarishwar_candidate_token', trimmed);

        if (autoStart) {
          setStep('DIAGNOSTICS');
          setActivePortalTab('chamber');
        }
        return true;
      }
    } catch (e) {
      console.warn('Backend verification fallback:', e);
    }

    // Fallback to local store
    const allCand = AppDataStore.getCandidates();
    const found = allCand.find(c => 
      c.interviewToken.toUpperCase() === trimmed.toUpperCase() || 
      c.id.toUpperCase() === trimmed.toUpperCase() || 
      c.email.toUpperCase() === trimmed.toUpperCase()
    );

    if (!found) {
      setErrorMessage('Invalid or expired interview token. Please apply for an open job to receive your token.');
      return false;
    }

    setCandidate(found);
    setProfileFirstName(found.firstName);
    setProfileLastName(found.lastName);
    setProfileEmail(found.email);
    setProfilePhone(found.phone || '');
    setProfileSkills((found.skills || []).join(', '));
    setProfileExperienceYears(found.yearsOfExperience || 0);

    const allJobs = AppDataStore.getJobs();
    const foundJob = allJobs.find(j => j.id === found.jobId) || allJobs[0];
    setJob(foundJob);

    const allRounds = AppDataStore.getRounds();
    const foundRound = allRounds.find(r => r.jobId === foundJob?.id) || allRounds[0];
    setRound(foundRound);

    const allQuestions = AppDataStore.getQuestions();
    const rawQuestions = allQuestions.slice(0, 3);
    const sanitized = AppDataStore.sanitizeQuestionsForCandidate(rawQuestions);
    setQuestions(sanitized);

    if (autoStart) {
      setStep('DIAGNOSTICS');
      setActivePortalTab('chamber');
    }
    return true;
  };

  // Resume Upload Handler
  const handleResumeFileUpload = async (file: File) => {
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setResumeUploadError('Invalid file type. Please upload a PDF, DOC, or DOCX document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeUploadError('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setIsUploadingResume(true);
    setResumeUploadError(null);
    setResumeUploadSuccess(null);

    try {
      const res = await ApiClient.uploadResume(file, candidate?.id, candidate?.companyId);
      if (res.data?.success) {
        setResumeData({
          id: res.data.id,
          file_name: res.data.file_name,
          file_size_bytes: res.data.file_size_bytes,
          file_type: res.data.file_type,
          status: res.data.status,
          download_url: res.data.download_url,
          uploaded_at: res.data.uploaded_at
        });
        setResumeUploadSuccess(`Resume "${res.data.file_name}" uploaded and verified successfully!`);
      } else {
        // Local state fallback
        setResumeData({
          id: `res_${Date.now()}`,
          file_name: file.name,
          file_size_bytes: file.size,
          file_type: file.type || 'application/pdf',
          status: 'ACTIVE',
          download_url: '#',
          uploaded_at: new Date().toISOString()
        });
        setResumeUploadSuccess(`Resume "${file.name}" cached and ready for applications.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setResumeUploadError('Upload failed: ' + message);
    } finally {
      setIsUploadingResume(false);
      setTimeout(() => setResumeUploadSuccess(null), 5000);
    }
  };

  // Apply for Job Handler
  const handleApplyForJob = async (jobToApply: JobPosition) => {
    if (!profileFirstName.trim() || !profileEmail.trim()) {
      setActivePortalTab('profile');
      setProfileSavedMsg('Please complete your Name and Email before submitting an application.');
      return;
    }

    try {
      const res = await ApiClient.applyForJob({
        first_name: profileFirstName,
        last_name: profileLastName || 'Applicant',
        email: profileEmail,
        phone: profilePhone,
        job_id: jobToApply.id,
        years_of_experience: Number(profileExperienceYears) || 0,
        skills: profileSkills ? profileSkills.split(',').map(s => s.trim()) : [],
        resume_id: resumeData?.id
      });

      if (res.data?.success) {
        const token = res.data.interview_token;
        setTokenInput(token);
        localStorage.setItem('ardhnarishwar_candidate_token', token);
        await verifyAndLaunchToken(token, false);
        setSelectedJobToApply(null);
        setActivePortalTab('dashboard');
        alert(`Application submitted successfully! Your invitation token is: ${token}. You can now start your interview.`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to connect to backend';
      alert('Application submission error: ' + message);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidate) {
      const updated: Candidate = {
        ...candidate,
        firstName: profileFirstName,
        lastName: profileLastName,
        email: profileEmail,
        phone: profilePhone,
        yearsOfExperience: Number(profileExperienceYears) || 0,
        skills: profileSkills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const allCandidates = AppDataStore.getCandidates();
      const updatedList = allCandidates.map(c => c.id === candidate.id ? updated : c);
      AppDataStore.saveCandidates(updatedList);
      setCandidate(updated);
    }
    setProfileSavedMsg('Profile details saved successfully!');
    setTimeout(() => setProfileSavedMsg(''), 3500);
  };

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
            onClick={() => setActivePortalTab('resume')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'resume'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Vault</span>
          </button>

          <button
            onClick={() => setActivePortalTab('applications')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activePortalTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Explore Jobs</span>
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

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-[10px]">
              {(profileFirstName || currentUser?.name || 'C')[0]}
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-200 leading-tight">
                {profileFirstName ? `${profileFirstName} ${profileLastName}` : (currentUser?.name || 'Candidate')}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">Candidate Verified</div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {theme === 'enterprise-light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => {
              if (onBackToApp) onBackToApp();
              else logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        
        {/* TAB 0: DASHBOARD */}
        {activePortalTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time Candidate Workspace</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome, {profileFirstName || currentUser?.name || 'Applicant'}!
                </h1>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Manage your resume vault, apply for open robotics & engineering jobs, and take your autonomous AI interview.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActivePortalTab('resume')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>{resumeData ? 'Manage Resume' : 'Upload Resume'}</span>
                </button>

                <button
                  onClick={() => {
                    if (candidate?.interviewToken) {
                      verifyAndLaunchToken(candidate.interviewToken, true);
                    } else {
                      setActivePortalTab('chamber');
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Launch AI Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Target Job Position</div>
                <div className="text-base font-extrabold text-white truncate">
                  {job?.title || 'No Job Applied Yet'}
                </div>
                <div className="text-[11px] text-cyan-400">{job?.department || 'Explore Jobs Tab'}</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Resume Status</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    resumeData 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {resumeData ? 'UPLOADED & VERIFIED' : 'NO RESUME UPLOADED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {resumeData ? resumeData.file_name : 'Upload PDF/DOC in Resume Vault'}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Interview Invitation Token</div>
                <div className="text-sm font-mono font-bold text-emerald-400 truncate">
                  {candidate?.interviewToken || 'Apply to generate token'}
                </div>
                <div className="text-[11px] text-slate-400">Used for chamber authentication</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Application Status</div>
                <div className="text-lg font-black text-cyan-400 font-mono">
                  {candidate?.status || 'NOT APPLIED'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {candidate?.status ? 'Active in recruitment pipeline' : 'Select a job to start'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: RESUME VAULT */}
        {activePortalTab === 'resume' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Resume Storage Vault</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">Your Candidate Resume Document</h2>
                <p className="text-xs text-slate-400">
                  Upload your latest resume (PDF, DOC, DOCX). Stored securely on the backend server and attached to your applications.
                </p>
              </div>
            </div>

            {resumeUploadSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resumeUploadSuccess}</span>
              </div>
            )}

            {resumeUploadError && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resumeUploadError}</span>
              </div>
            )}

            {/* Current Resume Card or Empty Upload Box */}
            {resumeData ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{resumeData.file_name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Size: {(resumeData.file_size_bytes / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>Type: {resumeData.file_type}</span>
                        <span>•</span>
                        <span>Uploaded: {new Date(resumeData.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE VERIFIED
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <a
                    href={`${API_BASE_URL}${resumeData.download_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download / View Resume
                  </a>

                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-2 transition">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Upload New Version</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleResumeFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  <button
                    onClick={() => {
                      setResumeData(null);
                      setResumeUploadSuccess('Resume removed from active session.');
                    }}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-rose-950 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Resume
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-3xl bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-cyan-500 text-center transition space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Upload Your Candidate Resume</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Supported formats: PDF, DOC, DOCX. Maximum file size: 10MB.
                  </p>
                </div>

                <div>
                  <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition shadow-lg shadow-cyan-600/20">
                    <Upload className="w-4 h-4" />
                    <span>Browse & Select File</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleResumeFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPLORE JOBS & APPLY */}
        {activePortalTab === 'applications' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Active Job Openings & Workforce Tracks</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Apply directly to real engineering, robotics, or general workforce positions to generate your personalized interview token.
                </p>
              </div>
              <button
                onClick={fetchOpenJobs}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin' : ''}`} />
                Refresh Jobs
              </button>
            </div>

            {/* Skill Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 mr-1">Filter by Track:</span>
              <button
                onClick={() => setJobTrackFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  jobTrackFilter === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                🌐 All Openings ({availableJobs.length})
              </button>
              <button
                onClick={() => setJobTrackFilter('SKILLED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  jobTrackFilter === 'SKILLED'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                🛠️ Skilled Engineering ({availableJobs.filter(j => (j.skill_category || 'SKILLED') === 'SKILLED').length})
              </button>
              <button
                onClick={() => setJobTrackFilter('UNSKILLED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  jobTrackFilter === 'UNSKILLED'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                👷 General Workforce / Entry-Level ({availableJobs.filter(j => (j.skill_category || 'SKILLED') === 'UNSKILLED').length})
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No jobs found in this category</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  There are currently no job openings matching your filter. Please try selecting "All Openings".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((j) => (
                  <div key={j.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{j.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              j.skill_category === 'UNSKILLED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {j.skill_category === 'UNSKILLED' ? '👷 WORKFORCE' : '🛠️ SKILLED'}
                            </span>
                          </div>
                          <div className="text-xs text-cyan-400 font-semibold">{j.company_name || 'Autonomous Systems Corp'}</div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {j.experience_level || 'ENTRY'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3">{j.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {(j.required_skills || []).map((s: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{j.location}</span>
                      <button
                        onClick={() => handleApplyForJob(j)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <span>Apply for Track</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE AI CHAMBER */}
        {activePortalTab === 'chamber' && (
          <div>
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
                      placeholder="Enter invitation token (e.g. TOKEN_XXXX)"
                      className="w-full mt-1.5 p-3.5 rounded-xl font-mono text-sm bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-cyan-300 font-bold outline-none uppercase tracking-wider"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={() => verifyAndLaunchToken(tokenInput, true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Authenticate & Enter Chamber</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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

            {step === 'SCORECARD_VIEW' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Interview Completed • Verified AI Evaluation Report</span>
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
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activePortalTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Candidate Profile</h2>
                <p className="text-xs text-slate-400">Update your contact details and skill tags.</p>
              </div>
            </div>

            {profileSavedMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={profileSkills}
                  onChange={(e) => setProfileSkills(e.target.value)}
                  placeholder="e.g. Python, ROS2, Control Systems, C++"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
              >
                Save Profile
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
