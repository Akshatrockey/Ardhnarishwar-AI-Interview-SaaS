import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, LanguageCode, CurrencyCode } from '../context/LanguageContext';
import { AppDataStore } from '../services/storage';
import { Candidate, Company, User, UserRole } from '../types';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Sparkles, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Coins, 
  Laptop,
  AlertCircle,
  Building2,
  Users,
  Sun,
  Moon,
  Clock,
  Video
} from 'lucide-react';

interface GlobalAuthPortalProps {
  onCandidateLaunchChamber: (token: string) => void;
  onAdminLoginSuccess: () => void;
}

export const GlobalAuthPortal: React.FC<GlobalAuthPortalProps> = ({
  onCandidateLaunchChamber,
  onAdminLoginSuccess
}) => {
  const { switchPersona } = useAuth();
  const { allCompanies, selectCompany } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, currency, setCurrency } = useLanguage();

  const [activeMainTab, setActiveMainTab] = useState<'admin' | 'candidate' | 'company_register' | 'employee_register'>('admin');
  const [candidateSubTab, setCandidateSubTab] = useState<'login' | 'register'>('login');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState<string>('admin@ardhnarishwar.ai');
  const [adminPassword, setAdminPassword] = useState<string>('Ardhnarishwar2026!');
  const [adminRole, setAdminRole] = useState<UserRole>('SUPER_ADMIN');
  const [adminError, setAdminError] = useState<string>('');

  // Candidate login form
  const [candIdInput, setCandIdInput] = useState<string>('');
  const [candEmailInput, setCandEmailInput] = useState<string>('');
  const [candLoginError, setCandLoginError] = useState<string>('');

  // Candidate register form
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regJobId, setRegJobId] = useState<string>('');
  const [regExperience, setRegExperience] = useState<number>(2);
  const [regSkills, setRegSkills] = useState<string>('Python, ROS2, Robotics, C++');
  const [regResumeName, setRegResumeName] = useState<string>('');
  const [registeredCandidate, setRegisteredCandidate] = useState<Candidate | null>(null);
  const [regError, setRegError] = useState<string>('');

  // Company Register Form
  const [companyName, setCompanyName] = useState<string>('');
  const [companyDomain, setCompanyDomain] = useState<string>('');
  const [companyContactEmail, setCompanyContactEmail] = useState<string>('');
  const [companyContactPerson, setCompanyContactPerson] = useState<string>('');
  const [companyIndustry, setCompanyIndustry] = useState<string>('Autonomous Robotics & AI');
  const [companySuccessMsg, setCompanySuccessMsg] = useState<string>('');

  // Employee Register Form
  const [empName, setEmpName] = useState<string>('');
  const [empEmail, setEmpEmail] = useState<string>('');
  const [empCompanyId, setEmpCompanyId] = useState<string>('comp_cyberdyne');
  const [empDesignation, setEmpDesignation] = useState<string>('Robotics Controls Engineer');
  const [empSuccessMsg, setEmpSuccessMsg] = useState<string>('');

  const jobs = AppDataStore.getJobs();

  // Handle Admin Login
  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminError('');

    const users = AppDataStore.getUsers();
    let found = users.find(u => u.email.toLowerCase() === adminEmail.trim().toLowerCase());
    
    if (!found) {
      found = users.find(u => u.role === adminRole) || users[0];
    }

    if (found) {
      switchPersona(found.id);
      onAdminLoginSuccess();
    } else {
      setAdminError('Invalid credentials. Please verify your enterprise email and password.');
    }
  };

  // Quick 1-Click Persona Login
  const handleQuickPersona = (role: UserRole, email: string) => {
    setAdminEmail(email);
    setAdminRole(role);
    const users = AppDataStore.getUsers();
    const user = users.find(u => u.role === role) || users[0];
    if (user) {
      switchPersona(user.id);
      onAdminLoginSuccess();
    }
  };

  // Candidate Login
  const handleCandidateLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCandLoginError('');
    const candidates = AppDataStore.getCandidates();
    
    const found = candidates.find(c => {
      const matchId = candIdInput ? (c.id.includes(candIdInput.trim()) || c.interviewToken.toUpperCase().includes(candIdInput.trim().toUpperCase())) : false;
      const matchEmail = candEmailInput ? c.email.toLowerCase() === candEmailInput.trim().toLowerCase() : false;
      return matchId || matchEmail;
    });

    if (found) {
      onCandidateLaunchChamber(found.interviewToken);
    } else {
      setCandLoginError('Candidate record not found. Please verify your Candidate ID / Token or register below.');
    }
  };

  // Candidate Registration Handler
  const handleRegisterCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Please provide your Full Name and Email address.');
      return;
    }

    const selectedJobId = regJobId || jobs[0]?.id || 'job_cyber_01';
    const targetJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

    const nameParts = regName.trim().split(' ');
    const firstName = nameParts[0] || 'Candidate';
    const lastName = nameParts.slice(1).join(' ') || 'Applicant';

    const numericId = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `cand_${numericId}`;
    const token = `TOKEN_${numericId}_${firstName.toUpperCase()}`;

    const newCand: Candidate = {
      id: candidateId,
      companyId: targetJob?.companyId || 'comp_cyberdyne',
      jobId: selectedJobId,
      firstName,
      lastName,
      email: regEmail.trim(),
      phone: regPhone.trim() || '+1 (555) 019-2834',
      currentTitle: `${regExperience > 2 ? 'Senior' : 'Junior'} ${targetJob?.title || 'Robotics Engineer'}`,
      yearsOfExperience: Number(regExperience),
      status: 'SHORTLISTED',
      interviewToken: token,
      appliedAt: new Date().toISOString(),
      resumeFileName: regResumeName || `${firstName}_${lastName}_Resume.pdf`,
      skills: regSkills.split(',').map(s => s.trim()).filter(Boolean),
      meetingRoomId: `ROOM-PANEL-${firstName.toUpperCase()}-${lastName.toUpperCase()}-2026`
    };

    const existing = AppDataStore.getCandidates();
    AppDataStore.saveCandidates([newCand, ...existing]);

    AppDataStore.logActivity({
      companyId: newCand.companyId,
      actorId: candidateId,
      actorName: regName,
      actorRole: 'CANDIDATE',
      action: 'CANDIDATE_SELF_REGISTERED',
      resource: `Candidate ID #${numericId} for ${targetJob?.title}`,
      details: `Self-service application submitted with resume ${newCand.resumeFileName}. Unique token ${token} generated with direct video meeting room.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    setRegisteredCandidate(newCand);
  };

  // Company Registration Handler
  const handleRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyContactEmail.trim()) return;

    const newCompId = `comp_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(100 + Math.random() * 900)}`;
    const newCompany: Company = {
      id: newCompId,
      name: companyName.trim(),
      slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      domain: companyDomain.trim() || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
      plan: 'GROWTH',
      status: 'ACTIVE',
      maxJobs: 25,
      maxCandidatesPerMonth: 1000,
      createdAt: new Date().toISOString(),
      contactEmail: companyContactEmail.trim(),
      contactPerson: companyContactPerson.trim() || 'Admin Lead',
      industry: companyIndustry,
      aiCustomRulesEnabled: true,
      recordingStorageUsedMb: 0,
      recordingStorageQuotaMb: 10000,
      meetingRoomId: `ROOM-${companyName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-2026`
    };

    const companies = AppDataStore.getCompanies();
    AppDataStore.saveCompanies([newCompany, ...companies]);

    // Create an Admin user for this company
    const newAdminUser: User = {
      id: `usr_${newCompId}_admin`,
      email: companyContactEmail.trim(),
      name: companyContactPerson.trim() || 'Admin Lead',
      role: 'COMPANY_ADMIN',
      companyId: newCompId,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      designation: 'VP of Talent & Engineering',
      meetingRoomId: newCompany.meetingRoomId
    };

    const users = AppDataStore.getUsers();
    AppDataStore.saveUsers([newAdminUser, ...users]);

    setCompanySuccessMsg(`Company ${newCompany.name} successfully registered! You can now log in with ${newAdminUser.email}.`);
  };

  // Employee Registration Handler
  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) return;

    const empId = `usr_emp_${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmp: User = {
      id: empId,
      email: empEmail.trim(),
      name: empName.trim(),
      role: 'EMPLOYEE',
      companyId: empCompanyId,
      designation: empDesignation,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      employeeCode: `EMP-CYBER-${Math.floor(100 + Math.random() * 900)}`,
      totalPunchHours: 0,
      assignedInterviewsCount: 0,
      meetingRoomId: `ROOM-EMP-${empName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-2026`
    };

    const users = AppDataStore.getUsers();
    AppDataStore.saveUsers([newEmp, ...users]);

    setEmpSuccessMsg(`Staff Employee ${newEmp.name} (${newEmp.employeeCode}) registered! You can now sign in.`);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Aurora Gradients Background */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_560px_at_50%_-10%,rgba(56,189,248,0.15),transparent_65%),radial-gradient(800px_450px_at_90%_110%,rgba(168,85,247,0.12),transparent_60%)] pointer-events-none" />

      {/* Global Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <ArdhnarishwarLogo size="md" variant="horizontal" showSubtext={true} />

        <div className="flex items-center gap-3">
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
              <span>Next-Gen Real-Time AI Interview & Video Meeting Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ardhnarishwar Global Enterprise SaaS
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Autonomous AI video screening, zero-bias candidate evaluation, live recruiter intercom, and Zoom-style conference meetings.
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
              <span>Admin & HR</span>
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

          {/* TAB 1: ADMIN & HR LOGIN */}
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
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@ardhnarishwar.ai"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Platform Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 1-Click Fast Enterprise Role Switcher */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  ⚡ 1-Click Fast Enterprise Logins
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('SUPER_ADMIN', 'admin@ardhnarishwar.ai')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <div className="text-[11px] font-bold text-cyan-300">👑 Super Admin</div>
                    <div className="text-[9px] text-slate-400 truncate">Global HQ</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('COMPANY_ADMIN', 'admin@cyberdyne.io')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <div className="text-[11px] font-bold text-indigo-300">🏢 HR Director</div>
                    <div className="text-[9px] text-slate-400 truncate">Cyberdyne</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('RECRUITER', 'recruiter@cyberdyne.io')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <div className="text-[11px] font-bold text-purple-300">🎯 Recruiter</div>
                    <div className="text-[9px] text-slate-400 truncate">Talent Lead</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPersona('EMPLOYEE', 'alex.mercer@cyberdyne.io')}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all"
                  >
                    <div className="text-[11px] font-bold text-teal-300">⚙️ Staff Engineer</div>
                    <div className="text-[9px] text-slate-400 truncate">Alex Mercer</div>
                  </button>
                </div>
              </div>
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
                  Candidate Login (I have ID/Token)
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
                      placeholder="e.g. cand_priya_01 or TOKEN_PRIYA_ROBOTICS_2026"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
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
                        placeholder="Priya Sharma"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        placeholder="priya.sharma@example.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Opening</label>
                      <select
                        value={regJobId}
                        onChange={(e) => setRegJobId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        {jobs.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={regExperience}
                        onChange={(e) => setRegExperience(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Complete Registration & Generate Token</span>
                    <ArrowRight className="w-4 h-4" />
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

              <form onSubmit={handleRegisterCompany} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Quantum Dynamics Corp"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Corporate Domain</label>
                    <input
                      type="text"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      placeholder="quantumdynamics.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={companyContactEmail}
                      onChange={(e) => setCompanyContactEmail(e.target.value)}
                      required
                      placeholder="admin@quantumdynamics.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
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

              <form onSubmit={handleRegisterEmployee} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      required
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Employee Email</label>
                    <input
                      type="email"
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      required
                      placeholder="alex.mercer@cyberdyne.io"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Select Employer Tenant</label>
                  <select
                    value={empCompanyId}
                    onChange={(e) => setEmpCompanyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {allCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-extrabold text-sm bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
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
          <span>WebSocket Bus: <strong>ACTIVE</strong></span>
          <span>•</span>
          <span>Zero External APIs</span>
        </div>
      </footer>
    </div>
  );
};
