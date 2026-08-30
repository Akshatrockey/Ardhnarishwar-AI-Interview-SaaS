import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceDataStore } from '../services/attendanceStorage';
import { AppDataStore } from '../services/storage';
import { Employee, AttendanceRecord, Shift, Department } from '../types/attendance';
import { Candidate } from '../types';
import { AttendancePunchModal } from '../components/attendance/AttendancePunchModal';
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
  Briefcase
} from 'lucide-react';

interface EmployeePortalProps {
  onLaunchMeeting?: (roomId: string, candidateName?: string, jobTitle?: string) => void;
  onViewEvaluation?: (candidateId: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  onLaunchMeeting,
  onViewEvaluation,
}) => {
  const { currentCompany } = useTenant();
  const { currentUser } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      {/* Attendance Punch Modal */}
      {currentEmployee && (
        <AttendancePunchModal
          isOpen={isPunchModalOpen}
          onClose={() => setIsPunchModalOpen(false)}
          onSuccess={refreshData}
          defaultEmployee={currentEmployee}
        />
      )}

      {/* Employee Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-extrabold text-cyan-300 text-lg">
              {currentEmployee ? `${currentEmployee.firstName[0]}${currentEmployee.lastName[0]}` : 'EM'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">
                {currentEmployee?.firstName} {currentEmployee?.lastName}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
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
            onClick={() => onLaunchMeeting && onLaunchMeeting(`ROOM-EMP-${currentEmployee?.firstName.toUpperCase()}-2026`, `${currentEmployee?.firstName} ${currentEmployee?.lastName}`, currentEmployee?.designation)}
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Today's Shift</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-extrabold text-white">{empShift?.name.split('(')[0]}</div>
          <div className="text-xs font-mono text-cyan-300">
            {empShift?.startTime} - {empShift?.endTime} (Grace: {empShift?.gracePeriodMinutes}m)
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Today's Punch Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-white">
            {todayRecord ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" /> Checked In
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5" /> Not Punched In
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {todayRecord?.punchInTime ? `Punched at ${new Date(todayRecord.punchInTime).toLocaleTimeString()}` : 'Awaiting punch action'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Monthly Hours Logged</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">176.4 hrs</div>
          <div className="text-xs text-emerald-400 font-semibold">100% Shift Attendance</div>
        </div>
      </div>

      {/* Assigned Candidate Peer Interviews & Review Deck */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Assigned Candidate Technical Panels</span>
          </h2>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
            {candidates.slice(0, 3).length} Assigned Interviews
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {candidates.slice(0, 3).map((cand) => (
            <div
              key={cand.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{cand.firstName} {cand.lastName}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                    {cand.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{cand.currentTitle || 'Robotics Perception Specialist'}</p>
                <div className="text-[10px] font-mono text-slate-500 mt-1">Exp: {cand.yearsOfExperience}y • Token: {cand.interviewToken}</div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onLaunchMeeting && onLaunchMeeting(`ROOM-PANEL-${cand.firstName.toUpperCase()}-${cand.lastName.toUpperCase()}-2026`, `${cand.firstName} ${cand.lastName}`, cand.currentTitle)}
                  className="flex-1 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-200 text-xs font-bold flex items-center justify-center gap-1 border border-purple-800/80 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Panel</span>
                </button>

                {onViewEvaluation && (
                  <button
                    onClick={() => onViewEvaluation(cand.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Scorecard"
                  >
                    <Award className="w-4 h-4 text-cyan-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
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
