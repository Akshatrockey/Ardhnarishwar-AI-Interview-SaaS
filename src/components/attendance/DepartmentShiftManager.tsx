import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AttendanceDataStore } from '../../services/attendanceStorage';
import { Department, Shift, WorkLocation } from '../../types/attendance';
import { 
  Building2, 
  Clock, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Wifi, 
  Sliders, 
  CheckCircle2 
} from 'lucide-react';

export const DepartmentShiftManager: React.FC = () => {
  const { currentCompany } = useTenant();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);

  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'SHIFTS' | 'LOCATIONS'>('SHIFTS');

  // Form states for new department
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Form states for new shift
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00');
  const [newShiftEnd, setNewShiftEnd] = useState('18:00');
  const [newShiftGrace, setNewShiftGrace] = useState(15);

  const refreshData = () => {
    const compId = currentCompany?.id;
    setDepartments(AttendanceDataStore.getDepartments(compId));
    setShifts(AttendanceDataStore.getShifts(compId));
    setLocations(AttendanceDataStore.getLocations(compId));
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany]);

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !newDeptName) return;

    const newDept: Department = {
      id: `dept_${Date.now()}`,
      companyId: currentCompany.id,
      name: newDeptName,
      code: newDeptCode || `DEPT-${departments.length + 1}`,
      totalEmployees: 0,
      createdAt: new Date().toISOString(),
    };

    const all = AttendanceDataStore.getDepartments();
    AttendanceDataStore.saveDepartments([newDept, ...all]);
    setDepartments([newDept, ...departments]);
    setNewDeptName('');
    setNewDeptCode('');
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !newShiftName) return;

    const newShift: Shift = {
      id: `shift_${Date.now()}`,
      companyId: currentCompany.id,
      name: newShiftName,
      startTime: newShiftStart,
      endTime: newShiftEnd,
      gracePeriodMinutes: Number(newShiftGrace),
      halfDayThresholdHours: 4.5,
      fullDayThresholdHours: 8.0,
      isFlexible: false,
      createdAt: new Date().toISOString(),
    };

    const all = AttendanceDataStore.getShifts();
    AttendanceDataStore.saveShifts([newShift, ...all]);
    setShifts([newShift, ...shifts]);
    setNewShiftName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-white">Workforce Governance & Shift Rules</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure department structures, shift timings, grace periods, and GPS geofence boundaries.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('SHIFTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SHIFTS' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Shifts ({shifts.length})
          </button>
          <button
            onClick={() => setActiveTab('LOCATIONS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LOCATIONS' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Geofences ({locations.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DEPARTMENTS' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Departments ({departments.length})
          </button>
        </div>
      </div>

      {/* Shifts Tab */}
      {activeTab === 'SHIFTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Configured Work Shifts</h2>
            <div className="space-y-3">
              {shifts.map(shift => (
                <div key={shift.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{shift.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                    <div>Grace Period: <strong className="text-cyan-400">{shift.gracePeriodMinutes} mins</strong></div>
                    <div>Half Day: <strong className="text-slate-200">{shift.halfDayThresholdHours} hrs</strong></div>
                    <div>Full Day: <strong className="text-emerald-400">{shift.fullDayThresholdHours} hrs</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Create New Shift</h3>
            <form onSubmit={handleAddShift} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Shift Name</label>
                <input
                  required
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder="e.g. Night Lab Shift"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Start Time</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 outline-none mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400">End Time</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 outline-none mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={newShiftGrace}
                  onChange={(e) => setNewShiftGrace(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
              >
                Add Work Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Geofences & Locations Tab */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    {loc.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ACTIVE
                  </span>
                </div>

                <p className="text-xs text-slate-400">{loc.address}</p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <span className="text-cyan-400">{loc.latitude}, {loc.longitude}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Geofence Radius:</span>
                    <span className="text-emerald-400">{loc.geofenceRadiusMeters} meters</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                    <span>SSIDs: {loc.authorizedWifiSsids.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Department Hierarchy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departments.map(dept => (
                <div key={dept.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{dept.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{dept.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Head: {dept.headUserName || 'Management'}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{dept.totalEmployees} Active Staff</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Create Department</h3>
            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Department Name</label>
                <input
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Bio-Robotics Hardware"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Department Code</label>
                <input
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. HARDWARE-05"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 outline-none mt-1 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-colors"
              >
                Add Department
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
