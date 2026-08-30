// High-Performance CSV/Excel Exporter for Ardhnarishwar SaaS
import { AttendanceRecord, Employee, Department } from '../types/attendance';
import { Candidate, InterviewSession } from '../types';

export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  employees: Employee[],
  departments: Department[],
  filename = 'attendance_register.csv'
): void {
  const headers = [
    'Date',
    'Employee Code',
    'Employee Name',
    'Department',
    'Punch In Time',
    'Punch In Method',
    'Punch Out Time',
    'Total Work (Minutes)',
    'Status',
    'Late (Minutes)',
    'Device / Verification Detail'
  ];

  const rows = records.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    const dept = departments.find(d => d.id === r.departmentId);

    const empName = emp ? `"${emp.firstName} ${emp.lastName}"` : '"Unknown"';
    const deptName = dept ? `"${dept.name}"` : '"General"';
    const punchIn = r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString() : 'N/A';
    const punchOut = r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : 'N/A';
    const device = `"${(r.punchInDeviceInfo || '').replace(/"/g, '""')}"`;

    return [
      r.attendanceDate,
      emp?.employeeCode || 'N/A',
      empName,
      deptName,
      punchIn,
      r.punchInMethod,
      punchOut,
      r.totalWorkMinutes,
      r.status,
      r.lateByMinutes,
      device
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportInterviewCandidatesToCSV(
  candidates: Candidate[],
  sessions: InterviewSession[],
  filename = 'candidate_ai_evaluation_report.csv'
): void {
  const headers = [
    'Candidate Name',
    'Email',
    'Phone',
    'Experience (Yrs)',
    'Status',
    'AI Overall Score (%)',
    'Recommendation',
    'Technical Depth',
    'Communication',
    'Problem Solving',
    'Applied Date'
  ];

  const rows = candidates.map(c => {
    const sess = sessions.find(s => s.candidateId === c.id);
    const rep = sess?.aiReport;

    return [
      `"${c.firstName} ${c.lastName}"`,
      c.email,
      c.phone || 'N/A',
      c.yearsOfExperience,
      c.status,
      sess?.overallScore || 'N/A',
      sess?.recommendation || 'PENDING',
      rep?.dimensionScores.technicalDepth || 'N/A',
      rep?.dimensionScores.communication || 'N/A',
      rep?.dimensionScores.problemSolving || 'N/A',
      c.appliedAt.split('T')[0]
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
