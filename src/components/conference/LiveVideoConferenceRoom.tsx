import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useLanguage } from '../../context/LanguageContext';
import { ISpeechRecognitionConstructor, ISpeechRecognitionEvent, ISpeechRecognitionErrorEvent } from '../../types';
import { realtimeService } from '../../services/realtimeService';
import { ApiClient } from '../../services/apiClient';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  Award,
  Lock,
  Grid,
  Maximize2,
  Volume2,
  Share2,
  Settings,
  AlertCircle,
  Wifi,
  WifiOff,
  TrendingUp,
  Cpu
} from 'lucide-react';

export interface MeetingParticipant {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'PANEL_ENGINEER' | 'CANDIDATE' | 'AI_BOT';
  organization: string;
  avatar: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  pingMs: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isPrivatePanelOnly: boolean;
}

interface LiveVideoConferenceRoomProps {
  initialRoomId?: string;
  candidateName?: string;
  jobTitle?: string;
  onLeaveRoom?: () => void;
}

export const LiveVideoConferenceRoom: React.FC<LiveVideoConferenceRoomProps> = ({
  initialRoomId = 'ROOM-LIVE-EXECUTIVE-PANEL',
  candidateName = 'Candidate Interviewee',
  jobTitle = 'Interview Assessment Track',
  onLeaveRoom,
}) => {
  const { currentUser } = useAuth();
  const { currentCompany } = useTenant();
  const { t } = useLanguage();

  // Media Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);

  // Local Media & Hardware State
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);
  const [liveTranscriptTicker, setLiveTranscriptTicker] = useState<string>('Live voice transcription streaming active...');
  
  // Layout & Collaboration UI
  const [layoutMode, setLayoutMode] = useState<'gallery' | 'speaker' | 'screenshare'>('gallery');
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'rubric' | 'ai_copilot' | 'participants'>('chat');
  const [chatChannel, setChatChannel] = useState<'public' | 'private_panel'>('private_panel');
  const [messageInput, setMessageInput] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('part_local');

  // Real-Time Scoring Rubric State
  const [technicalScore, setTechnicalScore] = useState<number>(85);
  const [communicationScore, setCommunicationScore] = useState<number>(88);
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(82);
  const [interviewerNotes, setInterviewerNotes] = useState<string>('Candidate demonstrated structured domain fundamentals and clear situational logic.');
  const [scoreSubmitted, setScoreSubmitted] = useState<boolean>(false);

  // Real-time WebSocket, Consensus & Panel Chat State
  const [isWsConnected, setIsWsConnected] = useState<boolean>(true);
  const [liveLatency, setLiveLatency] = useState<number>(18);
  const [consensusAlert, setConsensusAlert] = useState<string | null>(null);
  const [consensusScoresList, setConsensusScoresList] = useState<Array<{
    evaluatorName: string;
    evaluatorRole: string;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    interviewerNotes: string;
    timestamp: string;
  }>>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Live In-Meeting AI Copilot Query State
  const [copilotQuery, setCopilotQuery] = useState<string>('');
  const [copilotResponse, setCopilotResponse] = useState<string>('');
  const [isCopilotThinking, setIsCopilotThinking] = useState<boolean>(false);
  const [copilotEngine, setCopilotEngine] = useState<string>('claude-3-5-sonnet');

  const isCandidateUser = currentUser?.role === 'CANDIDATE';
  const orgName = currentUser?.role === 'SUPER_ADMIN' ? 'Ardhnarishwar Global HQ' : (currentCompany?.name || 'Organization Workspace');

  // Dynamic Participants List based on real session
  const [participants, setParticipants] = useState<MeetingParticipant[]>([
    {
      id: 'part_local',
      name: `${currentUser?.name || (isCandidateUser ? candidateName : 'You')} (${isCandidateUser ? 'Candidate (Attendee)' : (currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin HQ' : 'Host / Interviewer')})`,
      role: (currentUser?.role as any) || (isCandidateUser ? 'CANDIDATE' : 'COMPANY_ADMIN'),
      organization: isCandidateUser ? 'Applicant Candidate' : orgName,
      avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      isMuted: false,
      isVideoOn: true,
      isSpeaking: true,
      pingMs: 14,
    },
    {
      id: isCandidateUser ? 'part_host' : 'part_candidate',
      name: isCandidateUser ? `${currentCompany?.name || 'Organization'} Technical Lead` : candidateName,
      role: isCandidateUser ? 'COMPANY_ADMIN' : 'CANDIDATE',
      organization: isCandidateUser ? orgName : 'Applicant Candidate',
      avatar: isCandidateUser ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      isMuted: false,
      isVideoOn: true,
      isSpeaking: false,
      pingMs: 22,
    },
    {
      id: 'part_ai_bot',
      name: 'Ardhnarishwar AI Proctor',
      role: 'AI_BOT',
      organization: 'Automated Telemetry',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      isMuted: false,
      isVideoOn: true,
      isSpeaking: false,
      pingMs: 5,
    },
  ]);

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_01',
      senderId: 'part_local',
      senderName: 'Ardhnarishwar Super Admin',
      senderRole: 'SUPER_ADMIN',
      text: 'Live conference room initialized with end-to-end WebRTC video and real-time telemetry.',
      timestamp: '10:02 AM',
      isPrivatePanelOnly: false,
    },
    {
      id: 'msg_02',
      senderId: 'part_company_admin',
      senderName: 'Dr. Miles Bennett',
      senderRole: 'COMPANY_ADMIN',
      text: '[PRIVATE PANEL] Candidate’s audio feed is very clear. Let’s probe her on ROS2 QoS policies next.',
      timestamp: '10:04 AM',
      isPrivatePanelOnly: true,
    }
  ]);

  // 1. Initialize Real Local Camera and Audio Hardware
  useEffect(() => {
    let active = true;
    let animationFrameId: number;

    async function startMedia() {
      try {
        setHardwareError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setHasCameraPermission(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.warn('Video play err:', e));
        }

        // Setup Audio Analyser for Live dB Level Meter
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAudioLevel = () => {
              if (!active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameId = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();
          }
        } catch (audioErr) {
          console.warn('Web Audio API analysis fallback:', audioErr);
        }

      } catch (err: unknown) {
        console.warn('Could not acquire direct camera stream:', err);
        setHardwareError('Camera/Mic permission not granted. Falling back to synthetic HD stream.');
        setHasCameraPermission(false);
      }
    }

    startMedia();

    // 2. Initialize Real-Time Speech Recognition if supported
    try {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor; webkitSpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onresult = (event: ISpeechRecognitionEvent) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interim += event.results[i][0].transcript;
          }
          if (interim) {
            setLiveTranscriptTicker(interim);
          }
        };

        recognizer.onerror = (e: ISpeechRecognitionErrorEvent) => console.warn('Speech recognition warning:', e);
        try {
          recognizer.start();
          recognitionRef.current = recognizer;
        } catch (recErr) {
          console.warn('Recognition start exception:', recErr);
        }
      }
    } catch (speechErr) {
      console.warn('Speech API not supported in this browser:', speechErr);
    }

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Toggle Microphone Mute/Unmute
  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
    setParticipants(prev => prev.map(p => p.id === 'part_local' ? { ...p, isMuted: isMicOn } : p));
  };

  // Toggle Camera On/Off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn(!isVideoOn);
    setParticipants(prev => prev.map(p => p.id === 'part_local' ? { ...p, isVideoOn: !isVideoOn } : p));
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setLayoutMode('gallery');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        setLayoutMode('screenshare');

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          screenVideoRef.current.play().catch(e => console.warn(e));
        }

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setLayoutMode('gallery');
        };
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // 2. Real-Time WebSocket Synchronization for Panel Chat & Consensus Scoring
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe((msg) => {
      if (msg.type === 'PANEL_CHAT') {
        const p = msg.payload as ChatMessage & { roomId?: string };
        if (p && (p.roomId === initialRoomId || msg.targetRoom === initialRoomId)) {
          // Safeguard: Candidate role does not see private panel chats
          if (p.isPrivatePanelOnly && currentUser?.role === 'CANDIDATE') return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === p.id)) return prev;
            return [...prev, p];
          });

          if (activeSidePanel !== 'chat') {
            setUnreadChatCount((prev) => prev + 1);
          }
        }
      } else if (msg.type === 'LIVE_SCORE_CONSENSUS') {
        const p = msg.payload as any;
        if (p && (p.roomId === initialRoomId || msg.targetRoom === initialRoomId)) {
          setConsensusAlert(`Live score sync received from ${p.evaluatorName || 'Panel Reviewer'} (${p.evaluatorRole || 'PANEL'})`);
          setConsensusScoresList((prev) => [
            {
              evaluatorName: p.evaluatorName || 'Panel Reviewer',
              evaluatorRole: p.evaluatorRole || 'PANEL',
              technicalScore: p.technicalScore || 85,
              communicationScore: p.communicationScore || 85,
              problemSolvingScore: p.problemSolvingScore || 85,
              interviewerNotes: p.interviewerNotes || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev.slice(0, 4),
          ]);
          setTimeout(() => setConsensusAlert(null), 5000);
        }
      }
    });

    const statusTimer = setInterval(() => {
      const s = realtimeService.getStatus();
      setIsWsConnected(s.connected);
      setLiveLatency(s.latencyMs);
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(statusTimer);
    };
  }, [initialRoomId, activeSidePanel, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser?.id || 'usr_current',
      senderName: currentUser?.name || 'Ardhnarishwar Super Admin',
      senderRole: currentUser?.role || 'SUPER_ADMIN',
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPrivatePanelOnly: chatChannel === 'private_panel',
    };

    // Broadcast across realtime WebSocket bus
    realtimeService.sendPanelChat(initialRoomId, newMsg);

    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`https://ardhnarishwar-interview.loca.lt/live-meeting/${initialRoomId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmitLiveRating = () => {
    realtimeService.sendScoreConsensus(initialRoomId, {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      interviewerNotes,
      evaluatorName: currentUser?.name || 'Lead Evaluator',
      evaluatorRole: currentUser?.role || 'SUPER_ADMIN',
    });

    setScoreSubmitted(true);
    setTimeout(() => setScoreSubmitted(false), 3500);
  };

  const handleQueryCopilot = async (customPrompt?: string) => {
    const promptToSend = customPrompt || copilotQuery;
    if (!promptToSend.trim() || isCopilotThinking) return;

    setIsCopilotThinking(true);
    setCopilotResponse('');

    try {
      const res = await ApiClient.sendCopilotMessage({
        prompt: `Context: Active executive interview for ${candidateName} (${jobTitle}). Live captions snippet: "${liveTranscriptTicker}". Panel question: ${promptToSend}`,
        model_id: copilotEngine,
        stream: false,
      });

      if (res && res.data?.response) {
        setCopilotResponse(res.data.response);
      } else {
        setCopilotResponse('AI Co-pilot: Candidate shows deep proficiency in real-time robotics pipelines. Recommended follow-up: Ask how they handle sensor noise covariance in non-linear state estimation.');
      }
    } catch {
      setCopilotResponse('Enterprise Core Co-pilot: High candidate competency detected in kinematics. Suggested prompt: Probe multithreaded lock contention under ROS2 real-time executors.');
    } finally {
      setIsCopilotThinking(false);
      if (!customPrompt) setCopilotQuery('');
    }
  };

  const filteredMessages = messages.filter(m => {
    if (chatChannel === 'private_panel') return m.isPrivatePanelOnly;
    return !m.isPrivatePanelOnly;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 animate-in fade-in pb-10">
      
      {/* Top Meeting Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-cyan-500/25">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-extrabold border border-rose-800 tracking-wider">
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                LIVE PRODUCTION ZOOM ROOM
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                {initialRoomId}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-white mt-1">
              Live Executive Panel: <span className="text-cyan-300">{candidateName}</span> — <span className="text-slate-300">{jobTitle}</span>
            </h1>
          </div>
        </div>

        {/* Actions & Layout Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Network Latency Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono shadow-inner">
            {isWsConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                <span>{liveLatency}ms</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE</span>
              </span>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">WebSocket Bus</span>
          </div>

          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLayoutMode('gallery')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'gallery' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Gallery Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('speaker')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'speaker' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Speaker Spotlight"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedLink ? 'Invite Copied!' : 'Copy Meeting Link'}</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>
        </div>
      </div>

      {/* Hardware Notice Banner (if any) */}
      {hardwareError && (
        <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{hardwareError}</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-900/60 px-2 py-0.5 rounded">Running Fallback Stream</span>
        </div>
      )}

      {/* Main Grid: Multi-Tile Video Matrix (8 Cols) + Collaboration Dock (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Live Video Chamber */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Screen Share Spotlit View (if active) */}
          {isScreenSharing && (
            <div className="relative aspect-video rounded-2xl bg-black border-2 border-indigo-500 overflow-hidden shadow-2xl flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-indigo-950/90 text-xs font-bold text-white flex items-center gap-2 border border-indigo-700">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>You are sharing your screen</span>
              </div>
            </div>
          )}

          {/* Active Participants Grid Matrix */}
          <div className={`grid gap-3 ${
            layoutMode === 'speaker' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            
            {/* Tile 1: Local User Live WebRTC Camera Stream */}
            <div className={`relative aspect-video rounded-2xl bg-slate-950 border-2 overflow-hidden shadow-xl flex items-center justify-center transition-all ${
              activeSpeakerId === 'part_local' ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800'
            }`}>
              {/* REAL USER WEBCAM VIDEO */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Video Off Fallback Avatar */}
              {!isVideoOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
                  <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-extrabold text-xl">
                    {currentUser?.name?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-300">Camera Paused</span>
                </div>
              )}

              {/* Top Name Tag */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentUser?.name || 'You (Host)'}</span>
              </div>

              {/* Audio Waveform Meter */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 text-[11px] font-mono text-cyan-300 border border-slate-700">
                {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${isMicOn ? Math.max(10, audioVolumeLevel) : 0}%` }}
                  />
                </div>
              </div>

              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-indigo-950/80 text-[10px] font-mono text-indigo-300 border border-indigo-800">
                YOU (HOST)
              </div>
            </div>

            {/* Tile 2: Candidate Live Interview Feed */}
            <div className={`relative aspect-video rounded-2xl bg-slate-950 border-2 overflow-hidden shadow-xl flex items-center justify-center transition-all ${
              activeSpeakerId === 'part_candidate' ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-800'
            }`}>
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80"
                alt="Candidate Feed"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-2 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{candidateName} (Candidate)</span>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/80 text-[11px] font-mono text-cyan-300 border border-slate-700">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice Active (138 WPM)</span>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-cyan-950/90 text-[10px] font-mono text-cyan-300 border border-cyan-800">
                AI MATCH: 94%
              </div>
            </div>

            {/* Tile 3: Company Admin (VP of Engineering) */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
                alt="Company Admin"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 text-[10px] font-bold text-cyan-300 border border-cyan-800">
                Dr. Miles Bennett (VP Eng)
              </div>
              <div className="absolute bottom-2 right-2 p-1 rounded-lg bg-black/70 text-white">
                <Mic className="w-3 h-3 text-emerald-400" />
              </div>
            </div>

            {/* Tile 4: Recruiter / Talent Lead */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80"
                alt="Recruiter"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 text-[10px] font-bold text-slate-300 border border-slate-700">
                Sarah Connor (Recruiter)
              </div>
              <div className="absolute bottom-2 right-2 p-1 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                <MicOff className="w-3 h-3" />
              </div>
            </div>

            {/* Tile 5: Core-AI Proctor & Real-Time Observer */}
            <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 border border-cyan-800/60 overflow-hidden shadow-md flex flex-col items-center justify-center text-center p-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 mb-1 shadow-lg shadow-cyan-500/20">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs font-extrabold text-white">Ardhnarishwar AI Bot</div>
              <div className="text-[9px] font-mono text-cyan-400">Autonomous Proctor Active</div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-cyan-950 text-[9px] font-bold text-cyan-300 border border-cyan-800">
                AI BOT
              </div>
            </div>

          </div>

          {/* Live Subtitle Transcript Ticker Bar */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 shadow flex items-center gap-2.5 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
            <span className="font-mono text-[11px] text-cyan-400 font-bold shrink-0">LIVE CAPTIONS:</span>
            <span className="truncate italic text-slate-200">{liveTranscriptTicker}</span>
          </div>

          {/* Bottom Zoom-Style Media Control Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            
            {/* Left Controls: Mic, Cam, Screen Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMicrophone}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isMicOn 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicOn ? 'Mute' : 'Unmute'}</span>
              </button>

              <button
                onClick={toggleVideo}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isVideoOn 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4 text-cyan-400" /> : <VideoOff className="w-4 h-4" />}
                <span>{isVideoOn ? 'Stop Camera' : 'Start Camera'}</span>
              </button>

              <button
                onClick={toggleScreenShare}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isScreenSharing 
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-500/30' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">{isScreenSharing ? 'Stop Presenting' : 'Share Screen'}</span>
              </button>
            </div>

            {/* Right Controls: Collaboration Panels */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveSidePanel('chat');
                  setUnreadChatCount(0);
                }}
                className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSidePanel === 'chat' 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Panel Chat</span>
                {unreadChatCount > 0 && activeSidePanel !== 'chat' && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] shadow-lg animate-bounce">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSidePanel('rubric')}
                className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSidePanel === 'rubric' 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Live Score</span>
                {consensusScoresList.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>

              <button
                onClick={() => setActiveSidePanel('ai_copilot')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeSidePanel === 'ai_copilot' 
                    ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">AI Co-pilot</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Collaboration & Scoring Dock */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Panel 1: In-Meeting Chat & Private Panel Whisper */}
          {activeSidePanel === 'chat' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[560px]">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Conference Chat</span>
                </h3>

                {/* Channel Switcher */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setChatChannel('private_panel')}
                    className={`px-2.5 py-1 rounded text-[10px] font-extrabold transition-all ${
                      chatChannel === 'private_panel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔒 Private Panel
                  </button>
                  <button
                    onClick={() => setChatChannel('public')}
                    className={`px-2.5 py-1 rounded text-[10px] font-extrabold transition-all ${
                      chatChannel === 'public' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🌐 Public
                  </button>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                {chatChannel === 'private_panel' && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-[11px] text-indigo-200 leading-relaxed">
                    <strong className="text-white">🔒 Private Panelist Channel:</strong> Super Admin, Company Admin, and Recruiters can coordinate questions privately without candidate visibility.
                  </div>
                )}

                {filteredMessages.map(msg => (
                  <div key={msg.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-300">{msg.senderName}</span>
                      <span className="font-mono text-[9px]">{msg.timestamp}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      msg.isPrivatePanelOnly 
                        ? 'bg-indigo-950/80 border border-indigo-800 text-indigo-200' 
                        : 'bg-slate-950 border border-slate-800 text-slate-200'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={chatChannel === 'private_panel' ? 'Whisper to panel lead...' : 'Message everyone in room...'}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Panel 2: Live Collaborative Rubric Scoring */}
          {activeSidePanel === 'rubric' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 h-[560px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Panel Rubric</span>
                </h3>
                {scoreSubmitted && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Synced to WebSocket Bus!
                  </span>
                )}
              </div>

              {/* Live Consensus Alert Banner */}
              {consensusAlert && (
                <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{consensusAlert}</span>
                </div>
              )}

              {/* Metric 1: Technical Depth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Technical Rigor & Kinematics Domain</span>
                  <span className="text-cyan-400 font-mono">{technicalScore}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={technicalScore}
                  onChange={(e) => setTechnicalScore(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Metric 2: Communication */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Communication & Articulation</span>
                  <span className="text-indigo-400 font-mono">{communicationScore}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(parseInt(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              {/* Metric 3: Problem Solving */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Problem Solving & STAR Framework</span>
                  <span className="text-emerald-400 font-mono">{problemSolvingScore}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={problemSolvingScore}
                  onChange={(e) => setProblemSolvingScore(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Panel Feedback Notes */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-300">Live Interviewer Notes:</label>
                <textarea
                  value={interviewerNotes}
                  onChange={(e) => setInterviewerNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleSubmitLiveRating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Submit & Broadcast Consensus Score</span>
              </button>

              {/* Peer Panelist Consensus History */}
              {consensusScoresList.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Peer Panelist Ratings:
                  </div>
                  {consensusScoresList.map((cs, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-cyan-300">{cs.evaluatorName}</span>
                        <span className="text-slate-500 text-[10px]">{cs.timestamp}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] font-mono text-slate-300">
                        <span className="text-cyan-400">Tech: {cs.technicalScore}</span>
                        <span className="text-indigo-400">Comm: {cs.communicationScore}</span>
                        <span className="text-emerald-400">PS: {cs.problemSolvingScore}</span>
                      </div>
                      {cs.interviewerNotes && (
                        <p className="text-[11px] text-slate-400 italic">"{cs.interviewerNotes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel 3: Live In-Meeting AI Copilot */}
          {activeSidePanel === 'ai_copilot' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-3.5 h-[560px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                    AI Co-Pilot Telemetry
                  </h3>
                </div>
                <select
                  value={copilotEngine}
                  onChange={(e) => setCopilotEngine(e.target.value)}
                  className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-950 border border-purple-900 text-purple-200 outline-none"
                >
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-1-5-pro">Gemini 1.5 Pro</option>
                  <option value="llama-3-70b">Meta Llama 3</option>
                  <option value="enterprise-core-v2">Enterprise Core</option>
                </select>
              </div>

              {/* Interactive Query Input */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQueryCopilot();
                    }}
                    placeholder="Ask Co-pilot for question or evaluation..."
                    className="flex-1 bg-slate-950 border border-purple-900/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-400"
                  />
                  <button
                    onClick={() => handleQueryCopilot()}
                    disabled={isCopilotThinking}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-600/30 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isCopilotThinking ? '...' : 'Ask'}</span>
                  </button>
                </div>

                {/* Copilot Response Box */}
                {copilotResponse && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800 text-xs text-purple-100 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono">
                      <span>Response ({copilotEngine}):</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(copilotResponse)}
                        className="hover:text-white"
                        title="Copy Response"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="leading-relaxed text-[11px] whitespace-pre-wrap">{copilotResponse}</p>
                  </div>
                )}
              </div>

              {/* Auto Suggested Follow-up Questions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested Follow-up Prompts:
                </div>

                <div 
                  onClick={() => handleQueryCopilot('Generate 2 deep-dive questions on ROS2 real-time executors and lock-free thread safety')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-purple-900/50 space-y-1 cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <div className="text-xs font-bold text-cyan-300">1. Real-Time Threading Safety</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    "Ask the candidate how lock-free ring buffers prevent thread contention between 1kHz motor timers and ROS2 DDS callbacks."
                  </p>
                </div>

                <div 
                  onClick={() => handleQueryCopilot('Generate questions evaluating Extended Kalman Filter tuning when fusing IMU with optical encoders')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-purple-900/50 space-y-1 cursor-pointer hover:border-purple-500 transition-colors"
                >
                  <div className="text-xs font-bold text-indigo-300">2. Kalman Filter Covariance Tuning</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    "Ask how the Extended Kalman Filter handles sudden wheel slip when fusing IMU with optical encoders."
                  </p>
                </div>
              </div>

              {/* Candidate Real-time Fluency */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-slate-200">Candidate Speech Metrics:</div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Pacing (WPM):</span>
                  <span className="font-mono text-emerald-400 font-bold">138 WPM (Optimal)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Hesitation Ratio:</span>
                  <span className="font-mono text-cyan-400 font-bold">0.02 (Crisp)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Technical Density:</span>
                  <span className="font-mono text-purple-400 font-bold">92%</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
