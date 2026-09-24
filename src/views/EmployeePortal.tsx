import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRealtime } from '../context/RealtimeContext';
import { AttendanceDataStore } from '../services/attendanceStorage';
import { AppDataStore } from '../services/storage';
import { Employee, AttendanceRecord, Shift, Department } from '../types/attendance';
import { Candidate, JobPosition } from '../types';
import { AttendancePunchModal } from '../components/attendance/AttendancePunchModal';
import { LiveVideoConferenceRoom } from '../components/conference/LiveVideoConferenceRoom';
import { CandidateEvaluationView } from '../components/evaluation/CandidateEvaluationView';
import { InterviewResultsPanel } from '../components/company-admin/InterviewResultsPanel';
import { CompanySettings } from '../components/company-admin/CompanySettings';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { ShareLinksModal } from '../components/common/ShareLinksModal';

import { 
  User, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  Sparkles,
  TrendingUp,
  Video,
  Award,
  Users,
  Briefcase,
  LogOut,
  ChevronDown,
  Building2,
  Crown,
  Sun,
  Moon,
  Share2,
  FileText,
  Settings
} from 'lucide-react';

interface EmployeePortalProps {
  onSwitchToSuperAdmin?: () => void;
  onSwitchToCompany?: () => void;
  onSwitchToCandidate?: () => void;
  onLogout?: () => void;
  onLaunchMeeting?: (roomId: string, candidateName?: string, jobTitle?: string) => void;
  onViewEvaluation?: (candidateId: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  onSwitchToSuperAdmin,
  onSwitchToCompany,
  onSwitchToCandidate,
  onLogout,
  onLaunchMeeting,
  onViewEvaluation,
}) => {
  const { currentCompany } = useTenant();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { latencyMs } = useRealtime();

  const [activeTab, setActiveTab] = useState<string>('desk');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [conferenceRoom, setConferenceRoom] = useState<{ roomId: string; name: string; title: string } | null>(null);

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const refreshData = () => {
    const compId = currentCompany?.id;
    const emps = AttendanceDataStore.getEmployees(compId);
    const sh = AttendanceDataStore.getShifts(compId);
    const depts = AttendanceDataStore.getDepartments(compId);
    const allRecs = AttendanceDataStore.getRecords(compId);
    const cands = AppDataStore.getCandidates();

    setEmployees(emps);
    setShifts(sh);
    setDepartments(depts);
    setCandidates(cands);

    const emp = emps.find(e => e.id === currentUser?.id) || emps[0];
    setCurrentEmployee(emp);
    if (emp) {
      setMyRecords(allRecs.filter(r => r.employeeId === emp.id));
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany, currentUser]);

  const empShift = shifts.find(s => s.id === currentEmployee?.shiftId) || shifts[0];
  const empDept = departments.find(d => d.id === currentEmployee?.departmentId) || departments[0];

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = myRecords.find(r => r.attendanceDate === today);

  const handleLaunchMeetingDirect = (roomId: string, name?: string, title?: string) => {
    setConferenceRoom({
      roomId,
      name: name || `${currentEmployee?.firstName} ${currentEmployee?.lastName}`,
      title: title || currentEmployee?.designation || 'Staff Review',
    });
    setActiveTab('conference');
  };

  const navItems = [
    { id: 'desk', label: 'Employee Self-Service', icon: Clock, badge: todayRecord ? 'Checked In' : 'Punch' },
    { id: 'panels', label: 'My Assigned Panels', icon: Users, badge: `${candidates.slice(0, 3).length}` },
    { id: 'conference', label: 'Live Video Room', icon: Video, badge: 'Live' },
    { id: 'reviews', label: 'Candidate Peer Reviews', icon: Award },
    { id: 'attendance', label: 'Attendance & History', icon: Calendar },
    { id: 'settings', label: 'My Workspace Profile', icon: Settings },
  ];

  const renderActiveView = () => {
    if (selectedCandidateId) {
      return (
        <CandidateEvaluationView
          candidateId={selectedCandidateId}
          onBack={() => setSelectedCandidateId(null)}
          onLaunchConference={(cand) => handleLaunchMeetingDirect(`ROOM-PANEL-${cand.firstName.toUpperCase()}-2026`, `${cand.firstName} ${cand.lastName}`, cand.currentTitle)}
        />
      );
    }

    if (activeTab === 'conference') {
      return (
        <LiveVideoConferenceRoom
          candidateName={conferenceRoom?.name || `${currentEmployee?.firstName} ${currentEmployee?.lastName}`}
          jobTitle={conferenceRoom?.title || currentEmployee?.designation || 'Staff Review'}
          initialRoomId={conferenceRoom?.roomId || `ROOM-STAFF-${currentEmployee?.firstName.toUpperCase() || 'EMP'}-2026`}
          onLeaveRoom={() => setActiveTab('desk')}
        />
      );
    }

    if (activeTab === 'reviews') {
      return (
        <InterviewResultsPanel
          onSelectCandidateScorecard={(id) => setSelectedCandidateId(id)}
          onLaunchLiveInterview={onSwitchToCandidate}
          onLaunchConference={(cand) => handleLaunchMeetingDirect(`ROOM-PANEL-${cand.firstName.toUpperCase()}-2026`, `${cand.firstName} ${cand.lastName}`, cand.currentTitle)}
        />
      );
    }

    if (activeTab === 'settings') {
      return <CompanySettings />;
    }

    // Default Desk View + Panels
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
        
        {/* Employee Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-900/40 shadow-2xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-teal-300 text-lg">
                {currentEmployee ? `${currentEmployee.firstName[0]}${currentEmployee.lastName[0]}` : 'EM'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  {currentEmployee?.firstName} {currentEmployee?.lastName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  {currentEmployee?.employeeCode || 'EMP-CYBER-042'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                {currentEmployee?.designation || 'Senior Robotics Engineer'} • {empDept?.name || 'Autonomous Systems Unit'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLaunchMeetingDirect(`ROOM-EMP-${currentEmployee?.firstName.toUpperCase()}-2026`, `${currentEmployee?.firstName} ${currentEmployee?.lastName}`, currentEmployee?.designation)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/25 transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Join Meeting Room</span>
            </button>

            <button
              onClick={() => setIsPunchModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Launch Punch Chamber</span>
            </button>
          </div>
        </div>

        {/* Shift & Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Today's Shift</span>
              <Clock className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-lg font-extrabold text-white">{empShift?.name.split('(')[0]}</div>
            <div className="text-xs font-mono text-teal-300">
              {empShift?.startTime} - {empShift?.endTime} (Grace: {empShift?.gracePeriodMinutes}m)
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Today's Punch Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-white">
              {todayRecord ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> Checked In
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-5 h-5" /> Not Punched In
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {todayRecord?.punchInTime ? `Punched at ${new Date(todayRecord.punchInTime).toLocaleTimeString()}` : 'Awaiting punch action'}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Monthly Hours Logged</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">176.4 hrs</div>
            <div className="text-xs text-emerald-400 font-semibold">100% Shift Attendance</div>
          </div>
        </div>

        {/* Assigned Candidate Peer Interviews & Review Deck */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>Assigned Candidate Technical Panels</span>
            </h2>
            <span className="text-[10px] font-mono text-teal-300 bg-teal-950 px-2.5 py-1 rounded-full border border-teal-800 font-bold">
              {candidates.slice(0, 3).length} Assigned Interviews
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {candidates.slice(0, 3).map((cand) => (
              <div
                key={cand.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm">{cand.firstName} {cand.lastName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      {cand.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{cand.currentTitle || 'Robotics Perception Specialist'}</p>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">Exp: {cand.yearsOfExperience}y • Token: {cand.interviewToken}</div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleLaunchMeetingDirect(`ROOM-PANEL-${cand.firstName.toUpperCase()}-${cand.lastName.toUpperCase()}-2026`, `${cand.firstName} ${cand.lastName}`, cand.currentTitle)}
                    className="flex-1 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 text-xs font-bold flex items-center justify-center gap-1 border border-purple-800/80 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Panel</span>
                  </button>

                  <button
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Scorecard"
                  >
                    <Award className="w-4 h-4 text-teal-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance History Table */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            Recent Attendance Records
          </h2>

          <div className="divide-y divide-slate-800">
            {myRecords.map(rec => (
              <div key={rec.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-slate-300">
                    {rec.attendanceDate.split('-')[2]}
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {new Date(rec.attendanceDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[11px] text-slate-400">{rec.punchInDeviceInfo || rec.punchInMethod}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs">
                  <div className="text-slate-300">
                    In: <strong className="text-emerald-400">{new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div className="text-slate-400">
                    Out: {rec.punchOutTime ? new Date(rec.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Attendance Punch Modal */}
      {currentEmployee && (
        <AttendancePunchModal
          isOpen={isPunchModalOpen}
          onClose={() => setIsPunchModalOpen(false)}
          onSuccess={refreshData}
          defaultEmployee={currentEmployee}
        />
      )}

      {/* Staff Topbar */}
      <header className="h-16 border-b border-teal-950/80 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={false} />
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            <span className="px-2.5 py-1 rounded-xl bg-teal-950/60 border border-teal-800/80 text-teal-300 text-xs font-black flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>STAFF EMPLOYEE PORTAL</span>
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>STAFF DESK ACTIVE</span>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-950/70 border border-teal-800/80 text-teal-300 hover:bg-teal-900/80 hover:text-white transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Links</span>
          </button>

          {/* Role Switcher - Strictly available ONLY to Super Admin during impersonation */}
          {currentUser?.role === 'SUPER_ADMIN' && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-md shadow-teal-500/20 transition-all active:scale-95"
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
                    onClick={() => { setShowRoleMenu(false); if (onSwitchToSuperAdmin) onSwitchToSuperAdmin(); }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-amber-300 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>Super Admin HQ</div>
                      <div className="text-[10px] font-normal text-slate-400">Master platform management</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowRoleMenu(false); if (onSwitchToCompany) onSwitchToCompany(); }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 text-indigo-300 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div>Company Admin Portal</div>
                      <div className="text-[10px] font-normal text-slate-400">Recruiter hiring & pipelines</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

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
              {currentEmployee?.firstName} {currentEmployee?.lastName}
            </span>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center font-bold text-white text-xs">
              {currentEmployee ? `${currentEmployee.firstName[0]}${currentEmployee.lastName[0]}` : 'ST'}
            </div>
          </button>

          <button
            onClick={onLogout || logout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Staff Body: Sidebar + Main View */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-teal-950/60 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Staff Desk Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-900/40 shadow-inner space-y-1">
              <div className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center justify-between">
                <span>Staff Member Desk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs font-black text-white truncate">
                {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : 'Senior Staff'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentCompany?.name || 'Ardhnarishwar AI'}
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase px-3 py-1 tracking-wider">
                My Workspace
              </div>

              {navItems.map(item => {
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
                        ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-700/80 shadow-lg shadow-teal-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
            Staff Desk • Attendance & Interview Panels
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-[#070913]">
          {renderActiveView()}
        </main>
      </div>

      {showShareModal && (
        <ShareLinksModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

    </div>
  );
};
