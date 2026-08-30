import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { AttendanceDataStore } from '../../services/attendanceStorage';
import { AttendanceRecord, Employee, Department } from '../../types/attendance';
import { exportAttendanceToCSV } from '../../services/exportExcel';
import { 
  FileText, 
  FileDown, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Camera, 
  Wifi, 
  KeyRound, 
  Clock,
  CheckCircle2
} from 'lucide-react';

export const AttendanceReportsView: React.FC = () => {
  const { currentCompany } = useTenant();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const compId = currentCompany?.id;
    setRecords(AttendanceDataStore.getRecords(compId));
    setEmployees(AttendanceDataStore.getEmployees(compId));
    setDepartments(AttendanceDataStore.getDepartments(compId));
  }, [currentCompany]);

  const handleExportCSV = () => {
    exportAttendanceToCSV(
      filteredRecords,
      employees,
      departments,
      `${currentCompany?.slug || 'cyberdyne'}_attendance_register.csv`
    );
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const filteredRecords = records.filter(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    const matchesDept = selectedDept === 'ALL' || r.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      (emp && `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesDept && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:space-y-4">
      {/* Header Banner (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Attendance Audit & Compliance Register</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official monthly attendance logs, verification stamps, shift compliance, and exportable reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Controls (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by employee name, code..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing: <strong className="text-white">{filteredRecords.length}</strong> records
        </div>
      </div>

      {/* Printable Header for PDF */}
      <div className="hidden print:block p-4 border-b-2 border-slate-900 text-black mb-4">
        <div className="text-xl font-bold">{currentCompany?.name || 'Cyberdyne Systems'} — Official Attendance Register</div>
        <div className="text-xs text-slate-600">Generated on {new Date().toLocaleDateString()} | Compliance Audit Report</div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden print:bg-white print:border print:border-black print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 print:text-black">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 print:bg-slate-100 print:text-black">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Punch In</th>
                <th className="py-3 px-4">Method & Verification</th>
                <th className="py-3 px-4">Punch Out</th>
                <th className="py-3 px-4">Work Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans print:divide-slate-300">
              {filteredRecords.map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const dept = departments.find(d => d.id === rec.departmentId);

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300 print:text-black">
                      {rec.attendanceDate}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-white print:text-black">
                        {emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 print:text-slate-600">
                        {emp?.employeeCode}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 print:text-black">
                      {dept?.name || 'General'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-400 print:text-black">
                      {new Date(rec.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {rec.punchInMethod === 'CAMERA_FACIAL' && <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        {rec.punchInMethod === 'GEOFENCE_WIFI' && <Wifi className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        {rec.punchInMethod === 'DYNAMIC_OTP' && <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        <span className="text-[11px] text-slate-300 print:text-black truncate max-w-[200px]">
                          {rec.punchInDeviceInfo || rec.punchInMethod}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 print:text-black">
                      {rec.punchOutTime 
                        ? new Date(rec.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Active Shift'
                      }
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300 print:text-black">
                      {rec.totalWorkMinutes > 0 
                        ? `${Math.floor(rec.totalWorkMinutes / 60)}h ${rec.totalWorkMinutes % 60}m`
                        : 'In Progress'
                      }
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        rec.status === 'PRESENT' ? 'bg-emerald-950 text-emerald-300 border-emerald-800 print:bg-emerald-100 print:text-emerald-900' :
                        rec.status === 'LATE' ? 'bg-amber-950 text-amber-300 border-amber-800 print:bg-amber-100 print:text-amber-900' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {rec.status} {rec.isLate && `(+${rec.lateByMinutes}m)`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
