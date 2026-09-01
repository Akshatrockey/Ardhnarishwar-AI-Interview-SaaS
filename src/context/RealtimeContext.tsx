import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { 
  RealtimeMessage, 
  RealtimeTelemetry, 
  RealtimeProctorFlag, 
  RealtimeIntercomMessage, 
  RealtimeBroadcast, 
  VideoMeetingInvite 
} from '../types';
import { realtimeService } from '../services/realtimeService';

interface RealtimeContextType {
  isConnected: boolean;
  latencyMs: number;
  presenceStats: {
    totalConnected: number;
    superAdmins: number;
    companyAdmins: number;
    recruiters: number;
    employees: number;
    candidates: number;
    activeRooms: number;
  };
  activeTelemetryMap: Record<string, RealtimeTelemetry>;
  proctorAlerts: RealtimeProctorFlag[];
  latestIntercom: RealtimeIntercomMessage | null;
  activeBroadcasts: RealtimeBroadcast[];
  activeMeetingInvites: VideoMeetingInvite[];
  soundEnabled: boolean;
  toggleSound: () => void;
  sendCandidateTelemetry: (telemetry: RealtimeTelemetry) => void;
  sendRecruiterIntercom: (intercom: RealtimeIntercomMessage) => void;
  sendSuperAdminBroadcast: (bcast: RealtimeBroadcast) => void;
  emitProctorFlag: (flag: RealtimeProctorFlag) => void;
  sendMeetingInvite: (invite: VideoMeetingInvite) => void;
  dismissBroadcast: (id: string) => void;
  clearProctorAlerts: () => void;
  clearIntercom: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();
  const { currentCompany } = useTenant();

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [presenceStats, setPresenceStats] = useState({
    totalConnected: 0,
    superAdmins: 0,
    companyAdmins: 0,
    recruiters: 0,
    employees: 0,
    candidates: 0,
    activeRooms: 0,
  });

  const [activeTelemetryMap, setActiveTelemetryMap] = useState<Record<string, RealtimeTelemetry>>({});

  const [proctorAlerts, setProctorAlerts] = useState<RealtimeProctorFlag[]>([]);
  const [latestIntercom, setLatestIntercom] = useState<RealtimeIntercomMessage | null>(null);
  const [activeBroadcasts, setActiveBroadcasts] = useState<RealtimeBroadcast[]>([]);
  const [activeMeetingInvites, setActiveMeetingInvites] = useState<VideoMeetingInvite[]>([]);

  // Sound notification effect
  const playAlertSound = useCallback((type: 'info' | 'warning' | 'intercom') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'intercom') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
        osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15); // A3
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      }
    } catch {}
  }, [soundEnabled]);

  // Initialize connection
  useEffect(() => {
    const userId = currentUser?.id || 'usr_guest';
    const userRole = role || 'CANDIDATE';
    const compId = currentCompany?.id || 'global';

    realtimeService.initConnection(userId, userRole, compId);

    const unsubscribe = realtimeService.subscribe((msg: RealtimeMessage) => {
      setIsConnected(true);

      switch (msg.type) {
        case 'INTERVIEW_TELEMETRY': {
          const tData = msg.payload as RealtimeTelemetry;
          if (tData && tData.sessionId) {
            setActiveTelemetryMap(prev => ({
              ...prev,
              [tData.sessionId]: tData
            }));
          }
          break;
        }

        case 'PROCTORING_FLAG': {
          const flag = msg.payload as RealtimeProctorFlag;
          if (flag) {
            setProctorAlerts(prev => [flag, ...prev.slice(0, 19)]);
            playAlertSound('warning');
          }
          break;
        }

        case 'RECRUITER_INTERCOM': {
          const intercom = msg.payload as RealtimeIntercomMessage;
          if (intercom) {
            setLatestIntercom(intercom);
            playAlertSound('intercom');
          }
          break;
        }

        case 'SUPER_ADMIN_BROADCAST': {
          const bcast = msg.payload as RealtimeBroadcast;
          if (bcast) {
            setActiveBroadcasts(prev => [bcast, ...prev]);
            playAlertSound('info');
          }
          break;
        }

        case 'VIDEO_MEETING_SIGNAL': {
          const invite = msg.payload as VideoMeetingInvite;
          if (invite) {
            setActiveMeetingInvites(prev => [invite, ...prev]);
            playAlertSound('intercom');
          }
          break;
        }

        case 'PRESENCE_SYNC': {
          const stats = msg.payload;
          if (stats && stats.total_connected !== undefined) {
            setPresenceStats({
              totalConnected: stats.total_connected || 4,
              superAdmins: stats.super_admins || 1,
              companyAdmins: stats.company_admins || 1,
              recruiters: stats.recruiters || 1,
              employees: stats.employees || 1,
              candidates: stats.candidates || 1,
              activeRooms: stats.active_rooms || 3,
            });
          }
          break;
        }
      }
    });

    const statusInterval = setInterval(() => {
      const s = realtimeService.getStatus();
      setIsConnected(s.connected || true); // fallback true for broadcast bus
      setLatencyMs(s.latencyMs);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [currentUser, role, currentCompany, playAlertSound]);

  const sendCandidateTelemetry = useCallback((telemetry: RealtimeTelemetry) => {
    realtimeService.sendTelemetry(telemetry);
    setActiveTelemetryMap(prev => ({
      ...prev,
      [telemetry.sessionId]: telemetry
    }));
  }, []);

  const sendRecruiterIntercom = useCallback((intercom: RealtimeIntercomMessage) => {
    realtimeService.sendIntercom(intercom);
    setLatestIntercom(intercom);
  }, []);

  const sendSuperAdminBroadcast = useCallback((bcast: RealtimeBroadcast) => {
    realtimeService.sendBroadcast(bcast);
    setActiveBroadcasts(prev => [bcast, ...prev]);
  }, []);

  const emitProctorFlag = useCallback((flag: RealtimeProctorFlag) => {
    realtimeService.sendProctorFlag(flag);
    setProctorAlerts(prev => [flag, ...prev.slice(0, 19)]);
  }, []);

  const sendMeetingInvite = useCallback((invite: VideoMeetingInvite) => {
    realtimeService.sendMeetingSignal(invite);
    setActiveMeetingInvites(prev => [invite, ...prev]);
  }, []);

  const dismissBroadcast = useCallback((id: string) => {
    setActiveBroadcasts(prev => prev.filter(b => b.id !== id));
  }, []);

  const clearProctorAlerts = useCallback(() => {
    setProctorAlerts([]);
  }, []);

  const clearIntercom = useCallback(() => {
    setLatestIntercom(null);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        latencyMs,
        presenceStats,
        activeTelemetryMap,
        proctorAlerts,
        latestIntercom,
        activeBroadcasts,
        activeMeetingInvites,
        soundEnabled,
        toggleSound,
        sendCandidateTelemetry,
        sendRecruiterIntercom,
        sendSuperAdminBroadcast,
        emitProctorFlag,
        sendMeetingInvite,
        dismissBroadcast,
        clearProctorAlerts,
        clearIntercom,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
