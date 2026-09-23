/**
 * Ardhnarishwar Realtime Communication Service
 *
 * Provides bidirectional real-time synchronization over WebSockets with automatic
 * exponential reconnection, latency ping calculation, and cross-tab BroadcastChannel fallback.
 */

import {
  RealtimeMessage,
  RealtimeTelemetry,
  RealtimeProctorFlag,
  RealtimeIntercomMessage,
  RealtimeBroadcast,
  VideoMeetingInvite,
  UserRole,
} from '../types';

/**
 * Callback subscriber invoked on each incoming real-time payload.
 */
export type MessageListener = (msg: RealtimeMessage) => void;

/**
 * Connection status metrics for diagnostics and UI status indicators.
 */
export interface RealtimeConnectionStatus {
  connected: boolean;
  latencyMs: number;
  reconnectAttempts: number;
}

/**
 * Singleton client service managing the active WebSocket connection,
 * heartbeat intervals, message fanout, and cross-tab broadcasts.
 */
class RealtimeClientService {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string = 'usr_guest';
  private currentUserRole: UserRole = 'CANDIDATE';
  private currentCompanyId: string = 'global';
  private currentSessionId: string | null = null;
  private latencyMs: number = 24;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('ardhnarishwar_realtime_bus');
        this.broadcastChannel.onmessage = (event: MessageEvent<RealtimeMessage>) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err: unknown) {
        console.warn('BroadcastChannel not supported in this environment:', err);
      }
    }
  }

  /**
   * Initializes or updates real-time connectivity with authenticated identity credentials.
   * @param userId - Unique identifier of the authenticated user.
   * @param role - User role (SUPER_ADMIN, COMPANY_ADMIN, RECRUITER, CANDIDATE, EMPLOYEE).
   * @param companyId - Optional tenant identifier.
   * @param sessionId - Optional live interview chamber session identifier.
   */
  public initConnection(
    userId: string,
    role: UserRole,
    companyId?: string,
    sessionId?: string
  ): void {
    this.currentUserId = userId;
    this.currentUserRole = role;
    this.currentCompanyId = companyId || 'global';
    this.currentSessionId = sessionId || null;

    this.connect();
  }

  /**
   * Dynamically associates the socket with a specific interview chamber session.
   * @param sessionId - Active interview session ID or null when exiting chamber.
   */
  public updateSession(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Establishes the underlying WebSocket connection and binds event lifecycle handlers.
   */
  private connect(): void {
    if (typeof window === 'undefined') return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignored during safe disconnect
      }
      this.ws = null;
    }

    const envWsUrl = (
      import.meta as unknown as { env?: { VITE_WS_URL?: string } }
    ).env?.VITE_WS_URL;
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
      url += `&session_id=${encodeURIComponent(this.currentSessionId)}`;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Announce presence across network
        this.notifyListeners({
          type: 'PRESENCE_SYNC',
          senderId: this.currentUserId,
          senderRole: this.currentUserRole,
          payload: { connected: true, userId: this.currentUserId, role: this.currentUserRole },
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);
          if (msg.type === 'PONG') {
            this.latencyMs = Math.max(8, Math.round(Date.now() - (msg.timestamp || Date.now())));
            return;
          }
          this.notifyListeners(msg);
        } catch (e: unknown) {
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
    } catch {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedules a delayed reconnect attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      this.reconnectAttempts++;
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  /**
   * Starts periodic heartbeat ping packets to compute roundtrip latency.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 15000);
  }

  /**
   * Halts active heartbeat interval timers.
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Dispatches a ping packet to the server to maintain keep-alive and calculate latency.
   */
  public ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
    }
  }

  /**
   * Subscribes a listener to receive all incoming real-time notifications.
   * @param listener - Callback handler.
   * @returns Unsubscribe function to cleanly remove the handler.
   */
  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcasts a real-time message to all locally registered subscriber listeners.
   */
  private notifyListeners(msg: RealtimeMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err: unknown) {
        console.error('Error in realtime listener:', err);
      }
    });
  }

  /**
   * Transmits a real-time message through the WebSocket tunnel, the local BroadcastChannel,
   * and in-memory listeners.
   * @param message - Realtime message structure.
   */
  public send(message: RealtimeMessage): void {
    // 1. Send via WebSocket if online
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (err: unknown) {
        console.warn('Error sending over WebSocket:', err);
      }
    }

    // 2. Broadcast across browser tabs (cross-tab sync fallback)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {
        // Ignore channel post errors
      }
    }

    // 3. Immediately notify local listeners
    this.notifyListeners(message);
  }

  /**
   * Transmits live chamber audio/video/eye-tracking telemetry.
   */
  public sendTelemetry(telemetry: RealtimeTelemetry): void {
    this.send({
      type: 'INTERVIEW_TELEMETRY',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `interview_${telemetry.sessionId}`,
      payload: telemetry,
      timestamp: Date.now(),
    });
  }

  /**
   * Transmits a high-priority proctoring anomaly violation flag.
   */
  public sendProctorFlag(flag: RealtimeProctorFlag): void {
    this.send({
      type: 'PROCTORING_FLAG',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `tenant_${flag.companyId}`,
      payload: flag,
      timestamp: Date.now(),
    });
  }

  /**
   * Transmits an in-chamber recruiter intercom message directly to the candidate.
   */
  public sendIntercom(intercom: RealtimeIntercomMessage): void {
    this.send({
      type: 'RECRUITER_INTERCOM',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: `interview_${intercom.sessionId}`,
      payload: intercom,
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatches a global or tenant broadcast announcement from Super Admin.
   */
  public sendBroadcast(bcast: RealtimeBroadcast): void {
    this.send({
      type: 'SUPER_ADMIN_BROADCAST',
      senderId: this.currentUserId,
      senderRole: 'SUPER_ADMIN',
      targetRoom: 'global_broadcast',
      payload: bcast,
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatches a WebRTC meeting invitation or signaling message.
   */
  public sendMeetingSignal(meeting: VideoMeetingInvite): void {
    this.send({
      type: 'VIDEO_MEETING_SIGNAL',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: meeting.roomId,
      payload: meeting,
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatches a live video conference panel chat message (public or private whisper).
   */
  public sendPanelChat(roomId: string, message: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    text: string;
    timestamp: string;
    isPrivatePanelOnly: boolean;
  }): void {
    this.send({
      type: 'PANEL_CHAT',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: roomId,
      payload: { ...message, roomId },
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatches a live score consensus rating update to panelists in the conference.
   */
  public sendScoreConsensus(roomId: string, scoreData: {
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    interviewerNotes: string;
    evaluatorName: string;
    evaluatorRole: string;
  }): void {
    this.send({
      type: 'LIVE_SCORE_CONSENSUS',
      senderId: this.currentUserId,
      senderRole: this.currentUserRole,
      targetRoom: roomId,
      payload: { ...scoreData, roomId },
      timestamp: Date.now(),
    });
  }

  /**
   * Returns current real-time network connectivity and latency metrics.
   */
  public getStatus(): RealtimeConnectionStatus {
    return {
      connected: this.isConnected,
      latencyMs: this.latencyMs,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const realtimeService = new RealtimeClientService();
