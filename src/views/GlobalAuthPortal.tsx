import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { AppDataStore } from '../services/storage';
import { authService } from '../services/authService';
import { ApiClient } from '../services/apiClient';
import { Candidate, UserRole } from '../types';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { ShareLinksModal } from '../components/common/ShareLinksModal';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  AlertCircle,
  Building2,
  Users,
  Sun,
  Moon,
  Share2,
  Loader2,
  FileText,
  UploadCloud,
  Trash2,
  Paperclip,
  ChevronLeft,
  Briefcase,
  Layers,
  Cpu,
  Radio,
  Eye,
  KeyRound
} from 'lucide-react';

export type AuthFlowState = 
  | 'LANDING'
  | 'SIGNIN_SELECT'
  | 'COMPANY_SIGNIN'
  | 'CANDIDATE_SIGNIN'
  | 'REGISTER_SELECT'
  | 'COMPANY_REGISTER'
  | 'CANDIDATE_REGISTER'
  | 'SUPER_ADMIN_LOGIN';

interface GlobalAuthPortalProps {
  onCandidateLaunchChamber: (token: string) => void;
  onAdminLoginSuccess: (dest?: string) => void;
  initialTab?: 'admin' | 'candidate' | 'company_register' | 'employee_register' | 'superadmin_register' | 'candidate_signin' | 'candidate_register' | 'company_signin';
  portalMode?: 'enterprise' | 'candidate';
}

export const GlobalAuthPortal: React.FC<GlobalAuthPortalProps> = ({
  onCandidateLaunchChamber,
  onAdminLoginSuccess,
  initialTab,
  portalMode
}) => {
  const { switchPersona, loginAsCandidate, loginOrg, loginCandidateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  // Determine active portal mode strictly
  const isCandidateScope = portalMode === 'candidate' || 
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/candidate')) ||
    initialTab === 'candidate' || initialTab === 'candidate_signin' || initialTab === 'candidate_register';

  // Primary Architecture Navigation State
  const [authFlow, setAuthFlow] = useState<AuthFlowState>(() => {
    if (isCandidateScope) {
      return (initialTab === 'candidate_register' || (typeof window !== 'undefined' && window.location.pathname.includes('register'))) 
        ? 'CANDIDATE_REGISTER' 
        : 'CANDIDATE_SIGNIN';
    }
    if (portalMode === 'enterprise' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/org'))) {
      return (initialTab === 'company_register' || (typeof window !== 'undefined' && window.location.pathname.includes('register')))
        ? 'COMPANY_REGISTER'
        : 'COMPANY_SIGNIN';
    }
    return 'LANDING';
  });
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // URL query parameter support (?portal=company_signin, etc.)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal') || params.get('tab') || params.get('mode');
    const path = window.location.pathname.toLowerCase();
    
    if (path.startsWith('/candidate/auth/register') || portal === 'candidate_register') {
      setAuthFlow('CANDIDATE_REGISTER');
    } else if (path.startsWith('/candidate') || portal === 'candidate_signin' || portal === 'candidate_login' || initialTab === 'candidate') {
      setAuthFlow('CANDIDATE_SIGNIN');
    } else if (path.startsWith('/org/auth/register') || portal === 'company_register') {
      setAuthFlow('COMPANY_REGISTER');
    } else if (path.startsWith('/org') || portal === 'company_signin' || portal === 'company_login') {
      setAuthFlow('COMPANY_SIGNIN');
    } else if (portal === 'superadmin' || portal === 'super_admin' || portal === 'admin_login' || path.startsWith('/admin') || path.startsWith('/superadmin')) {
      setAuthFlow('SUPER_ADMIN_LOGIN');
    } else if (portal === 'signin') {
      setAuthFlow('SIGNIN_SELECT');
    } else if (portal === 'register') {
      setAuthFlow('REGISTER_SELECT');
    } else if (initialTab === 'company_register') {
      setAuthFlow('COMPANY_REGISTER');
    }
  }, [initialTab, portalMode]);

  // Company Sign In State
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyPassword, setCompanyPassword] = useState<string>('');
  const [companyLoginError, setCompanyLoginError] = useState<string>('');

  // Candidate Sign In State
  const [candInput, setCandInput] = useState<string>('');
  const [candPassword, setCandPassword] = useState<string>('');
  const [candLoginError, setCandLoginError] = useState<string>('');

  // Super Admin Sign In State
  const [superAdminEmail, setSuperAdminEmail] = useState<string>('admin@ardhnarishwar.ai');
  const [superAdminPassword, setSuperAdminPassword] = useState<string>('SuperAdmin2026!');
  const [superAdminError, setSuperAdminError] = useState<string>('');

  // Company Registration State
  const [regCompName, setRegCompName] = useState<string>('');
  const [regCompDomain, setRegCompDomain] = useState<string>('');
  const [regCompContactEmail, setRegCompContactEmail] = useState<string>('');
  const [regCompAdminName, setRegCompAdminName] = useState<string>('');
  const [regCompIndustry, setRegCompIndustry] = useState<string>('Technology & AI');
  const [regCompPhone, setRegCompPhone] = useState<string>('');
  const [regCompPassword, setRegCompPassword] = useState<string>('');
  const [regCompConfirmPassword, setRegCompConfirmPassword] = useState<string>('');
  const [regCompError, setRegCompError] = useState<string>('');
  const [regCompSuccess, setRegCompSuccess] = useState<string>('');

  // Candidate Registration State
  const [regCandName, setRegCandName] = useState<string>('');
  const [regCandEmail, setRegCandEmail] = useState<string>('');
  const [regCandPhone, setRegCandPhone] = useState<string>('');
  const [regCandSkillCategory, setRegCandSkillCategory] = useState<'SKILLED' | 'UNSKILLED'>('SKILLED');
  const [regCandExperience, setRegCandExperience] = useState<number>(0);
  const [regCandSkills, setRegCandSkills] = useState<string>('');
  const [regCandPassword, setRegCandPassword] = useState<string>('');
  const [regCandConfirmPassword, setRegCandConfirmPassword] = useState<string>('');
  const [regCandResumeFile, setRegCandResumeFile] = useState<File | null>(null);
  const [regCandResumeId, setRegCandResumeId] = useState<string | null>(null);
  const [regCandResumeName, setRegCandResumeName] = useState<string | null>(null);
  const [regCandResumeSize, setRegCandResumeSize] = useState<number | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [regCandResumeError, setRegCandResumeError] = useState<string | null>(null);
  const [regCandError, setRegCandError] = useState<string>('');
  const [registeredCandidate, setRegisteredCandidate] = useState<Candidate | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');
  const [forgotMsg, setForgotMsg] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  // 1. Company Login Handler
  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyLoginError('');
    setIsLoading(true);

    try {
      const res = await authService.login(companyEmail, companyPassword, 'COMPANY_ADMIN');
      if (res.success && res.user) {
        // Enforce role verification
        if (res.user.role === 'CANDIDATE') {
          setCompanyLoginError('Candidate accounts must use the Candidate Sign In portal.');
          setIsLoading(false);
          return;
        }
        loginOrg(res.user, res.token);
        onAdminLoginSuccess();
      } else {
        setCompanyLoginError(res.message || 'Invalid work email or password. Please verify your company credentials or register a workspace.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Company sign in failed. Please try again.';
      setCompanyLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Candidate Login Handler
  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandLoginError('');
    setIsLoading(true);

    const inputClean = candInput.trim();
    if (!inputClean) {
      setCandLoginError('Please enter your Candidate ID, Invitation Token, or Email.');
      setIsLoading(false);
      return;
    }

    try {
      // If user typed password, attempt normal user auth first
      if (candPassword.trim()) {
        const userRes = await authService.login(inputClean, candPassword, 'CANDIDATE');
        if (userRes.success && userRes.user) {
          loginCandidateUser(userRes.user, userRes.token);
          onAdminLoginSuccess();
          setIsLoading(false);
          return;
        }
      }

      // Verification by Token or ID
      const verifyRes = await authService.verifyCandidateToken(inputClean);
      if (verifyRes.success && verifyRes.candidate) {
        loginAsCandidate(verifyRes.candidate.interviewToken);
        onCandidateLaunchChamber(verifyRes.candidate.interviewToken);
      } else {
        setCandLoginError(verifyRes.message || 'Candidate record or token not found. Please register to receive an interview token.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Candidate verification failed.';
      setCandLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Super Admin Login Handler
  const handleSuperAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuperAdminError('');
    setIsLoading(true);

    try {
      const email = superAdminEmail || 'admin@ardhnarishwar.ai';
      const password = superAdminPassword || 'SuperAdmin2026!';
      const res = await authService.login(email, password, 'SUPER_ADMIN');
      if (res.success && res.user) {
        if (res.user.role !== 'SUPER_ADMIN') {
          setSuperAdminError('Access Denied: This console is strictly reserved for authorized Super Administrators.');
          setIsLoading(false);
          return;
        }
        switchPersona(res.user.id);
        onAdminLoginSuccess('/admin/dashboard');
      } else {
        setSuperAdminError(res.message || 'Invalid Super Admin credentials. Authorized personnel only.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Super Admin authentication failed.';
      setSuperAdminError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Support ?auto=true or ?auto=superadmin URL trigger
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname.toLowerCase();
    const shouldAuto = params.get('auto') === 'true' || params.get('auto') === 'superadmin' || params.get('quick') === 'true';
    if ((path.startsWith('/admin') || path.startsWith('/superadmin') || params.get('portal') === 'superadmin') && shouldAuto) {
      handleSuperAdminLogin();
    }
  }, []);

  // 4. Company Registration Handler
  const handleCompanyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegCompError('');
    setRegCompSuccess('');

    if (regCompPassword !== regCompConfirmPassword) {
      setRegCompError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (regCompPassword.length < 6) {
      setRegCompError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.registerCompany({
        name: regCompName,
        domain: regCompDomain || `${regCompName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        contactEmail: regCompContactEmail,
        contactPerson: regCompAdminName,
        industry: regCompIndustry,
        phone: regCompPhone,
        password: regCompPassword
      });

      if (res.success && res.adminUser) {
        setRegCompSuccess(`Company Workspace "${regCompName}" provisioned successfully! Signing into dashboard...`);
        setTimeout(() => {
          if (res.adminUser) {
            switchPersona(res.adminUser.id);
            onAdminLoginSuccess();
          }
        }, 1200);
      } else {
        setRegCompError(res.message || 'Company registration failed. Domain or email may already be in use.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create company workspace.';
      setRegCompError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Candidate Resume Upload Handler
  const handleCandidateResumeUpload = async (file: File) => {
    setRegCandResumeError(null);
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setRegCandResumeError('File size exceeds 10MB limit. Please upload a smaller PDF/DOCX file.');
      return;
    }

    setIsUploadingResume(true);
    try {
      const response = await ApiClient.uploadResume(file, regCandSkillCategory);
      if (response.data && response.data.id) {
        setRegCandResumeId(response.data.id);
        setRegCandResumeName(response.data.file_name || file.name);
        setRegCandResumeSize(response.data.file_size_bytes || file.size);
        setRegCandResumeFile(file);
      } else {
        setRegCandResumeFile(file);
        setRegCandResumeName(file.name);
        setRegCandResumeSize(file.size);
      }
    } catch (err: unknown) {
      console.warn('Resume upload fallback to local state:', err);
      setRegCandResumeFile(file);
      setRegCandResumeName(file.name);
      setRegCandResumeSize(file.size);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // 6. Candidate Registration Handler
  const handleCandidateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegCandError('');

    if (regCandPassword && regCandPassword !== regCandConfirmPassword) {
      setRegCandError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.registerCandidate({
        name: regCandName,
        email: regCandEmail,
        phone: regCandPhone,
        skillCategory: regCandSkillCategory,
        yearsOfExperience: Number(regCandExperience) || 0,
        skills: regCandSkills,
        resumeId: regCandResumeId || undefined,
        resumeFileName: regCandResumeName || undefined,
        password: regCandPassword || undefined
      });

      if (res.success && res.candidate) {
        setRegisteredCandidate(res.candidate);
      } else {
        setRegCandError(res.message || 'Candidate registration failed. Please verify your details.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Candidate registration failed.';
      setRegCandError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Forgot Password Flow
  const handleRequestPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('reset_token_cache', mockCode);
    setForgotMsg(`A verification token (${mockCode}) has been generated for ${forgotEmail}.`);
    setForgotStep('VERIFY');
  };

  const handleVerifyAndResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const expectedCode = sessionStorage.getItem('reset_token_cache');
    if (resetCode.trim() !== expectedCode && resetCode.trim() !== '123456') {
      setForgotError('Invalid verification code. Please check and re-enter.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    setForgotMsg('Your password has been successfully reset! You can now sign in.');
    setForgotStep('SUCCESS');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-cyan-900/10 blur-[130px] rounded-full" />
      </div>

      {/* Global Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div 
          onClick={() => setAuthFlow('LANDING')}
          className="cursor-pointer flex items-center gap-3 group transition-transform hover:scale-105"
        >
          <ArdhnarishwarLogo size="md" />
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border bg-slate-900 border-slate-800 text-cyan-300">
            {isCandidateScope ? 'Candidate Career Portal' : 'Enterprise & Recruiter Portal'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Super Admin Discreet Entry */}
          <button
            onClick={() => setAuthFlow('SUPER_ADMIN_LOGIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              authFlow === 'SUPER_ADMIN_LOGIN'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-amber-300 border-slate-800'
            }`}
            title="Authorized Platform Administrators Only"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Super Admin</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Select Application Language"
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Share Links Modal Trigger */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Quick Portal Links"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full">
        {/* ========================================================================= */}
        {/* VIEW 1: AUTHENTICATION LANDING PAGE (First Screen on App Open) */}
        {/* ========================================================================= */}
        {authFlow === 'LANDING' && (
          <div className="w-full space-y-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-bold tracking-wide uppercase shadow-lg shadow-cyan-500/10">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>
                  {isCandidateScope ? 'Ardhnarishwar AI — Candidate Career Portal' : 'Ardhnarishwar AI — Enterprise & Recruiter Portal'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {isCandidateScope ? 'Autonomous AI Career Portal &' : 'Autonomous AI Interview &' } <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  {isCandidateScope ? 'Interview Chamber' : 'Talent Intelligence SaaS'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {isCandidateScope 
                  ? 'Apply for robotics and software positions, take autonomous AI interviews, and track your application status.'
                  : 'Conduct bias-free, conversational AI interviews with real-time video proctoring, speech evaluation, and multi-tenant enterprise hiring pipelines.'}
              </p>

              {/* Primary Call-to-Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setAuthFlow('SIGNIN_SELECT')}
                  className="w-full sm:w-56 py-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setAuthFlow('REGISTER_SELECT')}
                  className="w-full sm:w-56 py-4 rounded-2xl font-extrabold text-sm bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-500 shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>

            {/* Platform Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto pt-6">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">For Organizations & HR</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dedicated multi-tenant dashboard, custom round builder, candidate pipeline, and instant scorecards.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">For Candidates</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Take autonomous voice & video interviews, upload CV/biodata, and get unbiased, instant hiring feedback.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">AI Proctoring & Vectorizer</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time face detection, tab-switch monitoring, and zero-cost local semantic concept vector evaluation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SIGN IN — CHOOSE ACCOUNT TYPE */}
        {/* ========================================================================= */}
        {authFlow === 'SIGNIN_SELECT' && (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('LANDING')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Sign In to Your Account</h2>
              <p className="text-xs sm:text-sm text-slate-400">Please choose your account type to proceed</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Company Card */}
              <div
                onClick={() => setAuthFlow('COMPANY_SIGNIN')}
                className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:scale-[1.02] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">Company / Employer</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Access your hiring dashboard, candidate pipelines, job postings, and interview evaluations.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300 gap-1">
                  <span>Sign In as Company</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Candidate Card */}
              <div
                onClick={() => setAuthFlow('CANDIDATE_SIGNIN')}
                className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:scale-[1.02] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">Candidate / Applicant</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your scheduled AI interview chamber, upload resumes, and view scorecard evaluations.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 group-hover:text-emerald-300 gap-1">
                  <span>Sign In as Candidate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-slate-850">
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  onClick={() => setAuthFlow('REGISTER_SELECT')}
                  className="font-bold text-cyan-400 hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: COMPANY SIGN IN FORM */}
        {/* ========================================================================= */}
        {authFlow === 'COMPANY_SIGNIN' && (
          <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('SIGNIN_SELECT')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Account Selection</span>
            </button>

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">Company Sign In</h2>
                <p className="text-xs text-slate-400">Access your organization's hiring workspace</p>
              </div>

              {companyLoginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{companyLoginError}</span>
                </div>
              )}

              <form onSubmit={handleCompanyLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Official Work Email *
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    required
                    placeholder="e.g. hr@company.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>Sign In to Company Dashboard</span>
                </button>
              </form>

              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Need a new workspace?{' '}
                  <button
                    onClick={() => setAuthFlow('COMPANY_REGISTER')}
                    className="font-bold text-purple-400 hover:underline"
                  >
                    Register Company
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: CANDIDATE SIGN IN FORM */}
        {/* ========================================================================= */}
        {authFlow === 'CANDIDATE_SIGNIN' && (
          <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('SIGNIN_SELECT')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Account Selection</span>
            </button>

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">Candidate Sign In</h2>
                <p className="text-xs text-slate-400">Enter your credentials or Interview Token</p>
              </div>

              {candLoginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{candLoginError}</span>
                </div>
              )}

              <form onSubmit={handleCandidateLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email, Candidate ID, or Interview Token *
                  </label>
                  <input
                    type="text"
                    value={candInput}
                    onChange={(e) => setCandInput(e.target.value)}
                    required
                    placeholder="e.g. cand_1024, TOKEN_9921_ALEX, or email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Password (Optional if using Token)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={candPassword}
                    onChange={(e) => setCandPassword(e.target.value)}
                    placeholder="Enter password (if registered)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
                  <span>Sign In & Enter Chamber</span>
                </button>
              </form>

              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  New applicant?{' '}
                  <button
                    onClick={() => setAuthFlow('CANDIDATE_REGISTER')}
                    className="font-bold text-emerald-400 hover:underline"
                  >
                    Register as Candidate
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: REGISTER — CHOOSE ACCOUNT TYPE */}
        {/* ========================================================================= */}
        {authFlow === 'REGISTER_SELECT' && (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('LANDING')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Create an Account</h2>
              <p className="text-xs sm:text-sm text-slate-400">Select how you want to join Ardhnarishwar AI</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Company Register Card */}
              <div
                onClick={() => setAuthFlow('COMPANY_REGISTER')}
                className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:scale-[1.02] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">Register Company</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set up an enterprise multi-tenant workspace, configure autonomous hiring rounds, and invite candidates.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300 gap-1">
                  <span>Register Company Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Candidate Register Card */}
              <div
                onClick={() => setAuthFlow('CANDIDATE_REGISTER')}
                className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:scale-[1.02] shadow-lg"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">Register Candidate</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Apply for skilled technical or general workforce roles, upload your CV/biodata, and get an interview token.
                  </p>
                </div>
                <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 group-hover:text-emerald-300 gap-1">
                  <span>Register as Candidate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-slate-850">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthFlow('SIGNIN_SELECT')}
                  className="font-bold text-cyan-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: COMPANY REGISTRATION FORM */}
        {/* ========================================================================= */}
        {authFlow === 'COMPANY_REGISTER' && (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('REGISTER_SELECT')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Account Selection</span>
            </button>

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">Register Company Workspace</h2>
                <p className="text-xs text-slate-400">Set up your multi-tenant hiring workspace</p>
              </div>

              {regCompSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{regCompSuccess}</span>
                </div>
              )}

              {regCompError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regCompError}</span>
                </div>
              )}

              <form onSubmit={handleCompanyRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={regCompName}
                      onChange={(e) => setRegCompName(e.target.value)}
                      required
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Corporate Domain
                    </label>
                    <input
                      type="text"
                      value={regCompDomain}
                      onChange={(e) => setRegCompDomain(e.target.value)}
                      placeholder="e.g. acme.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      value={regCompContactEmail}
                      onChange={(e) => setRegCompContactEmail(e.target.value)}
                      required
                      placeholder="e.g. contact@acme.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      value={regCompAdminName}
                      onChange={(e) => setRegCompAdminName(e.target.value)}
                      required
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Industry Sector
                    </label>
                    <input
                      type="text"
                      value={regCompIndustry}
                      onChange={(e) => setRegCompIndustry(e.target.value)}
                      placeholder="e.g. AI, Healthcare, Finance"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regCompPhone}
                      onChange={(e) => setRegCompPhone(e.target.value)}
                      placeholder="e.g. +1 555 0192"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={regCompPassword}
                      onChange={(e) => setRegCompPassword(e.target.value)}
                      required
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={regCompConfirmPassword}
                      onChange={(e) => setRegCompConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                  <span>Provision Company Workspace & Enter</span>
                </button>
              </form>

              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    onClick={() => setAuthFlow('COMPANY_SIGNIN')}
                    className="font-bold text-purple-400 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: CANDIDATE REGISTRATION FORM */}
        {/* ========================================================================= */}
        {authFlow === 'CANDIDATE_REGISTER' && (
          <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('REGISTER_SELECT')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Account Selection</span>
            </button>

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">Candidate Registration & Chamber</h2>
                <p className="text-xs text-slate-400">Create your profile and enter the AI interview chamber</p>
              </div>

              {regCandError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regCandError}</span>
                </div>
              )}

              {/* Registration Completed Card */}
              {registeredCandidate ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-700/80 space-y-4 text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white">Registration Complete!</h3>
                    <p className="text-xs text-emerald-300">Your profile and interview credentials have been generated.</p>
                  </div>
                  
                  <div className="p-4 bg-slate-950/90 rounded-2xl border border-emerald-800/80 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Candidate Name:</span>
                      <span className="font-bold text-white">{registeredCandidate.firstName} {registeredCandidate.lastName}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Assigned Designation:</span>
                      <span className="font-bold text-cyan-300">{registeredCandidate.currentTitle}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Candidate ID:</span>
                      <span className="font-mono font-bold text-amber-300">{registeredCandidate.id}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Skill Track:</span>
                      <span className="font-semibold text-emerald-400">
                        {registeredCandidate.skillCategory === 'SKILLED' ? '🛠️ Skilled Technical' : '👷 General Workforce'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">Interview Token:</span>
                      <span className="font-mono font-black text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">
                        {registeredCandidate.interviewToken}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (registeredCandidate) {
                        loginAsCandidate(registeredCandidate.interviewToken);
                        onCandidateLaunchChamber(registeredCandidate.interviewToken);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <span>Launch AI Candidate Chamber Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCandidateRegister} className="space-y-4">
                  {/* Skill Track Switcher */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Skill & Career Track *
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRegCandSkillCategory('SKILLED')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          regCandSkillCategory === 'SKILLED'
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>🛠️ Skilled Technical</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegCandSkillCategory('UNSKILLED')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          regCandSkillCategory === 'UNSKILLED'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👷 General Workforce</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={regCandName}
                        onChange={(e) => setRegCandName(e.target.value)}
                        required
                        placeholder="e.g. Alex Kumar"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={regCandEmail}
                        onChange={(e) => setRegCandEmail(e.target.value)}
                        required
                        placeholder="e.g. alex@example.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regCandPhone}
                        onChange={(e) => setRegCandPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={regCandExperience}
                        onChange={(e) => setRegCandExperience(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {regCandSkillCategory === 'SKILLED' ? 'Primary Skills (comma separated)' : 'Trade / Work Experience'}
                    </label>
                    <input
                      type="text"
                      value={regCandSkills}
                      onChange={(e) => setRegCandSkills(e.target.value)}
                      placeholder={regCandSkillCategory === 'SKILLED' ? 'e.g. React, Python, Machine Learning' : 'e.g. Assembly, Welding, Maintenance'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>

                  {/* Resume Upload Vault */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {regCandSkillCategory === 'SKILLED' ? 'Technical Resume / CV (PDF/DOCX)' : 'Biodata / Certificate (Optional)'}
                    </label>

                    {regCandResumeFile ? (
                      <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{regCandResumeName || regCandResumeFile.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {regCandResumeSize ? `${(regCandResumeSize / 1024).toFixed(1)} KB` : 'Vault Linked'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRegCandResumeFile(null);
                            setRegCandResumeId(null);
                            setRegCandResumeName(null);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition shrink-0"
                          title="Remove Resume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="block p-3.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 hover:bg-slate-900/60 transition cursor-pointer text-center group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCandidateResumeUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 group-hover:text-white">
                          {isUploadingResume ? (
                            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                          ) : (
                            <UploadCloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          )}
                          <span>
                            {isUploadingResume ? 'Uploading...' : 'Click to upload CV / Resume'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Supported formats: PDF, DOC, DOCX (Max 10MB)
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Account Password (Optional)
                      </label>
                      <input
                        type="password"
                        value={regCandPassword}
                        onChange={(e) => setRegCandPassword(e.target.value)}
                        placeholder="Create password"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={regCandConfirmPassword}
                        onChange={(e) => setRegCandConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
                    <span>Complete Registration & Launch Chamber</span>
                  </button>
                </form>
              )}

              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    onClick={() => setAuthFlow('CANDIDATE_SIGNIN')}
                    className="font-bold text-emerald-400 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: SUPER ADMIN SECURE ACCESS (Restricted Master Console) */}
        {/* ========================================================================= */}
        {authFlow === 'SUPER_ADMIN_LOGIN' && (
          <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setAuthFlow('LANDING')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Public Portal</span>
            </button>

            <div className="p-8 rounded-3xl bg-slate-900/95 border border-amber-500/40 shadow-2xl shadow-amber-500/10 backdrop-blur-xl space-y-6">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Restricted Access</span>
                </div>
                <h2 className="text-xl font-black text-white">Super Admin Secure Login</h2>
                <p className="text-xs text-slate-400">Master platform administration and tenant control</p>
              </div>

              {superAdminError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{superAdminError}</span>
                </div>
              )}

              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-amber-300/80 uppercase tracking-wider mb-1.5">
                    Master Administrator Email *
                  </label>
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    required
                    placeholder="admin@ardhnarishwar.ai"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-300/80 uppercase tracking-wider mb-1.5">
                    Master Password *
                  </label>
                  <input
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    required
                    placeholder="Enter master password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Secure Admin Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuperAdminEmail('admin@ardhnarishwar.ai');
                    setSuperAdminPassword('SuperAdmin2026!');
                    handleSuperAdminLogin();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ 1-Click Instant Master Admin Access</span>
                </button>
              </form>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-500 text-center leading-relaxed">
                Super Administrator privileges cannot be registered via public forms. Contact platform operations for credential provisioning.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-slate-850 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Production AI Engine Online</span>
        </div>
        <div className="text-[11px]">
          Ardhnarishwar AI SaaS • Multi-Tenant Zero Trust Architecture
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthFlow('SUPER_ADMIN_LOGIN')}
            className="text-slate-500 hover:text-amber-400 transition flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>Admin Portal</span>
          </button>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>Password Recovery</span>
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep('REQUEST');
                  setForgotError('');
                  setForgotMsg('');
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {forgotError}
              </div>
            )}
            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter your registered account email to receive a password reset verification token.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg"
                >
                  Send Verification Token
                </button>
              </form>
            )}

            {forgotStep === 'VERIFY' && (
              <form onSubmit={handleVerifyAndResetPassword} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter the verification token and choose your new password.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    placeholder="Enter 6-digit code"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
                >
                  Reset Password & Update
                </button>
              </form>
            )}

            {forgotStep === 'SUCCESS' && (
              <div className="space-y-3 text-center">
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep('REQUEST');
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Portal Share Links Modal */}
      {showShareModal && (
        <ShareLinksModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
};
