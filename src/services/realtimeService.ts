import { 
  RealtimeMessage, 
  RealtimeTelemetry, 
  RealtimeProctorFlag, 
  RealtimeIntercomMessage, 
  RealtimeBroadcast, 
  VideoMeetingInvite,
  UserRole 
} from '../types';

type MessageListener = (msg: RealtimeMessage) => void;

class RealtimeClientService {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private currentUserId: string = 'usr_guest';
  private currentUserRole: UserRole = 'CANDIDATE';
  private currentCompanyId: string = 'global';
  private currentSessionId: string | null = null;
  private latencyMs: number = 24;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('ardhnarishwar_realtime_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment:', err);
      }
    }
  }

  public initConnection(userId: string, role: UserRole, companyId?: string, sessionId?: string) {
    this.currentUserId = userId;
    this.currentUserRole = role;
    this.currentCompanyId = companyId || 'global';
    this.currentSessionId = sessionId || null;

    this.connect();
  }

  public updateSession(sessionId: string | null) {
    this.currentSessionId = sessionId;
  }

  private connect() {
    if (typeof window === 'undefined') return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    let url: string;
    
    if (envWsUrl) {
      const cleanWsUrl = envWsUrl.replace(/\/+$/, '');
      url = `${cleanWsUrl}/ws/realtime/${this.currentUserRole}/${this.currentUserId}?company_id=${this.currentCompanyId}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      url = `${protocol}//${wsHost}/ws/realtime/${this.currentUserRole}/${this.currentUserId}?company_id=${this.currentCompanyId}`;
    }
    
    if (this.currentSessionId) {
      url += `&session_id=${this.currentSessionId}`;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Announce presence
        this.notifyListeners({
          type: 'PRESENCE_SYNC',
          senderId: this.currentUserId,
          senderRole: this.currentUserRole,
          payload: { connected: true, userId: this.currentUserId, role: this.currentUserRole },
          timestamp: Date.now()
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);
          if (msg.type === 'PONG') {
            this.latencyMs = Math.max(8, Math.round(Date.now() - (msg.timestamp || Date.now())));
            return;
          }
          this.notifyListeners(msg);
        } catch (e) {
          console.warn('Error parsing incoming WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (err) {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      this.reconnectAttempts++;
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
    }
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(msg: RealtimeMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in realtime listener:', err);
      }
    });
  }

  public send(message: RealtimeMessage) {
    // 1. Send via WebSocket if online
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (err) {
        console.warn('Error sending over WebSocket:', err);
      }
    }

    // 2. Broadcast across browser tabs (cross-tab real-time sync fallback)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }

    // 3. Immediately notify local listeners
    this.notifyListeners(message);
  }

  public sendTelemetry(telemetry: RealtimeTelemetry) {
    this.send({
      type: 'INTERVIEW_TELEMETRY',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `interview_${telemetry.sessionId}`,
      payload: telemetry,
      timestamp: Date.now()
    });
  }

  public sendProctorFlag(flag: RealtimeProctorFlag) {
    this.send({
      type: 'PROCTORING_FLAG',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `tenant_${flag.companyId}`,
      payload: flag,
      timestamp: Date.now()
    });
  }

  public sendIntercom(intercom: RealtimeIntercomMessage) {
    this.send({
      type: 'RECRUITER_INTERCOM',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `interview_${intercom.sessionId}`,
      payload: intercom,
      timestamp: Date.now()
    });
  }

  public sendBroadcast(bcast: RealtimeBroadcast) {
    this.send({
      type: 'SUPER_ADMIN_BROADCAST',
      senderId: this.currentUserId,
      senderRole: 'SUPER_ADMIN',
      targetRoom: 'global_broadcast',
      payload: bcast,
      timestamp: Date.now()
    });
  }

  public sendMeetingSignal(meeting: VideoMeetingInvite) {
    this.send({
      type: 'VIDEO_MEETING_SIGNAL',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: meeting.roomId,
      payload: meeting,
      timestamp: Date.now()
    });
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      latencyMs: this.latencyMs,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const realtimeService = new RealtimeClientService();
