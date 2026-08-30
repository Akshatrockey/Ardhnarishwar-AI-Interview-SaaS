import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AttendanceDataStore } from '../../services/attendanceStorage';
import { AttendanceSummaryStats, AttendanceRecord, Employee, Department } from '../../types/attendance';
import { AttendancePunchModal } from './AttendancePunchModal';
import { exportAttendanceToCSV } from '../../services/exportExcel';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  FileDown, 
  Camera, 
  Wifi, 
  KeyRound, 
  ArrowUpRight, 
  MapPin, 
  Calendar,
  Sparkles
} from 'lucide-react';

interface AttendanceDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ onNavigateTab }) => {
  const { currentCompany } = useTenant();
  const [stats, setStats] = useState<AttendanceSummaryStats>(AttendanceDataStore.getStats(currentCompany?.id));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);

  const refreshData = () => {
    const compId = currentCompany?.id;
    setStats(AttendanceDataStore.getStats(compId));
    setRecords(AttendanceDataStore.getRecords(compId));
    setEmployees(AttendanceDataStore.getEmployees(compId));
    setDepartments(AttendanceDataStore.getDepartments(compId));
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany]);

  const handleExportCSV = () => {
    exportAttendanceToCSV(records, employees, departments, `${currentCompany?.slug || 'cyberdyne'}_attendance_report.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Attendance Punch Modal */}
      <AttendancePunchModal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        onSuccess={refreshData}
      />

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-900/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {currentCompany?.name || 'Cyberdyne Autonomous Systems'} Attendance SaaS
          </div>
          <h1 className="text-2xl font-extrabold text-white">Smart Workforce Telemetry & Attendance</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time biometric camera verification, GPS Geofencing & Wi-Fi validation, and 30-second Dynamic OTP check-ins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileDown className="w-4 h-4 text-cyan-400" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={() => setIsPunchModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span>Open Punch Chamber</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.presentCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {stats.totalEmployees} Employees</span>
          </div>
          <p className="text-[11px] text-slate-500">Verified biometric check-ins</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.lateCount}</span>
            <span className="text-xs text-amber-400 font-mono">Punched past grace</span>
          </div>
          <p className="text-[11px] text-slate-500">After 15-min shift grace window</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">On-Time Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.onTimeRatePercent}%</span>
            <span className="text-xs text-emerald-400 flex items-center font-semibold">
              +4.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shift adherence score</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Work Hours</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.averageWorkHours}h</span>
            <span className="text-xs text-purple-400 font-mono">/ Day</span>
          </div>
          <p className="text-[11px] text-slate-500">Excluding 1h lunch break</p>
        </div>
      </div>

      {/* Live Punch Feed & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Verification Activity Feed */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Live Check-In & Punch Feed (Today)
            </h2>
            <button
              onClick={() => onNavigateTab('attendance_reports')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              Full Register →
            </button>
          </div>

          <div className="space-y-2.5">
            {records.map(rec => {
              const emp = employees.find(e => e.id === rec.employeeId);
              const dept = departments.find(d => d.id === rec.departmentId);

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                      {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : 'EM'}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'}</span>
                        <span className="text-[10px] font-mono text-slate-500">({emp?.employeeCode})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{dept?.name || 'Robotics Division'}</div>
                    </div>
                  </div>

                  {/* Verification method badge */}
                  <div className="flex items-center gap-2">
                    {rec.punchInMethod === 'CAMERA_FACIAL' && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
                        <Camera className="w-3 h-3" /> Camera Face Check
                      </span>
                    )}
                    {rec.punchInMethod === 'GEOFENCE_WIFI' && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1.5">
                        <Wifi className="w-3 h-3" /> Geofence & Wi-Fi
                      </span>
                    )}
                    {rec.punchInMethod === 'DYNAMIC_OTP' && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5">
                        <KeyRound className="w-3 h-3" /> Dynamic 30s OTP
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      rec.status === 'PRESENT' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      rec.status === 'LATE' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {rec.status} {rec.isLate && `(+${rec.lateByMinutes}m)`}
                    </span>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-400">
                    <div>{new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[10px] text-slate-500">{rec.punchOutTime ? `Out: ${new Date(rec.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Active Shift'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Departments & Verification Method Rules */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Departments ({departments.length})
            </h2>

            <div className="space-y-2">
              {departments.map(d => (
                <div key={d.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{d.name}</div>
                    <div className="text-[10px] text-slate-500">{d.code} • Lead: {d.headUserName}</div>
                  </div>
                  <span className="font-mono text-cyan-400 font-bold">{d.totalEmployees} Staff</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Methods */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-200">Supported Punch Mechanisms</div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Camera Liveness & Facial Biometric Match</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Wifi className="w-4 h-4 text-indigo-400" />
                <span>Geofencing (150m) + Corporate Wi-Fi SSID</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>30-Second Cryptographic Rotating OTP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
