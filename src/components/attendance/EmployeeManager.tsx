import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AttendanceDataStore } from '../../services/attendanceStorage';
import { Employee, Department, Shift, WorkLocation, EmployeeStatus } from '../../types/attendance';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Briefcase, 
  MapPin,
  Sparkles
} from 'lucide-react';

export const EmployeeManager: React.FC = () => {
  const { currentCompany } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Robotics Engineer');
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');

  const refreshData = () => {
    const compId = currentCompany?.id;
    const emps = AttendanceDataStore.getEmployees(compId);
    const depts = AttendanceDataStore.getDepartments(compId);
    const sh = AttendanceDataStore.getShifts(compId);
    const locs = AttendanceDataStore.getLocations(compId);

    setEmployees(emps);
    setDepartments(depts);
    setShifts(sh);
    setLocations(locs);

    if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
    if (sh.length > 0 && !shiftId) setShiftId(sh[0].id);
    if (locs.length > 0 && !locationId) setLocationId(locs[0].id);
    if (!employeeCode) setEmployeeCode(`CYBER-${100 + emps.length + 1}`);
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany]);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      companyId: currentCompany.id,
      departmentId,
      locationId,
      shiftId,
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      designation,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      faceBiometricRegistered: true,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
    };

    const all = AttendanceDataStore.getEmployees();
    AttendanceDataStore.saveEmployees([newEmp, ...all]);
    setEmployees([newEmp, ...employees]);
    setShowAddModal(false);

    // Reset Form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  const filteredEmployees = employees.filter(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Employee Directory & Biometrics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization staff, department assignments, shift rules, and facial biometric enrollment.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees by name, code, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Employees: <strong className="text-white">{employees.length}</strong>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Code & Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Shift & Timing</th>
                <th className="py-3.5 px-4">Biometric ID</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEmployees.map(emp => {
                const dept = departments.find(d => d.id === emp.departmentId);
                const shift = shifts.find(s => s.id === emp.shiftId);

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <span>{emp.firstName} {emp.lastName}</span>
                          <span className="text-[10px] font-mono text-cyan-400 ml-2">[{emp.employeeCode}]</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-9">{emp.email}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-200">
                      <div>{dept?.name || 'Robotics Division'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{dept?.code}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {emp.designation}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      <div className="font-medium">{shift?.name.split('(')[0] || 'Standard Shift'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {shift?.startTime} - {shift?.endTime} (Grace: {shift?.gracePeriodMinutes}m)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {emp.faceBiometricRegistered ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                          <Camera className="w-3 h-3" /> Face Enrolled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 w-fit">
                          Pending Setup
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Enroll New Organization Employee</h2>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rohan"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Verma"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rohan.verma@cyberdyne.io"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Employee Code</label>
                  <input
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="CYBER-106"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Designation / Role</label>
                <input
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Autonomous SLAM Engineer"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Shift</label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
