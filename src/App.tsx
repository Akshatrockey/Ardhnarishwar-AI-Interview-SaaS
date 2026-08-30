import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Super Admin Components
import { OverviewDashboard } from './components/super-admin/OverviewDashboard';
import { SuperAdminLiveControlCenter } from './components/super-admin/SuperAdminLiveControlCenter';
import { AITrainingStudio } from './components/super-admin/AITrainingStudio';
import { CompanyManager } from './components/super-admin/CompanyManager';
import { GlobalAuditLogs } from './components/super-admin/GlobalAuditLogs';

// Company Admin & Recruiter Interview Components
import { CompanyDashboard } from './components/company-admin/CompanyDashboard';
import { CandidatePipeline } from './components/company-admin/CandidatePipeline';
import { JobManager } from './components/company-admin/JobManager';
import { InterviewRoundsConfig } from './components/company-admin/InterviewRoundsConfig';
import { CompanySettings } from './components/company-admin/CompanySettings';
import { CandidateEvaluationView } from './components/evaluation/CandidateEvaluationView';
import { ResumeShortlistPanel } from './components/company-admin/ResumeShortlistPanel';
import { LiveMonitorAndRecordingsPanel } from './components/company-admin/LiveMonitorAndRecordingsPanel';
import { ScheduleInterviewModal } from './components/company-admin/ScheduleInterviewModal';
import { EmailSettingsPanel } from './components/company-admin/EmailSettingsPanel';
import { InterviewResultsPanel } from './components/company-admin/InterviewResultsPanel';

// Staff Employee Portal
import { EmployeePortal } from './views/EmployeePortal';

// AI Copilot Chatbox & Live Video Conference
import { AIChatbox } from './components/chatbox/AIChatbox';
import { LiveVideoConferenceRoom } from './components/conference/LiveVideoConferenceRoom';

// Standalone Candidate Portal & Global Auth Portal
import { CandidatePortal } from './views/CandidatePortal';
import { GlobalAuthPortal } from './views/GlobalAuthPortal';
import { Candidate, JobPosition } from './types';
import { AppDataStore } from './services/storage';

const AppContent: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { activeBroadcasts, dismissBroadcast } = useRealtime();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showCandidatePortal, setShowCandidatePortal] = useState<boolean>(false);
  const [candidateTokenForChamber, setCandidateTokenForChamber] = useState<string>('TOKEN_PRIYA_ROBOTICS_2026');
  const [showAuthPortal, setShowAuthPortal] = useState<boolean>(false);

  // Modal & Video Conference State
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [conferenceCandidate, setConferenceCandidate] = useState<{
    candidateName: string;
    jobTitle: string;
    roomId: string;
  } | null>(null);

  const handleLaunchConferenceForCandidate = (cand: Candidate) => {
    const name = `${cand.firstName} ${cand.lastName}`;
    const allJobs = AppDataStore.getJobs();
    const targetJob = allJobs.find((j: JobPosition) => j.id === cand.jobId);
    const title = targetJob?.title || cand.currentTitle || 'Lead Robotics Perception Engineer';
    const roomId = `ROOM-PANEL-${cand.firstName.toUpperCase()}-${cand.lastName.toUpperCase()}-2026`;
    setConferenceCandidate({
      candidateName: name,
      jobTitle: title,
      roomId,
    });
    setActiveTab('live_conference');
  };

  const handleLaunchMeetingDirect = (roomId: string, candidateName?: string, jobTitle?: string) => {
    setConferenceCandidate({
      candidateName: candidateName || 'Candidate Interviewee',
      jobTitle: jobTitle || 'Robotics Assessment',
      roomId,
    });
    setActiveTab('live_conference');
  };

  // If user opens Candidate Chamber Portal
  if (showCandidatePortal) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans">
        <main className="flex-1">
          <CandidatePortal
            initialToken={candidateTokenForChamber}
            onBackToApp={() => setShowCandidatePortal(false)}
            onViewEvaluation={(sessionId) => {
              setShowCandidatePortal(false);
              setActiveTab('live_monitor');
            }}
          />
        </main>
        <AIChatbox />
      </div>
    );
  }

  // If user is on the Global Auth Portal (Public Landing & Candidate Self-Registration)
  if (showAuthPortal) {
    return (
      <div className="min-h-screen bg-[#070913]">
        <GlobalAuthPortal
          onCandidateLaunchChamber={(token) => {
            setCandidateTokenForChamber(token);
            setShowAuthPortal(false);
            setShowCandidatePortal(true);
          }}
          onAdminLoginSuccess={() => {
            setShowAuthPortal(false);
            setActiveTab('dashboard');
          }}
        />
        <AIChatbox />
      </div>
    );
  }

  const renderActiveView = () => {
    // If evaluating candidate scorecard
    if (selectedCandidateId) {
      return (
        <CandidateEvaluationView
          candidateId={selectedCandidateId}
          onBack={() => setSelectedCandidateId(null)}
          onLaunchConference={handleLaunchConferenceForCandidate}
        />
      );
    }

    // 1. Super Admin Views
    if (currentUser?.role === 'SUPER_ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <OverviewDashboard onNavigateTab={setActiveTab} />;
        case 'live_control_center':
          return (
            <SuperAdminLiveControlCenter
              onJoinConferenceRoom={(roomId, name, title) => handleLaunchMeetingDirect(roomId, name, title)}
            />
          );
        case 'live_conference':
          return (
            <LiveVideoConferenceRoom
              candidateName={conferenceCandidate?.candidateName || 'Priya Sharma'}
              jobTitle={conferenceCandidate?.jobTitle || 'Lead Robotics Perception Engineer'}
              initialRoomId={conferenceCandidate?.roomId || 'ROOM-ARDH-ROBOTICS-882'}
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
              onLaunchLiveInterview={() => setShowCandidatePortal(true)}
              onLaunchConference={handleLaunchConferenceForCandidate}
            />
          );
        case 'schedule':
          return (
            <ResumeShortlistPanel
              onScheduleCandidate={(cand) => setSchedulingCandidate(cand)}
              onViewEvaluation={(id) => setSelectedCandidateId(id)}
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
        case 'ai_training':
          return <AITrainingStudio />;
        case 'companies':
          return <CompanyManager />;
        case 'email_settings':
          return <EmailSettingsPanel />;
        case 'audit_logs':
          return <GlobalAuditLogs />;
        default:
          return <OverviewDashboard onNavigateTab={setActiveTab} />;
      }
    }

    // 2. Staff Employee Views
    if (currentUser?.role === 'EMPLOYEE') {
      switch (activeTab) {
        case 'employee_desk':
        case 'dashboard':
          return (
            <EmployeePortal
              onLaunchMeeting={handleLaunchMeetingDirect}
              onViewEvaluation={(id) => setSelectedCandidateId(id)}
            />
          );
        case 'live_conference':
          return (
            <LiveVideoConferenceRoom
              candidateName={conferenceCandidate?.candidateName || 'Candidate Interviewee'}
              jobTitle={conferenceCandidate?.jobTitle || 'Robotics Assessment'}
              initialRoomId={conferenceCandidate?.roomId || 'ROOM-ARDH-ROBOTICS-882'}
              onLeaveRoom={() => setActiveTab('dashboard')}
            />
          );
        case 'schedule':
          return (
            <EmployeePortal
              onLaunchMeeting={handleLaunchMeetingDirect}
              onViewEvaluation={(id) => setSelectedCandidateId(id)}
            />
          );
        case 'results':
          return (
            <InterviewResultsPanel
              onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
              onLaunchLiveInterview={() => setShowCandidatePortal(true)}
              onLaunchConference={handleLaunchConferenceForCandidate}
            />
          );
        case 'settings':
          return <CompanySettings />;
        default:
          return (
            <EmployeePortal
              onLaunchMeeting={handleLaunchMeetingDirect}
              onViewEvaluation={(id) => setSelectedCandidateId(id)}
            />
          );
      }
    }

    // 3. Interview SaaS Views (Company Admin & Recruiter)
    switch (activeTab) {
      case 'dashboard':
        return (
          <CompanyDashboard
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onNavigateTab={setActiveTab}
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
            candidateName={conferenceCandidate?.candidateName || 'Priya Sharma'}
            jobTitle={conferenceCandidate?.jobTitle || 'Lead Robotics Perception Engineer'}
            initialRoomId={conferenceCandidate?.roomId || 'ROOM-ARDH-ROBOTICS-882'}
            onLeaveRoom={() => setActiveTab('dashboard')}
          />
        );
      case 'results':
        return (
          <InterviewResultsPanel
            onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={() => setShowCandidatePortal(true)}
            onLaunchConference={handleLaunchConferenceForCandidate}
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
      case 'schedule':
        return (
          <CandidatePipeline
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={() => setShowCandidatePortal(true)}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'candidates':
        return (
          <CandidatePipeline
            onSelectCandidate={(id: string) => setSelectedCandidateId(id)}
            onLaunchLiveInterview={() => setShowCandidatePortal(true)}
            onLaunchConference={handleLaunchConferenceForCandidate}
          />
        );
      case 'jobs':
        return <JobManager />;
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
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Global Real-Time Broadcast Alert Banner (if any) */}
      {activeBroadcasts.map((bcast) => (
        <div
          key={bcast.id}
          className={`px-6 py-2 text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 ${
            bcast.severity === 'EMERGENCY'
              ? 'bg-rose-600 text-white'
              : bcast.severity === 'WARNING'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-cyan-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>📢 <strong>{bcast.title}:</strong> {bcast.message}</span>
          </div>
          <button
            onClick={() => dismissBroadcast(bcast.id)}
            className="px-2 py-0.5 rounded bg-black/40 text-white hover:bg-black/60 text-[10px]"
          >
            Dismiss
          </button>
        </div>
      ))}

      <Header
        onOpenCandidateDemo={() => setShowCandidatePortal(true)}
        onNavigateTab={setActiveTab}
        onLogout={() => setShowAuthPortal(true)}
        onLaunchMeeting={handleLaunchMeetingDirect}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedCandidateId(null);
            setActiveTab(tab);
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900/90 to-[#070913]">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Interactive AI Copilot & Recruiter Chatbox */}
      <AIChatbox />

      {/* Schedule Interview Modal */}
      {schedulingCandidate && (
        <ScheduleInterviewModal
          candidate={schedulingCandidate}
          onClose={() => setSchedulingCandidate(null)}
          onScheduledSuccess={() => {
            setSchedulingCandidate(null);
            setActiveTab('schedule');
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TenantProvider>
            <RealtimeProvider>
              <AppContent />
            </RealtimeProvider>
          </TenantProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
