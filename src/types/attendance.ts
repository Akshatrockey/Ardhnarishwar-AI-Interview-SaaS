export type PunchMethod = 'CAMERA_FACIAL' | 'GEOFENCE_WIFI' | 'DYNAMIC_OTP' | 'MANUAL_ADMIN';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_DUTY';
export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' | 'TERMINATED';

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  totalEmployees: number;
  headUserName?: string;
  createdAt: string;
}

export interface WorkLocation {
  id: string;
  companyId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 150m radius
  authorizedWifiSsids: string[];
  authorizedIpRanges?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Shift {
  id: string;
  companyId: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  gracePeriodMinutes: number; // e.g. 15 mins
  halfDayThresholdHours: number; // e.g. 4.5 hrs
  fullDayThresholdHours: number; // e.g. 8.0 hrs
  isFlexible: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  departmentId: string;
  locationId: string;
  shiftId: string;
  employeeCode: string; // e.g. "CYBER-104"
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
  status: EmployeeStatus;
  faceBiometricRegistered: boolean;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  departmentId: string;
  shiftId: string;
  attendanceDate: string; // "2026-08-28"
  punchInTime: string;    // ISO string
  punchInMethod: PunchMethod;
  punchInLocationId: string;
  punchInLat?: number;
  punchInLng?: number;
  punchInDeviceInfo?: string;
  punchOutTime?: string;  // ISO string
  punchOutMethod?: PunchMethod;
  totalWorkMinutes: number;
  status: AttendanceStatus;
  isLate: boolean;
  lateByMinutes: number;
  isEarlyLeaving: boolean;
  earlyByMinutes: number;
  overtimeMinutes: number;
  verifiedSnapshotUrl?: string;
  createdAt: string;
}

export interface DynamicOTPToken {
  id: string;
  companyId: string;
  locationId: string;
  otpCode: string;
  expiresAt: string; // ISO string
  secondsRemaining: number;
}

export interface AttendanceSummaryStats {
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  onLeaveCount: number;
  halfDayCount: number;
  absentCount: number;
  onTimeRatePercent: number;
  averageWorkHours: number;
}
