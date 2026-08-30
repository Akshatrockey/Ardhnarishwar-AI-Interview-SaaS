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

// Seed Data for Attendance
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_perception',
    companyId: 'comp_cyberdyne',
    name: 'Autonomous Perception & SLAM',
    code: 'PERCEPT-01',
    totalEmployees: 12,
    headUserName: 'Dr. Miles Bennett',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'dept_embedded',
    companyId: 'comp_cyberdyne',
    name: 'Embedded Real-Time Systems',
    code: 'EMBED-02',
    totalEmployees: 8,
    headUserName: 'Marcus Thorne',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'dept_fleet',
    companyId: 'comp_cyberdyne',
    name: 'Fleet Operations & AGV Control',
    code: 'FLEET-03',
    totalEmployees: 15,
    headUserName: 'Sarah Connor',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'dept_hr',
    companyId: 'comp_cyberdyne',
    name: 'People Operations & Talent',
    code: 'PEOPLE-04',
    totalEmployees: 4,
    headUserName: 'Elena Rostova',
    createdAt: '2026-01-10T10:00:00.000Z',
  }
];

export const INITIAL_LOCATIONS: WorkLocation[] = [
  {
    id: 'loc_sf_hq',
    companyId: 'comp_cyberdyne',
    name: 'Cyberdyne Global R&D Headquarters',
    address: '400 Howard Street, San Francisco, CA 94105',
    latitude: 37.789172,
    longitude: -122.396821,
    geofenceRadiusMeters: 200,
    authorizedWifiSsids: ['Cyberdyne_Corp_5G', 'Cyberdyne_Robotics_Secure', 'Cyberdyne_Guest'],
    authorizedIpRanges: ['198.51.100.0/24', '10.20.0.0/16'],
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'loc_boston_lab',
    companyId: 'comp_cyberdyne',
    name: 'Boston Mechatronics & Dynamics Lab',
    address: '77 Massachusetts Ave, Cambridge, MA 02139',
    latitude: 42.359244,
    longitude: -71.093165,
    geofenceRadiusMeters: 150,
    authorizedWifiSsids: ['BostonBio_Robotics_5G', 'Mechatronics_Lab'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00.000Z',
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift_morning_std',
    companyId: 'comp_cyberdyne',
    name: 'Standard Morning Shift (9 AM - 6 PM)',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 8.0,
    isFlexible: false,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'shift_evening_r_d',
    companyId: 'comp_cyberdyne',
    name: 'Robotics R&D High-Power Shift (1 PM - 10 PM)',
    startTime: '13:00',
    endTime: '22:00',
    gracePeriodMinutes: 20,
    halfDayThresholdHours: 4.5,
    fullDayThresholdHours: 8.0,
    isFlexible: false,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'shift_flexible',
    companyId: 'comp_cyberdyne',
    name: 'Flexible Core Hours (Any 8.5 Hours)',
    startTime: '08:00',
    endTime: '20:00',
    gracePeriodMinutes: 60,
    halfDayThresholdHours: 4.0,
    fullDayThresholdHours: 8.0,
    isFlexible: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_01',
    companyId: 'comp_cyberdyne',
    departmentId: 'dept_perception',
    locationId: 'loc_sf_hq',
    shiftId: 'shift_morning_std',
    employeeCode: 'CYBER-101',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@cyberdyne.io',
    phone: '+1 (415) 892-3490',
    designation: 'Lead Robotics Perception Engineer',
    joiningDate: '2026-02-01',
    status: 'ACTIVE',
    faceBiometricRegistered: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp_02',
    companyId: 'comp_cyberdyne',
    departmentId: 'dept_perception',
    locationId: 'loc_sf_hq',
    shiftId: 'shift_morning_std',
    employeeCode: 'CYBER-102',
    firstName: 'Alyssa',
    lastName: 'Vance',
    email: 'alyssa.vance@cyberdyne.io',
    phone: '+1 (617) 554-9021',
    designation: 'Autonomous Navigation Specialist',
    joiningDate: '2026-01-15',
    status: 'ACTIVE',
    faceBiometricRegistered: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp_03',
    companyId: 'comp_cyberdyne',
    departmentId: 'dept_embedded',
    locationId: 'loc_sf_hq',
    shiftId: 'shift_morning_std',
    employeeCode: 'CYBER-103',
    firstName: 'Marcus',
    lastName: 'Thorne',
    email: 'marcus.thorne@cyberdyne.io',
    phone: '+1 (206) 433-8812',
    designation: 'Senior Real-Time C++ Architect',
    joiningDate: '2026-01-20',
    status: 'ACTIVE',
    faceBiometricRegistered: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp_04',
    companyId: 'comp_cyberdyne',
    departmentId: 'dept_fleet',
    locationId: 'loc_sf_hq',
    shiftId: 'shift_evening_r_d',
    employeeCode: 'CYBER-104',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@cyberdyne.io',
    phone: '+1 (408) 723-9901',
    designation: 'AGV Fleet Systems Lead',
    joiningDate: '2026-02-10',
    status: 'ACTIVE',
    faceBiometricRegistered: false,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp_05',
    companyId: 'comp_cyberdyne',
    departmentId: 'dept_hr',
    locationId: 'loc_sf_hq',
    shiftId: 'shift_morning_std',
    employeeCode: 'CYBER-105',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.connor@cyberdyne.io',
    phone: '+1 (415) 555-0182',
    designation: 'Principal Talent Partner',
    joiningDate: '2026-01-12',
    status: 'ACTIVE',
    faceBiometricRegistered: true,
    avatarUrl: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=100&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att_01',
    companyId: 'comp_cyberdyne',
    employeeId: 'emp_01',
    departmentId: 'dept_perception',
    shiftId: 'shift_morning_std',
    attendanceDate: '2026-08-28',
    punchInTime: '2026-08-28T09:04:15.000Z',
    punchInMethod: 'CAMERA_FACIAL',
    punchInLocationId: 'loc_sf_hq',
    punchInLat: 37.789170,
    punchInLng: -122.396820,
    punchInDeviceInfo: 'Chrome 122.0 / macOS (Verified Facial Match)',
    punchOutTime: '2026-08-28T18:10:00.000Z',
    punchOutMethod: 'CAMERA_FACIAL',
    totalWorkMinutes: 546,
    status: 'PRESENT',
    isLate: false,
    lateByMinutes: 0,
    isEarlyLeaving: false,
    earlyByMinutes: 0,
    overtimeMinutes: 10,
    createdAt: '2026-08-28T09:04:15.000Z',
  },
  {
    id: 'att_02',
    companyId: 'comp_cyberdyne',
    employeeId: 'emp_02',
    departmentId: 'dept_perception',
    shiftId: 'shift_morning_std',
    attendanceDate: '2026-08-28',
    punchInTime: '2026-08-28T09:22:00.000Z',
    punchInMethod: 'GEOFENCE_WIFI',
    punchInLocationId: 'loc_sf_hq',
    punchInLat: 37.789200,
    punchInLng: -122.396800,
    punchInDeviceInfo: 'SSID: Cyberdyne_Corp_5G (Geofence: 24m from Center)',
    punchOutTime: undefined,
    totalWorkMinutes: 0,
    status: 'LATE',
    isLate: true,
    lateByMinutes: 7, // 9:22 - (9:00 + 15m grace)
    isEarlyLeaving: false,
    earlyByMinutes: 0,
    overtimeMinutes: 0,
    createdAt: '2026-08-28T09:22:00.000Z',
  },
  {
    id: 'att_03',
    companyId: 'comp_cyberdyne',
    employeeId: 'emp_03',
    departmentId: 'dept_embedded',
    shiftId: 'shift_morning_std',
    attendanceDate: '2026-08-28',
    punchInTime: '2026-08-28T08:58:30.000Z',
    punchInMethod: 'DYNAMIC_OTP',
    punchInLocationId: 'loc_sf_hq',
    punchInDeviceInfo: 'Dynamic OTP: 849201 (Verified Room Terminal)',
    punchOutTime: undefined,
    totalWorkMinutes: 0,
    status: 'PRESENT',
    isLate: false,
    lateByMinutes: 0,
    isEarlyLeaving: false,
    earlyByMinutes: 0,
    overtimeMinutes: 0,
    createdAt: '2026-08-28T08:58:30.000Z',
  },
  {
    id: 'att_04',
    companyId: 'comp_cyberdyne',
    employeeId: 'emp_05',
    departmentId: 'dept_hr',
    shiftId: 'shift_morning_std',
    attendanceDate: '2026-08-28',
    punchInTime: '2026-08-28T09:02:10.000Z',
    punchInMethod: 'CAMERA_FACIAL',
    punchInLocationId: 'loc_sf_hq',
    punchInLat: 37.789172,
    punchInLng: -122.396821,
    punchInDeviceInfo: 'Chrome / Windows (Face Biometric Match 99.4%)',
    punchOutTime: undefined,
    totalWorkMinutes: 0,
    status: 'PRESENT',
    isLate: false,
    lateByMinutes: 0,
    isEarlyLeaving: false,
    earlyByMinutes: 0,
    overtimeMinutes: 0,
    createdAt: '2026-08-28T09:02:10.000Z',
  }
];

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
    if (!getStored(ATTENDANCE_KEYS.DEPARTMENTS, null)) {
      setStored(ATTENDANCE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    }
    if (!getStored(ATTENDANCE_KEYS.LOCATIONS, null)) {
      setStored(ATTENDANCE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    }
    if (!getStored(ATTENDANCE_KEYS.SHIFTS, null)) {
      setStored(ATTENDANCE_KEYS.SHIFTS, INITIAL_SHIFTS);
    }
    if (!getStored(ATTENDANCE_KEYS.EMPLOYEES, null)) {
      setStored(ATTENDANCE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    }
    if (!getStored(ATTENDANCE_KEYS.RECORDS, null)) {
      setStored(ATTENDANCE_KEYS.RECORDS, INITIAL_ATTENDANCE_RECORDS);
    }
  }

  static getDepartments(companyId?: string): Department[] {
    const all = getStored<Department[]>(ATTENDANCE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(d => d.companyId === companyId) : all;
  }
  static saveDepartments(depts: Department[]): void {
    setStored(ATTENDANCE_KEYS.DEPARTMENTS, depts);
  }

  static getLocations(companyId?: string): WorkLocation[] {
    const all = getStored<WorkLocation[]>(ATTENDANCE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(l => l.companyId === companyId) : all;
  }
  static saveLocations(locs: WorkLocation[]): void {
    setStored(ATTENDANCE_KEYS.LOCATIONS, locs);
  }

  static getShifts(companyId?: string): Shift[] {
    const all = getStored<Shift[]>(ATTENDANCE_KEYS.SHIFTS, INITIAL_SHIFTS);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(s => s.companyId === companyId) : all;
  }
  static saveShifts(shifts: Shift[]): void {
    setStored(ATTENDANCE_KEYS.SHIFTS, shifts);
  }

  static getEmployees(companyId?: string): Employee[] {
    const all = getStored<Employee[]>(ATTENDANCE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    return companyId && companyId !== 'comp_ardhnarishwar' ? all.filter(e => e.companyId === companyId) : all;
  }
  static saveEmployees(employees: Employee[]): void {
    setStored(ATTENDANCE_KEYS.EMPLOYEES, employees);
  }

  static getRecords(companyId?: string): AttendanceRecord[] {
    const all = getStored<AttendanceRecord[]>(ATTENDANCE_KEYS.RECORDS, INITIAL_ATTENDANCE_RECORDS);
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
