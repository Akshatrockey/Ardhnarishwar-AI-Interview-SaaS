import { 
  Department, 
  WorkLocation, 
  Shift, 
  Employee, 
  AttendanceRecord, 
  PunchMethod, 
  AttendanceStatus, 
  AttendanceSummaryStats,
  DynamicOTPToken
} from '../types/attendance';
import { AppDataStore } from './storage';

const ATTENDANCE_KEYS = {
  DEPARTMENTS: 'ardhnarishwar_departments_v1',
  LOCATIONS: 'ardhnarishwar_locations_v1',
  SHIFTS: 'ardhnarishwar_shifts_v1',
  EMPLOYEES: 'ardhnarishwar_employees_v1',
  RECORDS: 'ardhnarishwar_attendance_records_v1',
};

// Clean Production Defaults for Attendance (ZERO demo data)
export const INITIAL_DEPARTMENTS: Department[] = [];
export const INITIAL_LOCATIONS: WorkLocation[] = [];
export const INITIAL_SHIFTS: Shift[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

const memoryStore = new Map<string, string>();

function getStored<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    }
    const item = memoryStore.get(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    const serialized = JSON.stringify(val);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (e) {
    console.error('Attendance Storage error', e);
  }
}

export class AttendanceDataStore {
  static init(): void {
    if (getStored(ATTENDANCE_KEYS.DEPARTMENTS, null) === null) {
      setStored(ATTENDANCE_KEYS.DEPARTMENTS, []);
    }
    if (getStored(ATTENDANCE_KEYS.LOCATIONS, null) === null) {
      setStored(ATTENDANCE_KEYS.LOCATIONS, []);
    }
    if (getStored(ATTENDANCE_KEYS.SHIFTS, null) === null) {
      setStored(ATTENDANCE_KEYS.SHIFTS, []);
    }
    if (getStored(ATTENDANCE_KEYS.EMPLOYEES, null) === null) {
      setStored(ATTENDANCE_KEYS.EMPLOYEES, []);
    }
    if (getStored(ATTENDANCE_KEYS.RECORDS, null) === null) {
      setStored(ATTENDANCE_KEYS.RECORDS, []);
    }
  }

  static getDepartments(companyId?: string): Department[] {
    const all = getStored<Department[]>(ATTENDANCE_KEYS.DEPARTMENTS, []);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(d => d.companyId === companyId) : all;
  }
  static saveDepartments(depts: Department[]): void {
    setStored(ATTENDANCE_KEYS.DEPARTMENTS, depts);
  }

  static getLocations(companyId?: string): WorkLocation[] {
    const all = getStored<WorkLocation[]>(ATTENDANCE_KEYS.LOCATIONS, []);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(l => l.companyId === companyId) : all;
  }
  static saveLocations(locs: WorkLocation[]): void {
    setStored(ATTENDANCE_KEYS.LOCATIONS, locs);
  }

  static getShifts(companyId?: string): Shift[] {
    const all = getStored<Shift[]>(ATTENDANCE_KEYS.SHIFTS, []);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(s => s.companyId === companyId) : all;
  }
  static saveShifts(shifts: Shift[]): void {
    setStored(ATTENDANCE_KEYS.SHIFTS, shifts);
  }

  static getEmployees(companyId?: string): Employee[] {
    const all = getStored<Employee[]>(ATTENDANCE_KEYS.EMPLOYEES, []);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(e => e.companyId === companyId) : all;
  }
  static saveEmployees(employees: Employee[]): void {
    setStored(ATTENDANCE_KEYS.EMPLOYEES, employees);
  }

  static getRecords(companyId?: string): AttendanceRecord[] {
    const all = getStored<AttendanceRecord[]>(ATTENDANCE_KEYS.RECORDS, []);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(r => r.companyId === companyId) : all;
  }
  static saveRecords(records: AttendanceRecord[]): void {
    setStored(ATTENDANCE_KEYS.RECORDS, records);
  }

  // Calculate Geofence Distance (Haversine formula in meters)
  static calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // Generate a Dynamic 30-second Time-Based OTP
  static getLiveDynamicOTP(locationId: string): DynamicOTPToken {
    const now = Date.now();
    const periodSec = 30;
    const step = Math.floor(now / (periodSec * 1000));
    const secondsRemaining = periodSec - (Math.floor(now / 1000) % periodSec);

    // Deterministic pseudo-cryptographic OTP generation
    let hash = 0;
    const seed = `${locationId}_${step}_ardhnarishwar_secret`;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const otpNumber = Math.abs(hash % 900000) + 100000;

    return {
      id: `otp_${step}`,
      companyId: 'comp_cyberdyne',
      locationId,
      otpCode: otpNumber.toString(),
      expiresAt: new Date((step + 1) * periodSec * 1000).toISOString(),
      secondsRemaining,
    };
  }

  // Execute Punch-In
  static recordPunchIn(
    employee: Employee,
    method: PunchMethod,
    location: WorkLocation,
    deviceInfo: string,
    coords?: { lat: number; lng: number }
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    this.init();
    const today = new Date().toISOString().split('T')[0];
    const records = this.getRecords();

    // Prevent duplicate punch-in
    const existing = records.find(r => r.employeeId === employee.id && r.attendanceDate === today);
    if (existing && existing.punchInTime) {
      return { success: false, message: `Employee ${employee.firstName} already punched in at ${new Date(existing.punchInTime).toLocaleTimeString()}!` };
    }

    const shifts = this.getShifts();
    const empShift = shifts.find(s => s.id === employee.shiftId) || shifts[0];

    // Compute late calculation
    const now = new Date();
    const [shiftH, shiftM] = empShift.startTime.split(':').map(Number);
    const shiftStart = new Date(now);
    shiftStart.setHours(shiftH, shiftM + empShift.gracePeriodMinutes, 0, 0);

    const isLate = now.getTime() > shiftStart.getTime();
    const lateByMinutes = isLate ? Math.round((now.getTime() - shiftStart.getTime()) / 60000) : 0;

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}`,
      companyId: employee.companyId,
      employeeId: employee.id,
      departmentId: employee.departmentId,
      shiftId: employee.shiftId,
      attendanceDate: today,
      punchInTime: now.toISOString(),
      punchInMethod: method,
      punchInLocationId: location.id,
      punchInLat: coords?.lat,
      punchInLng: coords?.lng,
      punchInDeviceInfo: deviceInfo,
      totalWorkMinutes: 0,
      status: isLate ? 'LATE' : 'PRESENT',
      isLate,
      lateByMinutes,
      isEarlyLeaving: false,
      earlyByMinutes: 0,
      overtimeMinutes: 0,
      createdAt: now.toISOString(),
    };

    this.saveRecords([newRecord, ...records]);

    AppDataStore.logActivity({
      companyId: employee.companyId,
      actorId: employee.id,
      actorName: `${employee.firstName} ${employee.lastName}`,
      actorRole: 'EMPLOYEE',
      action: 'ATTENDANCE_PUNCH_IN',
      resource: `Location: ${location.name}`,
      details: `Punched in via ${method} (${isLate ? `Late by ${lateByMinutes}m` : 'On Time'}). Device: ${deviceInfo}`,
      ipAddress: '127.0.0.1',
      severity: isLate ? 'WARNING' : 'INFO',
    });

    return { success: true, message: `Check-in recorded successfully via ${method}!`, record: newRecord };
  }

  // Execute Punch-Out
  static recordPunchOut(
    employee: Employee,
    method: PunchMethod
  ): { success: boolean; message: string; record?: AttendanceRecord } {
    this.init();
    const today = new Date().toISOString().split('T')[0];
    const records = this.getRecords();

    const existingIndex = records.findIndex(r => r.employeeId === employee.id && r.attendanceDate === today);
    if (existingIndex === -1) {
      return { success: false, message: 'No check-in record found for today. Please punch in first.' };
    }

    const rec = records[existingIndex];
    if (rec.punchOutTime) {
      return { success: false, message: `Already punched out at ${new Date(rec.punchOutTime).toLocaleTimeString()}.` };
    }

    const now = new Date();
    const inTime = new Date(rec.punchInTime);
    const totalWorkMinutes = Math.max(1, Math.round((now.getTime() - inTime.getTime()) / 60000));

    const updatedRecord: AttendanceRecord = {
      ...rec,
      punchOutTime: now.toISOString(),
      punchOutMethod: method,
      totalWorkMinutes,
      status: totalWorkMinutes < 270 ? 'HALF_DAY' : rec.status,
    };

    records[existingIndex] = updatedRecord;
    this.saveRecords(records);

    AppDataStore.logActivity({
      companyId: employee.companyId,
      actorId: employee.id,
      actorName: `${employee.firstName} ${employee.lastName}`,
      actorRole: 'EMPLOYEE',
      action: 'ATTENDANCE_PUNCH_OUT',
      resource: `Employee: ${employee.employeeCode}`,
      details: `Punched out after ${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m of work.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    return { success: true, message: `Checked out successfully! Total work time: ${Math.floor(totalWorkMinutes / 60)}h ${totalWorkMinutes % 60}m`, record: updatedRecord };
  }

  // Calculate Attendance Stats
  static getStats(companyId?: string): AttendanceSummaryStats {
    this.init();
    const employees = this.getEmployees(companyId);
    const today = new Date().toISOString().split('T')[0];
    const records = this.getRecords(companyId).filter(r => r.attendanceDate === today);

    const total = employees.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
    const onLeave = employees.filter(e => e.status === 'ON_LEAVE').length;
    const absent = Math.max(0, total - (present + late + halfDay + onLeave));

    const onTimeRate = (present + late + halfDay) > 0 
      ? Math.round((present / (present + late + halfDay)) * 100) 
      : 100;

    return {
      totalEmployees: total,
      presentCount: present,
      lateCount: late,
      onLeaveCount: onLeave,
      halfDayCount: halfDay,
      absentCount: absent,
      onTimeRatePercent: onTimeRate,
      averageWorkHours: 8.4,
    };
  }
}
