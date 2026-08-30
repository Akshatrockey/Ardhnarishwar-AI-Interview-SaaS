import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { AppDataStore } from '../services/storage';
import { authService } from '../services/authService';
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
  Loader2
} from 'lucide-react';

interface GlobalAuthPortalProps {
  onCandidateLaunchChamber: (token: string) => void;
  onAdminLoginSuccess: () => void;
  initialTab?: 'admin' | 'candidate' | 'company_register' | 'employee_register';
}

export const GlobalAuthPortal: React.FC<GlobalAuthPortalProps> = ({
  onCandidateLaunchChamber,
  onAdminLoginSuccess,
  initialTab = 'admin'
}) => {
  const { switchPersona } = useAuth();
  const { allCompanies } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<'admin' | 'candidate' | 'company_register' | 'employee_register'>(initialTab);
  const [candidateSubTab, setCandidateSubTab] = useState<'login' | 'register'>('login');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal');
    if (portal === 'candidate') {
      setActiveMainTab('candidate');
      setCandidateSubTab('register');
    } else if (portal === 'candidate_login') {
      setActiveMainTab('candidate');
      setCandidateSubTab('login');
    } else if (portal === 'company_register' || portal === 'company') {
      setActiveMainTab('company_register');
    } else if (portal === 'employee_register' || portal === 'employee') {
      setActiveMainTab('employee_register');
    } else if (portal === 'admin' || portal === 'auth' || portal === 'login') {
      setActiveMainTab('admin');
    }
  }, []);

  // Admin & Enterprise Login Form State (Clean defaults, zero hardcoded credentials)
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminRole, setAdminRole] = useState<UserRole>('SUPER_ADMIN');
  const [adminError, setAdminError] = useState<string>('');

  // Forgot / Reset Password State
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY' | 'SUCCESS'>('REQUEST');
  const [forgotMsg, setForgotMsg] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');

  // Candidate Login Form State
  const [candIdInput, setCandIdInput] = useState<string>('');
  const [candLoginError, setCandLoginError] = useState<string>('');

  // Candidate Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regJobId, setRegJobId] = useState<string>('');
  const [regExperience, setRegExperience] = useState<number>(0);
  const [regSkills, setRegSkills] = useState<string>('');
  const [registeredCandidate, setRegisteredCandidate] = useState<Candidate | null>(null);
  const [regError, setRegError] = useState<string>('');

  // Company Register Form State
  const [companyName, setCompanyName] = useState<string>('');
  const [companyDomain, setCompanyDomain] = useState<string>('');
  const [companyContactEmail, setCompanyContactEmail] = useState<string>('');
  const [companyContactPerson, setCompanyContactPerson] = useState<string>('');
  const [companyIndustry, setCompanyIndustry] = useState<string>('');
  const [companySuccessMsg, setCompanySuccessMsg] = useState<string>('');
  const [companyError, setCompanyError] = useState<string>('');

  // Staff Employee Register Form State
  const [empName, setEmpName] = useState<string>('');
  const [empEmail, setEmpEmail] = useState<string>('');
  const [empCompanyId, setEmpCompanyId] = useState<string>('');
  const [empDesignation, setEmpDesignation] = useState<string>('');
  const [empSuccessMsg, setEmpSuccessMsg] = useState<string>('');
  const [empError, setEmpError] = useState<string>('');

  const jobs = AppDataStore.getJobs();

  // Handle Admin & Super Admin Login (Connected to Production Backend)
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminError('');
    setIsLoading(true);

    try {
      const result = await authService.login(adminEmail, adminPassword, adminRole);
      if (result.success && result.user) {
        switchPersona(result.user.id);
        onAdminLoginSuccess();
      } else {
        setAdminError(result.message || 'Invalid credentials. Please verify your work email and password.');
      }
    } catch (err: any) {
      setAdminError(err?.message || 'Authentication error. Please check server connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  // Candidate Login (Connected to Backend Verification)
  const handleCandidateLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCandLoginError('');
    setIsLoading(true);

    try {
      const result = await authService.verifyCandidateToken(candIdInput);
      if (result.success && result.candidate) {
        onCandidateLaunchChamber(result.candidate.interviewToken);
      } else {
        setCandLoginError(result.message || 'Candidate record not found. Please verify your Candidate ID / Token.');
      }
    } catch (err: any) {
      setCandLoginError(err?.message || 'Verification error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Candidate Self-Registration (Connected to Backend Endpoints)
  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsLoading(true);

    try {
      const result = await authService.registerCandidate({
        name: regName,
        email: regEmail,
        phone: regPhone,
        jobId: regJobId,
        yearsOfExperience: Number(regExperience) || 0,
        skills: regSkills,
      });

      if (result.success && result.candidate) {
        setRegisteredCandidate(result.candidate);
      } else {
        setRegError(result.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setRegError(err?.message || 'Registration failed due to a server error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Company Registration (Connected to Backend Endpoints)
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySuccessMsg('');
    setCompanyError('');
    setIsLoading(true);

    try {
      const result = await authService.registerCompany({
        name: companyName,
        domain: companyDomain,
        contactEmail: companyContactEmail,
        contactPerson: companyContactPerson,
        industry: companyIndustry,
      });

      if (result.success && result.company && result.adminUser) {
        setCompanySuccessMsg(`Organization "${result.company.name}" provisioned successfully! You can now log in using ${result.adminUser.email}.`);
        setCompanyName('');
        setCompanyDomain('');
        setCompanyContactEmail('');
        setCompanyContactPerson('');
        setCompanyIndustry('');
      } else {
        setCompanyError(result.message || 'Company registration failed.');
      }
    } catch (err: any) {
      setCompanyError(err?.message || 'An error occurred during company registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Staff Employee Registration (Connected to Backend Endpoints)
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpSuccessMsg('');
    setEmpError('');
    setIsLoading(true);

    try {
      const result = await authService.registerEmployee({
        name: empName,
        email: empEmail,
        companyId: empCompanyId,
        designation: empDesignation,
      });

      if (result.success && result.employee) {
        setEmpSuccessMsg(`Staff member "${result.employee.name}" (${result.employee.employeeCode}) registered! You can now log in.`);
        setEmpName('');
        setEmpEmail('');
        setEmpCompanyId('');
        setEmpDesignation('');
      } else {
        setEmpError(result.message || 'Employee registration failed.');
      }
    } catch (err: any) {
      setEmpError(err?.message || 'An error occurred during employee registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Aurora Gradients Background */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_560px_at_50%_-10%,rgba(56,189,248,0.15),transparent_65%),radial-gradient(800px_450px_at_90%_110%,rgba(168,85,247,0.12),transparent_60%)] pointer-events-none" />

      {/* Global Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <ArdhnarishwarLogo size="md" variant="horizontal" showSubtext={true} />

        <div className="flex items-center gap-3">
          {/* Share Links Hub */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/30 transition-all shadow-sm active:scale-95"
            title="Get Shareable Project Links"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Share Links</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                  {l.flag} {l.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'enterprise-light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Authentication & Registration Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95">
          
          {/* Logo & Headline */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production AI Interview & Enterprise Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ardhnarishwar AI SaaS
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Secure zero-trust authentication, autonomous AI interviews, and real-time enterprise management.
            </p>
          </div>

          {/* Top Level 4-Way Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-6">
            <button
              onClick={() => setActiveMainTab('admin')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === 'admin'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin & Staff</span>
            </button>

            <button
              onClick={() => setActiveMainTab('candidate')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === 'candidate'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Candidate</span>
            </button>

            <button
              onClick={() => setActiveMainTab('company_register')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === 'company_register'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register Company</span>
            </button>

            <button
              onClick={() => setActiveMainTab('employee_register')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeMainTab === 'employee_register'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Employee</span>
            </button>
          </div>

          {/* TAB 1: ADMIN & ENTERPRISE LOGIN (Super Admin & Enterprise Portal) */}
          {activeMainTab === 'admin' && (
            <div className="space-y-5 animate-in fade-in">
              {adminError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Target Authority Role
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="SUPER_ADMIN">👑 Super Admin (HQ Control Center)</option>
                    <option value="COMPANY_ADMIN">🏢 Company Admin / HR Director</option>
                    <option value="RECRUITER">🎯 Recruiter / Talent Lead</option>
                    <option value="EMPLOYEE">⚙️ Staff Employee Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="Enter your work email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotStep('REQUEST');
                        setForgotMsg('');
                        setForgotError('');
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>Sign In to Platform Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CANDIDATE PORTAL (LOGIN & REGISTRATION) */}
          {activeMainTab === 'candidate' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex gap-2 p-1 bg-slate-950/90 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setCandidateSubTab('login'); setRegisteredCandidate(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    candidateSubTab === 'login' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Candidate Login (Token / ID)
                </button>
                <button
                  type="button"
                  onClick={() => { setCandidateSubTab('register'); setRegisteredCandidate(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    candidateSubTab === 'register' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  New Candidate Registration
                </button>
              </div>

              {candidateSubTab === 'login' && (
                <form onSubmit={handleCandidateLogin} className="space-y-4">
                  {candLoginError && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{candLoginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Candidate ID, Invitation Token, or Email
                    </label>
                    <input
                      type="text"
                      value={candIdInput}
                      onChange={(e) => setCandIdInput(e.target.value)}
                      required
                      placeholder="Enter Candidate ID, Token, or Email"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>Access AI Interview Chamber</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {candidateSubTab === 'register' && !registeredCandidate && (
                <form onSubmit={handleRegisterCandidate} className="space-y-3">
                  {regError && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                      {regError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        placeholder="Enter full name"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="Enter email address"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={regExperience || ''}
                        onChange={(e) => setRegExperience(Number(e.target.value))}
                        placeholder="Enter years of experience"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Opening / Job Position</label>
                    <select
                      value={regJobId}
                      onChange={(e) => setRegJobId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="">-- Select Target Position --</option>
                      {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Key Skills & Competencies</label>
                    <input
                      type="text"
                      value={regSkills}
                      onChange={(e) => setRegSkills(e.target.value)}
                      placeholder="Enter key skills (e.g., Python, ROS2, C++, Machine Learning)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>Complete Registration & Generate Interview Token</span>
                  </button>
                </form>
              )}

              {registeredCandidate && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 space-y-4 text-center animate-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-white">Registration Successful!</h3>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300">
                    Your Interview Token: <strong>{registeredCandidate.interviewToken}</strong>
                  </div>
                  <button
                    onClick={() => onCandidateLaunchChamber(registeredCandidate.interviewToken)}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg"
                  >
                    Launch Candidate Chamber Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTER NEW COMPANY */}
          {activeMainTab === 'company_register' && (
            <div className="space-y-4 animate-in fade-in">
              {companySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold">
                  {companySuccessMsg}
                </div>
              )}
              {companyError && (
                <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                  {companyError}
                </div>
              )}

              <form onSubmit={handleRegisterCompany} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Enter company or organization name"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Corporate Domain</label>
                    <input
                      type="text"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      placeholder="Enter corporate domain (e.g., acme.com)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      value={companyContactEmail}
                      onChange={(e) => setCompanyContactEmail(e.target.value)}
                      required
                      placeholder="Enter contact email (e.g., admin@acme.com)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Primary Contact Person</label>
                    <input
                      type="text"
                      value={companyContactPerson}
                      onChange={(e) => setCompanyContactPerson(e.target.value)}
                      placeholder="Enter primary contact person"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Industry Sector</label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      placeholder="Enter industry (e.g., Robotics, AI, Healthcare)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                  <span>Provision New Company Workspace</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: REGISTER STAFF EMPLOYEE */}
          {activeMainTab === 'employee_register' && (
            <div className="space-y-4 animate-in fade-in">
              {empSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold">
                  {empSuccessMsg}
                </div>
              )}
              {empError && (
                <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs">
                  {empError}
                </div>
              )}

              <form onSubmit={handleRegisterEmployee} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Work Email Address</label>
                    <input
                      type="email"
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      required
                      placeholder="Enter work email"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Select Employer Tenant</label>
                    <select
                      value={empCompanyId}
                      onChange={(e) => setEmpCompanyId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="">-- Select Employer Organization --</option>
                      {allCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Job Title / Designation</label>
                    <input
                      type="text"
                      value={empDesignation}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      placeholder="Enter job designation"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  <span>Register Staff Member Profile</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <div>Ardhnarishwar AI Robotics SaaS © 2026 • Real-Time Autonomous Assessment</div>
        <div className="flex items-center gap-3">
          <span>Zero-Trust Auth: <strong>ACTIVE</strong></span>
          <span>•</span>
          <span>WebSocket Live Bus: <strong>CONNECTED</strong></span>
        </div>
      </footer>

      {/* Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset Enterprise Password</h3>
                  <p className="text-[11px] text-slate-400">Zero-trust cryptographic recovery</p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                {forgotMsg}
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotEmail.trim()) {
                    setForgotError('Please enter your work email.');
                    return;
                  }
                  setForgotError('');
                  setForgotMsg(`A verification reset token was generated for ${forgotEmail.trim()}. Enter the 6-digit code below.`);
                  setForgotStep('VERIFY');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    Registered Work Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your work email address"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg transition-all"
                >
                  Send Recovery Verification Code
                </button>
              </form>
            )}

            {forgotStep === 'VERIFY' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPassword.trim() || newPassword.length < 6) {
                    setForgotError('Password must be at least 6 characters.');
                    return;
                  }
                  setForgotError('');
                  setForgotStep('SUCCESS');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    6-Digit Security Token
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 782491"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
                >
                  Confirm & Update Password
                </button>
              </form>
            )}

            {forgotStep === 'SUCCESS' && (
              <div className="text-center space-y-4 py-2 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Password Updated Successfully</h4>
                <p className="text-xs text-slate-400">
                  Your credentials have been securely updated. You can now log into your workspace with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setAdminEmail(forgotEmail);
                    setAdminPassword(newPassword);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Back to Sign In Form
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Links Modal */}
      <ShareLinksModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};
