import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useRealtime } from '../context/RealtimeContext';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { ShareLinksModal } from '../components/common/ShareLinksModal';

// Company Admin & Recruiter Components
import { CompanyDashboard } from '../components/company-admin/CompanyDashboard';
import { CandidatePipeline } from '../components/company-admin/CandidatePipeline';
import { JobManager } from '../components/company-admin/JobManager';
import { InterviewRoundsConfig } from '../components/company-admin/InterviewRoundsConfig';
import { CompanySettings } from '../components/company-admin/CompanySettings';
import { CandidateEvaluationView } from '../components/evaluation/CandidateEvaluationView';
import { ResumeShortlistPanel } from '../components/company-admin/ResumeShortlistPanel';
import { LiveMonitorAndRecordingsPanel } from '../components/company-admin/LiveMonitorAndRecordingsPanel';
import { ScheduleInterviewModal } from '../components/company-admin/ScheduleInterviewModal';
import { EmailSettingsPanel } from '../components/company-admin/EmailSettingsPanel';
import { InterviewResultsPanel } from '../components/company-admin/InterviewResultsPanel';
import { LiveVideoConferenceRoom } from '../components/conference/LiveVideoConferenceRoom';
import { AIChatbox } from '../components/chatbox/AIChatbox';

import { AppDataStore } from '../services/storage';
import { Candidate, JobPosition } from '../types';
import { 
  Building2, 
  LayoutDashboard, 
  Radio, 
  Users, 
  Briefcase, 
  Layers, 
  FileText, 
  Award, 
  Calendar, 
  Mail, 
  Settings, 
  Video, 
  Sparkles, 
  LogOut, 
  Crown, 
  UserCheck, 
  ChevronDown, 
  Globe, 
  Sun, 
  Moon, 
  Share2, 
  Plus
} from 'lucide-react';

interface CompanyAdminPortalProps {
  onSwitchToSuperAdmin: () => void;
  onSwitchToStaff: () => void;
  onSwitchToCandidate: (candidateOrToken?: Candidate | string) => void;
  onLogout: () => void;
  onOpenLandingPage: () => void;
}

export const CompanyAdminPortal: React.FC<CompanyAdminPortalProps> = ({
  onSwitchToSuperAdmin,
  onSwitchToStaff,
  onSwitchToCandidate,
  onLogout,
  onOpenLandingPage,
}) => {
  const { currentUser, role } = useAuth();
  const { currentCompany, allCompanies, selectCompany } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { latencyMs } = useRealtime();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [conferenceRoom, setConferenceRoom] = useState<{ roomId: string; name: string; title: string } | null>(null);

  // Dropdowns & Modals
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const jobs = AppDataStore.getJobs().filter(j => !currentCompany || j.companyId === currentCompany.id);
  const candidates = AppDataStore.getCandidates().filter(c => !currentCompany || c.companyId === currentCompany.id);

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
      name: `${cand.firstName} ${cand.lastName}`,
      title,
      roomId,
    });
    setActiveTab('live_conference');
  };

  const navItems = [
    { id: 'dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard },
    { id: 'candidates', label: 'Candidate Pipeline', icon: Users, badge: `${candidates.length}` },
    { id: 'live_monitor', label: 'Live Candidate Monitor', icon: Radio, badge: 'Intercom' },
    { id: 'resumes', label: 'AI Resume Shortlist', icon: FileText, badge: 'AI Screen' },
    { id: 'results', label: 'Results & Scorecards', icon: Award, badge: 'AI Score' },
    { id: 'schedule', label: 'Interview Calendar', icon: Calendar },
    { id: 'live_conference', label: 'Live Video Room', icon: Video, badge: 'Panel' },
    { id: 'jobs', label: 'Job Openings', icon: Briefcase, badge: `${jobs.length}` },
    { id: 'rounds', label: 'Interview Rounds & Stages', icon: Layers },
    { id: 'email_settings', label: 'Email Gateway', icon: Mail },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
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
        return (
          <CompanyDashboard
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onNavigateTab={setActiveTab}
            onLaunchLiveInterview={onSwitchToCandidate}
          />
        );
      case 'candidates':
        return (
          <CandidatePipeline
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={onSwitchToCandidate}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'live_monitor':
        return (
          <LiveMonitorAndRecordingsPanel
            onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
            onJoinLiveConference={(roomId, name, title) => handleLaunchMeetingDirect(roomId || 'ROOM-ARDH-ROBOTICS-882', name, title)}
          />
        );
      case 'live_conference':
        return (
          <LiveVideoConferenceRoom
            candidateName={conferenceRoom?.name || 'Priya Sharma'}
            jobTitle={conferenceRoom?.title || 'Lead Robotics Perception Engineer'}
            initialRoomId={conferenceRoom?.roomId || 'ROOM-ARDH-ROBOTICS-882'}
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
      case 'schedule':
        return (
          <CandidatePipeline
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={onSwitchToCandidate}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'jobs':
        return <JobManager onLaunchLiveInterview={onSwitchToCandidate} />;
      case 'rounds':
        return <InterviewRoundsConfig />;
      case 'email_settings':
        return <EmailSettingsPanel />;
      case 'settings':
        return <CompanySettings />;
      default:
        return (
          <CompanyDashboard
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onNavigateTab={setActiveTab}
            onLaunchLiveInterview={onSwitchToCandidate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Company Admin Command Topbar */}
      <header className="h-16 border-b border-indigo-950/80 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={false} />

          {/* Tenant Selector Dropdown */}
          <div className="relative pl-3 border-l border-slate-800">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-900/60 hover:border-indigo-500 text-xs font-bold text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentCompany?.name || 'Cyberdyne Systems'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showTenantMenu && (
              <div className="absolute left-3 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1 uppercase">
                  Select Organization:
                </div>
                {allCompanies.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => {
                      selectCompany(comp.id);
                      setShowTenantMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      currentCompany?.id === comp.id ? 'bg-indigo-950 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{comp.name}</span>
                    <span className="text-[9px] font-mono text-slate-500">{comp.plan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Realtime WS Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>INTERVIEW ENGINE LIVE</span>
          </div>

          {/* Share Links */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/80 hover:text-white transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Links</span>
          </button>

          {/* Role Switcher Popover - Strictly available ONLY to Super Admin during impersonation */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 transition-all active:scale-95"
              >
                <span>Switch Portal</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1 uppercase">
                    Super Admin View Switcher:
                  </div>
                  <button
                    onClick={() => { setShowRoleMenu(false); onSwitchToSuperAdmin(); }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-amber-300 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>Super Admin HQ</div>
                      <div className="text-[10px] font-normal text-slate-400">Master platform management</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowRoleMenu(false); onSwitchToStaff(); }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-teal-300 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-teal-400" />
                    <div>
                      <div>Staff / Employee Desk</div>
                      <div className="text-[10px] font-normal text-slate-400">Assigned panels & timesheets</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

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
              {currentUser?.name || 'Company Admin'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              CA
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

      {/* Company Admin Body: Sidebar + Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Dedicated Sidebar */}
        <aside className="w-64 border-r border-indigo-950/60 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Active Company Status Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-900/40 shadow-inner space-y-1">
              <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                <span>Enterprise Workspace</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs font-black text-white truncate">
                {currentCompany?.name || 'Cyberdyne Systems'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {jobs.length} Active Openings • {candidates.length} Applicants
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase px-3 py-1 tracking-wider">
                Recruitment Suite
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
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-700/80 shadow-lg shadow-indigo-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
            {currentCompany?.name || 'Ardhnarishwar AI SaaS'} © 2026
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-[#070913]">
          {renderActiveTab()}
        </main>
      </div>

      {/* Floating AI Copilot */}
      <AIChatbox />

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

    </div>
  );
};
