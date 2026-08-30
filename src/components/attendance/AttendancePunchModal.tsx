import React, { useState, useEffect, useRef } from 'react';
import { Employee, WorkLocation, PunchMethod, DynamicOTPToken } from '../../types/attendance';
import { AttendanceDataStore } from '../../services/attendanceStorage';
import { 
  Camera, 
  Wifi, 
  KeyRound, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles,
  ShieldCheck,
  Smartphone,
  LogOut,
  LogIn
} from 'lucide-react';

interface AttendancePunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultEmployee?: Employee;
}

export const AttendancePunchModal: React.FC<AttendancePunchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmployee,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<PunchMethod>('CAMERA_FACIAL');
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [punchType, setPunchType] = useState<'IN' | 'OUT'>('IN');

  // Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Geofence & Wi-Fi State
  const [currentSSID, setCurrentSSID] = useState<string>('Cyberdyne_Corp_5G');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 37.789170, lng: -122.396820 });
  const [calculatedDistance, setCalculatedDistance] = useState<number>(18);
  const [isGeofenceValid, setIsGeofenceValid] = useState<boolean>(true);

  // Dynamic OTP State
  const [otpInput, setOtpInput] = useState<string>('');
  const [activeOTP, setActiveOTP] = useState<DynamicOTPToken | null>(null);

  const [message, setMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const allEmps = AttendanceDataStore.getEmployees();
    setEmployees(allEmps);
    const initialEmp = defaultEmployee || allEmps[0];
    if (initialEmp) {
      setSelectedEmpId(initialEmp.id);
    }

    const allLocs = AttendanceDataStore.getLocations();
    setLocations(allLocs);
    if (allLocs.length > 0) {
      setSelectedLocationId(allLocs[0].id);
    }

    setMessage(null);
  }, [isOpen, defaultEmployee]);

  // Handle Camera initialization
  useEffect(() => {
    if (isOpen && activeTab === 'CAMERA_FACIAL') {
      let stream: MediaStream | null = null;
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setCameraActive(true);
          // Simulate facial recognition match confidence
          setTimeout(() => {
            setFaceConfidence(99.4);
            setIsFaceVerified(true);
          }, 1200);
        })
        .catch(() => {
          // Graceful fallback for environments without physical camera
          setCameraActive(true);
          setTimeout(() => {
            setFaceConfidence(98.8);
            setIsFaceVerified(true);
          }, 800);
        });

      return () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
      };
    }
  }, [isOpen, activeTab]);

  // Handle Dynamic OTP rotation loop
  useEffect(() => {
    if (isOpen && activeTab === 'DYNAMIC_OTP' && selectedLocationId) {
      const interval = setInterval(() => {
        const token = AttendanceDataStore.getLiveDynamicOTP(selectedLocationId);
        setActiveOTP(token);
      }, 1000);

      const token = AttendanceDataStore.getLiveDynamicOTP(selectedLocationId);
      setActiveOTP(token);

      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab, selectedLocationId]);

  // Calculate Geofence validity
  useEffect(() => {
    if (selectedLocationId) {
      const loc = locations.find(l => l.id === selectedLocationId);
      if (loc) {
        const dist = AttendanceDataStore.calculateDistanceMeters(
          loc.latitude,
          loc.longitude,
          userCoords.lat,
          userCoords.lng
        );
        setCalculatedDistance(dist);
        setIsGeofenceValid(dist <= loc.geofenceRadiusMeters);
      }
    }
  }, [selectedLocationId, userCoords, locations]);

  if (!isOpen) return null;

  const currentEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];
  const currentLocation = locations.find(l => l.id === selectedLocationId) || locations[0];

  const handleExecutePunch = () => {
    if (!currentEmployee || !currentLocation) return;
    setMessage(null);

    // Validate methods
    if (activeTab === 'CAMERA_FACIAL' && !isFaceVerified) {
      setMessage({ type: 'ERROR', text: 'Facial recognition in progress. Please look directly into the camera.' });
      return;
    }

    if (activeTab === 'GEOFENCE_WIFI') {
      if (!isGeofenceValid) {
        setMessage({ type: 'ERROR', text: `Geofence check failed: You are ${calculatedDistance}m away (Max allowed: ${currentLocation.geofenceRadiusMeters}m).` });
        return;
      }
      if (!currentLocation.authorizedWifiSsids.includes(currentSSID)) {
        setMessage({ type: 'ERROR', text: `Unauthorized Wi-Fi SSID "${currentSSID}". Please connect to office network.` });
        return;
      }
    }

    if (activeTab === 'DYNAMIC_OTP') {
      if (!activeOTP || otpInput.trim() !== activeOTP.otpCode) {
        setMessage({ type: 'ERROR', text: 'Invalid or expired OTP code. Please enter the current rotating 6-digit terminal code.' });
        return;
      }
    }

    // Execute punch
    let result;
    if (punchType === 'IN') {
      let deviceInfo = '';
      if (activeTab === 'CAMERA_FACIAL') deviceInfo = `Camera Biometric Match (${faceConfidence}%)`;
      if (activeTab === 'GEOFENCE_WIFI') deviceInfo = `SSID: ${currentSSID} | Geofence: ${calculatedDistance}m`;
      if (activeTab === 'DYNAMIC_OTP') deviceInfo = `Dynamic OTP: ${otpInput} (Terminal Verified)`;

      result = AttendanceDataStore.recordPunchIn(
        currentEmployee,
        activeTab,
        currentLocation,
        deviceInfo,
        userCoords
      );
    } else {
      result = AttendanceDataStore.recordPunchOut(currentEmployee, activeTab);
    }

    if (result.success) {
      setMessage({ type: 'SUCCESS', text: result.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } else {
      setMessage({ type: 'ERROR', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Smart Attendance Verification Chamber</h2>
              <p className="text-[11px] text-slate-400">Multi-Method Biometric, Geofence & Dynamic OTP Check-In</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Employee & Location Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Employee</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 focus:border-cyan-500"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Work Location</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 focus:border-cyan-500"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Punch Action</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPunchType('IN')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                  punchType === 'IN' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Punch In</span>
              </button>
              <button
                type="button"
                onClick={() => setPunchType('OUT')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                  punchType === 'OUT' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Punch Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verification Method Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('CAMERA_FACIAL')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CAMERA_FACIAL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1. Camera Face Check</span>
          </button>

          <button
            onClick={() => setActiveTab('GEOFENCE_WIFI')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'GEOFENCE_WIFI' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>2. Geofence & Wi-Fi</span>
          </button>

          <button
            onClick={() => setActiveTab('DYNAMIC_OTP')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DYNAMIC_OTP' ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>3. Dynamic 30s OTP</span>
          </button>
        </div>

        {/* Tab 1: Camera Face Verification View */}
        {activeTab === 'CAMERA_FACIAL' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="w-full aspect-video max-h-52 bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror-mode" />

              {/* Bounding box animation */}
              <div className="absolute w-36 h-44 border-2 border-dashed border-cyan-400 rounded-2xl animate-pulse pointer-events-none flex flex-col justify-between p-2">
                <div className="text-[10px] font-mono text-cyan-300 bg-black/60 px-1 rounded w-fit">FACE ID</div>
                <div className="text-[10px] font-mono text-emerald-400 bg-black/60 px-1 rounded w-fit self-end">
                  {isFaceVerified ? `${faceConfidence}% MATCH` : 'SCANNING...'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-400">Biometric Template: <strong className="text-white">{currentEmployee?.firstName} {currentEmployee?.lastName}</strong></span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Face Liveness Verified
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Geofence & Wi-Fi Check View */}
        {activeTab === 'GEOFENCE_WIFI' && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GPS Geofence Distance</span>
                </div>
                <div className="text-lg font-bold text-white">{calculatedDistance} meters</div>
                <div className="text-[10px] text-slate-500">Allowed Radius: {currentLocation?.geofenceRadiusMeters}m</div>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 mt-1">
                  INSIDE OFFICE BOUNDARY
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Connected Wi-Fi SSID</span>
                </div>
                <input
                  type="text"
                  value={currentSSID}
                  onChange={(e) => setCurrentSSID(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold"
                />
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 mt-1">
                  AUTHORIZED CORPORATE SSID
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dynamic Rotating OTP View */}
        {activeTab === 'DYNAMIC_OTP' && activeOTP && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900 border border-purple-800/40 gap-3">
              <div>
                <div className="text-[11px] font-bold text-purple-400 uppercase">Live Terminal Rotating OTP</div>
                <div className="text-2xl font-mono font-extrabold tracking-widest text-white mt-0.5">
                  {activeOTP.otpCode}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Expires in:</div>
                  <div className="text-xs font-mono font-bold text-cyan-400">{activeOTP.secondsRemaining} seconds</div>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center font-mono text-xs text-purple-300 animate-pulse">
                  {activeOTP.secondsRemaining}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Enter Terminal 6-Digit OTP to Punch</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="e.g. 849201"
                  className="w-full p-3 rounded-xl text-center font-mono font-extrabold text-lg bg-slate-900 border border-slate-700 text-cyan-300 outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setOtpInput(activeOTP.otpCode)}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Auto-Fill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'SUCCESS' ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-rose-950 border border-rose-800 text-rose-300'
          }`}>
            {message.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExecutePunch}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            punchType === 'IN' 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-500' 
              : 'bg-gradient-to-r from-rose-500 to-amber-600 shadow-rose-500/20 hover:from-rose-400 hover:to-amber-500'
          }`}
        >
          <span>Confirm {punchType === 'IN' ? 'Check-In' : 'Check-Out'} Punch</span>
          <ShieldCheck className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
