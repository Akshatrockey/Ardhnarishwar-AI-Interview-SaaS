import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useRealtime } from '../context/RealtimeContext';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { ShareLinksModal } from '../components/common/ShareLinksModal';

// Super Admin Views
import { OverviewDashboard } from '../components/super-admin/OverviewDashboard';
import { SuperAdminLiveControlCenter } from '../components/super-admin/SuperAdminLiveControlCenter';
import { AITrainingStudio } from '../components/super-admin/AITrainingStudio';
import { CompanyManager } from '../components/super-admin/CompanyManager';
import { GlobalAuditLogs } from '../components/super-admin/GlobalAuditLogs';
import { GlobalQuestionBankManager } from '../components/super-admin/GlobalQuestionBankManager';
import { ResumeManagementPanel } from '../components/super-admin/ResumeManagementPanel';

// Enterprise Cross-Module Views
import { ResumeShortlistPanel } from '../components/company-admin/ResumeShortlistPanel';
import { InterviewResultsPanel } from '../components/company-admin/InterviewResultsPanel';
import { LiveMonitorAndRecordingsPanel } from '../components/company-admin/LiveMonitorAndRecordingsPanel';
import { CandidateEvaluationView } from '../components/evaluation/CandidateEvaluationView';
import { EmailSettingsPanel } from '../components/company-admin/EmailSettingsPanel';
import { LiveVideoConferenceRoom } from '../components/conference/LiveVideoConferenceRoom';
import { ScheduleInterviewModal } from '../components/company-admin/ScheduleInterviewModal';
import { CandidatePipeline } from '../components/company-admin/CandidatePipeline';

import { AppDataStore } from '../services/storage';
import { Candidate, JobPosition } from '../types';
import { 
  Crown, 
  LayoutDashboard, 
  Radio, 
  Cpu, 
  Database, 
  Building2, 
  ShieldAlert, 
  Video, 
  FileText, 
  Award, 
  Calendar, 
  Mail, 
  Sparkles, 
  LogOut, 
  UserCheck, 
  Globe, 
  Sun, 
  Moon, 
  Bell, 
  Share2, 
  ChevronDown, 
  Sliders, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface SuperAdminPortalProps {
  onSwitchToCandidate: () => void;
  onSwitchToCompany: () => void;
  onSwitchToStaff: () => void;
  onLogout: () => void;
  onOpenLandingPage: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  onSwitchToCandidate,
  onSwitchToCompany,
  onSwitchToStaff,
  onLogout,
  onOpenLandingPage,
}) => {
  const { currentUser, switchPersona, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { activeBroadcasts, dismissBroadcast, sendSuperAdminBroadcast, latencyMs } = useRealtime();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [conferenceRoom, setConferenceRoom] = useState<{ roomId: string; name: string; title: string } | null>(null);

  // Modals & UI State
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'EMERGENCY'>('WARNING');

  // Master Factory Reset Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleMasterSystemReset = async () => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem('ardh_org_token') || localStorage.getItem('ardhnarishwar_token') || '';
      await AppDataStore.resetToFreshProductionState({ callBackend: true, authToken: token });
      setResetSuccessMessage('Platform successfully reset! All demo candidates, jobs, and test sessions have been permanently purged.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Master reset failed:', err);
      setResetSuccessMessage('Local cache cleaned. Reloading system...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } finally {
      setIsResetting(false);
    }
  };

  const totalTenants = AppDataStore.getCompanies().length;
  const totalQuestions = AppDataStore.getQuestions().length;
  const totalCandidates = AppDataStore.getCandidates().length;
  const totalSessions = AppDataStore.getSessions().length;

  const handleLaunchMeetingDirect = (roomId: string, name?: string, title?: string) => {
    setConferenceRoom({
      roomId,
      name: name || 'Candidate Interviewee',
      title: title || 'Executive Assessment',
    });
    setActiveTab('live_conference');
  };

  const handleLaunchConferenceForCandidate = (cand: Candidate) => {
    const allJobs = AppDataStore.getJobs();
    const targetJob = allJobs.find((j: JobPosition) => j.id === cand.jobId);
    const title = targetJob?.title || cand.currentTitle || 'Lead Robotics Perception Engineer';
    const roomId = `ROOM-PANEL-${cand.firstName.toUpperCase()}-${cand.lastName.toUpperCase()}-2026`;
    setConferenceRoom({
      candidateName: `${cand.firstName} ${cand.lastName}`,
      name: `${cand.firstName} ${cand.lastName}`,
      title,
      roomId,
    } as any);
    setActiveTab('live_conference');
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    sendSuperAdminBroadcast({
      id: `bcast_${Date.now()}`,
      senderId: currentUser?.id || 'usr_super_admin',
      senderName: currentUser?.name || 'Super Admin HQ',
      title: broadcastTitle,
      message: broadcastMessage,
      severity: broadcastSeverity,
      targetRole: 'ALL',
      targetCompanyId: 'ALL',
      timestamp: new Date().toISOString(),
    });
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const navItems = [
    { id: 'dashboard', label: 'Platform Telemetry', icon: LayoutDashboard },
    { id: 'resume_vault', label: 'Resume Management Vault', icon: FileText, badge: 'Storage' },
    { id: 'live_control_center', label: 'Live Control Center', icon: Radio, badge: 'Realtime' },
    { id: 'ai_training', label: 'AI Training Studio', icon: Cpu, badge: 'Tuning' },
    { id: 'questions', label: 'Global Question Bank', icon: Database, badge: `${totalQuestions}` },
    { id: 'companies', label: 'Tenant Management', icon: Building2, badge: `${totalTenants}` },
    { id: 'live_conference', label: 'Live Video Room', icon: Video, badge: 'Live' },
    { id: 'resumes', label: 'AI Resume Shortlist', icon: FileText },
    { id: 'results', label: 'Results & Scorecards', icon: Award },
    { id: 'live_monitor', label: 'Live Video Vault', icon: Video },
    { id: 'system_reset', label: 'System Data Clean', icon: Trash2, badge: 'Zero-Mock' },
    { id: 'email_settings', label: 'Email Gateway', icon: Mail },
    { id: 'audit_logs', label: 'Security & Audit Logs', icon: ShieldAlert },
  ];

  const renderActiveTab = () => {
    if (selectedCandidateId) {
      return (
        <CandidateEvaluationView
          candidateId={selectedCandidateId}
          onBack={() => setSelectedCandidateId(null)}
          onLaunchConference={handleLaunchConferenceForCandidate}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <OverviewDashboard onNavigateTab={setActiveTab} />;
      case 'resume_vault':
        return <ResumeManagementPanel />;
      case 'live_control_center':
        return (
          <SuperAdminLiveControlCenter
            onJoinConferenceRoom={(roomId, name, title) => handleLaunchMeetingDirect(roomId, name, title)}
          />
        );
      case 'ai_training':
        return <AITrainingStudio />;
      case 'questions':
        return <GlobalQuestionBankManager />;
      case 'companies':
        return <CompanyManager />;
      case 'live_conference':
        return (
          <LiveVideoConferenceRoom
            candidateName={conferenceRoom?.name || 'Candidate Interviewee'}
            jobTitle={conferenceRoom?.title || 'Executive Assessment Track'}
            initialRoomId={conferenceRoom?.roomId || 'ROOM-LIVE-HQ-PANEL'}
            onLeaveRoom={() => setActiveTab('dashboard')}
          />
        );
      case 'resumes':
        return (
          <ResumeShortlistPanel
            onScheduleCandidate={(cand) => setSchedulingCandidate(cand)}
            onViewEvaluation={(id) => setSelectedCandidateId(id)}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'results':
        return (
          <InterviewResultsPanel
            onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={onSwitchToCandidate}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'live_monitor':
        return (
          <LiveMonitorAndRecordingsPanel
            onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
            onJoinLiveConference={(roomId, name, title) => handleLaunchMeetingDirect(roomId || 'ROOM-ARDH-HQ-882', name, title)}
          />
        );
      case 'system_reset':
        return (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl mx-auto space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">System Data Maintenance & Reset</h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero dummy/mock data compliance control. Super Admin exclusive capability to purge expired sessions or reset local cache.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="text-slate-400">Status: <span className="text-emerald-400">Strict Live Database Binding Active</span></div>
              <div className="text-slate-400">Default Questions Count: <span className="text-cyan-400">0</span></div>
              <div className="text-slate-400">Pricing / Paywalls: <span className="text-emerald-400">Completely Removed (100% Free)</span></div>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear local session cache and refresh live telemetry from database?')) {
                  sessionStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Clear Local Session Cache & Refresh
            </button>
          </div>
        );
      case 'email_settings':
        return <EmailSettingsPanel />;
      case 'audit_logs':
        return <GlobalAuditLogs />;
      default:
        return <OverviewDashboard onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Broadcast Banner */}
      {activeBroadcasts.map((bcast) => (
        <div
          key={bcast.id}
          className={`px-6 py-2 text-xs font-bold flex items-center justify-between shadow-lg ${
            bcast.severity === 'EMERGENCY'
              ? 'bg-rose-600 text-white'
              : bcast.severity === 'WARNING'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-cyan-600 text-white'
          }`}
        >
          <span>📢 <strong>{bcast.title}:</strong> {bcast.message}</span>
          <button
            onClick={() => dismissBroadcast(bcast.id)}
            className="px-2 py-0.5 rounded bg-black/40 text-white hover:bg-black/60 text-[10px]"
          >
            Dismiss
          </button>
        </div>
      ))}

      {/* Super Admin Command Topbar */}
      <header className="h-16 border-b border-cyan-950/80 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={false} />
          
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPER ADMIN HQ</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Platform Master Console
            </span>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Realtime WS status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>HQ CORE LIVE ({latencyMs}ms)</span>
          </div>

          {/* Broadcast Alert Button */}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/70 border border-rose-800/80 text-rose-300 hover:bg-rose-900/80 hover:text-white transition-all shadow-sm active:scale-95"
            title="Dispatch Global System Broadcast"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>

          {/* Share Links */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/80 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Links</span>
          </button>

          {/* Purge Demo Data / Clean Production Fresh Start */}
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950/80 border border-amber-700/80 text-amber-300 hover:bg-amber-900 hover:text-white transition-all shadow-sm active:scale-95"
            title="Erase All Demo Data & Reset to Clean Production State"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Purge Demo Data</span>
          </button>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all active:scale-95"
            >
              <span>Switch Portal</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1 uppercase">
                  Switch Active Portal:
                </div>
                <button
                  onClick={() => { setShowRoleMenu(false); onSwitchToCompany(); }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-indigo-300 flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div>Company Admin Portal</div>
                    <div className="text-[10px] font-normal text-slate-400">Recruiter hiring & pipelines</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowRoleMenu(false); onSwitchToStaff(); }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-teal-300 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div>Staff / Employee Desk</div>
                    <div className="text-[10px] font-normal text-slate-400">Assigned panels & punch desk</div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowRoleMenu(false); onSwitchToCandidate(); }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-emerald-300 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>Candidate Chamber</div>
                    <div className="text-[10px] font-normal text-slate-400">AI interview room & scorecard</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Theme & User Profile */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            {theme === 'enterprise-light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <span className="text-xs font-extrabold text-white hidden md:inline">
              Super Admin
            </span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-xs">
              SA
            </div>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Super Admin Portal Body: Sidebar + Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Super Admin Dedicated Sidebar */}
        <aside className="w-64 border-r border-cyan-950/60 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            
            {/* HQ Telemetry Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-900/40 shadow-inner space-y-1">
              <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                <span>HQ Telemetry</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs font-black text-white">Ardhnarishwar Global HQ</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {totalTenants} Tenants • {totalCandidates} Candidates
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase px-3 py-1 tracking-wider">
                Platform Operations
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCandidateId(null);
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-700/80 shadow-lg shadow-cyan-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
            Super Admin HQ • Zero External API
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-[#070913]">
          {renderActiveTab()}
        </main>
      </div>

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Dispatch Global System Broadcast
            </h3>
            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Severity Level</label>
                <select
                  value={broadcastSeverity}
                  onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                >
                  <option value="INFO">Information (Cyan)</option>
                  <option value="WARNING">Warning (Amber)</option>
                  <option value="EMERGENCY">Critical Emergency (Red)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Broadcast Title</label>
                <input
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled Core Model Maintenance"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Message Content</label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Broadcast message shown across all tenant portals in real-time..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Links Modal */}
      {showShareModal && (
        <ShareLinksModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Interview Scheduling Modal */}
      {schedulingCandidate && (
        <ScheduleInterviewModal
          candidate={schedulingCandidate}
          onClose={() => setSchedulingCandidate(null)}
          onScheduledSuccess={() => {
            setSchedulingCandidate(null);
            setActiveTab('results');
          }}
        />
      )}

      {/* Master System Reset / Factory Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Factory Reset & Purge Demo Data</h3>
                <p className="text-xs text-amber-300/80">Super Admin Master Governance Command</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-white">This operation will execute the following:</p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400">
                <li>Permanently erase all mock candidates (Priya Sharma, Vikram Singh, etc.)</li>
                <li>Permanently erase all dummy job openings and test interview rounds</li>
                <li>Clear all mock evaluation scorecards and video sessions</li>
                <li>Reset platform to clean empty state ready for live production use</li>
                <li>Preserve root Super Admin account (<span className="text-amber-300 font-mono">admin@ardhnarishwar.ai</span>)</li>
                <li>Preserve proprietary AI question bank rubrics</li>
              </ul>
            </div>

            {resetSuccessMessage ? (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleMasterSystemReset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition flex items-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Purging All Demo Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Purge Demo Data & Start Fresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
