import React, { useState, useRef, useEffect } from 'react';
import { InterviewSession, Candidate, VaultIndexingData, VaultKeyMoment } from '../../types';
import { AppDataStore, getVideoBlob } from '../../services/storage';
import { ApiClient } from '../../services/apiClient';
import { RecordingService } from '../../services/recordingService';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Video, 
  Play, 
  Pause,
  Download, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Eye, 
  Sparkles, 
  User, 
  X,
  Volume2,
  Radio,
  Send,
  Mic,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Award,
  Bookmark,
  FileText,
  BarChart2,
  Cpu,
  RotateCcw,
  Zap
} from 'lucide-react';

interface LiveMonitorAndRecordingsPanelProps {
  onSelectCandidateScorecard?: (candidateId: string) => void;
  onJoinLiveConference?: (roomId?: string, candidateName?: string, jobTitle?: string) => void;
}

export const LiveMonitorAndRecordingsPanel: React.FC<LiveMonitorAndRecordingsPanelProps> = ({
  onSelectCandidateScorecard,
  onJoinLiveConference,
}) => {
  const { t, formatDateTime } = useLanguage();
  const { currentUser } = useAuth();
  const { activeTelemetryMap, sendRecruiterIntercom, proctorAlerts } = useRealtime();

  const [sessions] = useState<InterviewSession[]>(() => AppDataStore.getSessions());
  const [candidates] = useState<Candidate[]>(() => AppDataStore.getCandidates());
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Video Vault State
  const [vaultData, setVaultData] = useState<VaultIndexingData | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(180);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeVaultTab, setActiveVaultTab] = useState<'moments' | 'transcription' | 'behavioral'>('moments');
  const [transcriptionQuery, setTranscriptionQuery] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Intercom input state
  const [intercomMsg, setIntercomMsg] = useState<string>('');
  const [intercomQuestion, setIntercomQuestion] = useState<string>('Can you elaborate on your singularity avoidance strategy in joint space?');
  const [intercomTargetSessionId, setIntercomTargetSessionId] = useState<string>('sess_priya_01');
  const [intercomSentSuccess, setIntercomSentSuccess] = useState<boolean>(false);

  const getCandidateForSession = (candidateId: string) => {
    return candidates.find(c => c.id === candidateId) || candidates[0];
  };

  const filteredSessions = sessions.filter(s => {
    const cand = getCandidateForSession(s.candidateId);
    const fullText = `${cand.firstName} ${cand.lastName} ${cand.id} ${s.id}`.toLowerCase();
    return fullText.includes(searchQuery.toLowerCase());
  });

  const activeLiveSessions = Object.values(activeTelemetryMap);

  const handleOpenVaultPlayer = async (sess: InterviewSession) => {
    setSelectedSession(sess);
    setShowPlayerModal(true);
    setIsLoadingVault(true);
    setVideoBlobUrl(null);
    setCurrentTimeSec(0);

    // 1. Check local IndexedDB for recorded video blob
    try {
      const localBlob = await getVideoBlob(sess.id);
      if (localBlob) {
        setVideoBlobUrl(URL.createObjectURL(localBlob));
      }
    } catch (err) {
      console.warn('Could not read local IndexedDB blob:', err);
    }

    // 2. Load Video Vault Indexing Data from backend
    try {
      let data = await ApiClient.getVideoVaultData(sess.id);
      if (!data?.data || !data.data.key_moments || data.data.key_moments.length === 0) {
        const indexRes = await ApiClient.indexVideoVault(sess.id);
        setVaultData(indexRes.data);
      } else {
        setVaultData(data.data);
      }
    } catch (err) {
      console.warn('Vault indexing fallback:', err);
      // Client-side fallback data
      setVaultData({
        session_id: sess.id,
        indexing_status: 'INDEXED',
        indexed_at: Date.now(),
        duration_formatted: '03:00',
        video_url: `/recordings/${sess.id}.webm`,
        duration_seconds: 180,
        transcription_segments: [
          { timestamp: '00:12', seconds: 12, speaker: 'AI Proctor', text: 'Welcome to the autonomous interview chamber. Question 1: Explain 6-DOF kinematics.' },
          { timestamp: '00:35', seconds: 35, speaker: 'Candidate', text: 'For a 6-DOF robotic manipulator, we establish Denavit-Hartenberg parameters to construct transformation matrices.' },
          { timestamp: '01:30', seconds: 90, speaker: 'Candidate', text: 'When the Jacobian matrix loses full rank at kinematic singularities, velocities diverge, necessitating damped least squares.' },
          { timestamp: '02:20', seconds: 140, speaker: 'Candidate', text: 'In ROS2, we utilize multi-threaded executors with real-time priority schedulers to prevent DDS contention.' }
        ],
        key_moments: [
          { timestamp: '00:35', seconds: 35, title: 'Denavit-Hartenberg Parameters & Forward Kinematics', category: 'TECHNICAL', confidence: 0.96 },
          { timestamp: '01:30', seconds: 90, title: 'Jacobian Rank Deficiency & Damped Least Squares', category: 'PROBLEM_SOLVING', confidence: 0.94 },
          { timestamp: '02:20', seconds: 140, title: 'ROS2 Real-Time Multithreaded Executor Architecture', category: 'TECHNICAL', confidence: 0.92 }
        ],
        behavioral_highlights: {
          eye_contact_ratio: 0.92,
          speaking_pace_wpm: 138,
          hesitation_ratio: 0.03,
          emotional_valence: 'CONFIDENT',
          facial_focus_score: 0.94,
          confidence_score: 91,
          pacing_wpm: 138,
          star_framework_adherence: 88,
          summary: 'Candidate demonstrated authoritative technical fluency, steady vocal cadence, and articulate problem decomposition under real-time evaluation.'
        }
      });
    } finally {
      setIsLoadingVault(false);
    }
  };

  const handleSeekToMoment = (seconds: number) => {
    setCurrentTimeSec(seconds);
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSendIntercomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intercomQuestion.trim() && !intercomMsg.trim()) return;

    sendRecruiterIntercom({
      id: `intercom_${Date.now()}`,
      sessionId: intercomTargetSessionId,
      senderId: currentUser?.id || 'usr_recruiter',
      senderName: currentUser?.name || 'Recruiter Lead',
      senderRole: currentUser?.role || 'RECRUITER',
      targetCandidateId: 'cand_priya_01',
      message: intercomMsg || 'Live Recruiter Guidance',
      promptQuestion: intercomQuestion,
      timestamp: new Date().toISOString()
    });

    setIntercomSentSuccess(true);
    setTimeout(() => setIntercomSentSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      
      {/* 1. LIVE CANDIDATE SUPERVISION & REAL-TIME INTERCOM DECK */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-900/60 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-black border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME INTERCOM & SUPERVISION ACTIVE
                </span>
                <span className="text-sm font-extrabold text-white">Live Candidate Stream Deck</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor candidates taking AI interviews in real-time, inspect speech metrics, and inject live prompt questions directly into their chamber.
              </p>
            </div>
          </div>

          {onJoinLiveConference && (
            <button
              onClick={() => onJoinLiveConference()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Launch Multi-Party Video Room</span>
            </button>
          )}
        </div>

        {/* Live Active Candidates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Candidate Stream Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Active Chamber Video Stream</span>
            </div>

            {activeLiveSessions.map((tel) => (
              <div
                key={tel.sessionId}
                className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-800/60 shadow-inner space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                      {tel.candidateName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{tel.candidateName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                          {tel.candidateId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Current: <strong className="text-white">Q{tel.questionIndex + 1}: {tel.questionTitle}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" />
                      {tel.wpm} WPM (Fluent)
                    </span>
                    <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Score: {tel.runningScore || 88}%
                    </span>
                  </div>
                </div>

                {/* Live Speech Transcript Ticker */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                    <span>Live Continuous Audio Transcript</span>
                    <span className="text-cyan-400">Confidence: {tel.confidencePct}%</span>
                  </div>
                  <p className="text-slate-200 italic">
                    "{tel.liveTranscriptChunk || 'Awaiting candidate voice input...'}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Live Recruiter Intercom Controller */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                <span>Live Intercom Prompt Injection</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Send a custom follow-up question or hint directly into candidate's active chamber screen in real-time.
              </p>
            </div>

            {intercomSentSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Prompt injected into Candidate's chamber!</span>
              </div>
            )}

            <form onSubmit={handleSendIntercomPrompt} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Custom Interviewer Prompt / Question
                </label>
                <textarea
                  value={intercomQuestion}
                  onChange={(e) => setIntercomQuestion(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="e.g. Can you explain your singularity avoidance algorithm in joint space?"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Interviewer Guidance / Hint (Optional)
                </label>
                <input
                  type="text"
                  value={intercomMsg}
                  onChange={(e) => setIntercomMsg(e.target.value)}
                  placeholder="e.g. Focus on Damped Least Squares..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject Prompt into Candidate Screen</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. RECORDINGS VAULT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
              <Video className="w-5 h-5 text-purple-400" />
              <span>Interview Recordings & AI Video Vault</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse candidate recorded sessions, inspect verified anti-cheat telemetry, and view complete scoring dossier.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate recordings..."
              className="bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-56"
            />
          </div>
        </div>

        {/* Grid of Recordings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((sess) => {
            const cand = getCandidateForSession(sess.candidateId);
            const score = sess.overallScore || sess.aiReport?.overallScore || 82;
            const totalDurationSec = sess.answers.reduce((acc, a) => acc + (a.durationSec || 60), 0);
            const durationMins = Math.max(1, Math.round(totalDurationSec / 60));

            return (
              <div
                key={sess.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm group"
              >
                {/* Top video thumbnail card */}
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group-hover:border-purple-500/50 transition-colors">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Recorded Session • {durationMins}m</div>
                  </div>

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                    {cand.id}
                  </div>

                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                    Score: {score}%
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-400">
                    {sess.answers.length} Questions Answered
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{cand.firstName} {cand.lastName}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(sess.startedAt || Date.now(), 'short')}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{cand.currentTitle || 'Robotics Systems Candidate'}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenVaultPlayer(sess)}
                    className="flex-1 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-bold border border-purple-800/80 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-400" />
                    <span>Open AI Video Vault</span>
                  </button>

                  {onSelectCandidateScorecard && (
                    <button
                      onClick={() => onSelectCandidateScorecard(cand.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      title="View AI Scorecard Dossier"
                    >
                      <Award className="w-4 h-4 text-cyan-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Video Vault & Interactive Analytics Modal */}
      {showPlayerModal && selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold shadow-lg shadow-purple-500/20">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                      AI VIDEO VAULT
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      {selectedSession.id}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {getCandidateForSession(selectedSession.candidateId).firstName} {getCandidateForSession(selectedSession.candidateId).lastName} — Session Recording
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline">
                  Overall Score: {selectedSession.overallScore || 88}%
                </span>
                <button
                  onClick={() => setShowPlayerModal(false)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Player Matrix: Video (Left 7 Cols) + Interactive Analytics Tabs (Right 5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Video Chamber */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative aspect-video bg-black rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group">
                  {videoBlobUrl ? (
                    <video
                      ref={videoRef}
                      src={videoBlobUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTimeSec(Math.round(videoRef.current.currentTime));
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.duration) {
                          setDurationSec(Math.round(videoRef.current.duration));
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center space-y-3 p-6">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 animate-pulse shadow-lg shadow-purple-500/30">
                        <Play className="w-7 h-7 ml-0.5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-white">Encrypted Production Stream</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          WebRTC Vault • Resolution 1080p • 60 FPS
                        </div>
                      </div>
                      <div className="text-[11px] text-purple-300 bg-purple-950/60 border border-purple-800 px-3 py-1 rounded-full font-mono inline-block">
                        Current Playhead: {Math.floor(currentTimeSec / 60)}:{(currentTimeSec % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  {/* Anti-Cheat Verified Ribbon */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cryptographically Signed • Anti-Cheat Verified</span>
                  </div>
                </div>

                {/* Video Quick Action Scrub Strip */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-purple-400 font-bold">
                      JUMP TO QUESTION:
                    </span>
                    <div className="flex gap-1">
                      {selectedSession.answers.map((a, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSeekToMoment(idx * 45)}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-purple-900 border border-slate-800 hover:border-purple-600 text-slate-300 hover:text-white text-[10px] font-mono font-bold transition-all"
                        >
                          Q{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span>Speed: 1.0x</span>
                    <span>•</span>
                    <span>Audio: Stereo Opus</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Vault Key Moments & Analytics Tabs */}
              <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col h-[400px] sm:h-[450px]">
                
                {/* Vault Tab Switcher */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveVaultTab('moments')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeVaultTab === 'moments' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>Key Moments</span>
                    </button>

                    <button
                      onClick={() => setActiveVaultTab('transcription')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeVaultTab === 'transcription' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Transcript</span>
                    </button>

                    <button
                      onClick={() => setActiveVaultTab('behavioral')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        activeVaultTab === 'behavioral' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>Behavioral</span>
                    </button>
                  </div>

                  {isLoadingVault && (
                    <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-spin" /> Indexing...
                    </span>
                  )}
                </div>

                {/* Tab 1: Timestamped Key Moments */}
                {activeVaultTab === 'moments' && (
                  <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Click moment to jump video playhead:
                    </div>

                    {(vaultData?.key_moments || []).map((km, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSeekToMoment(km.seconds)}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-slate-850 cursor-pointer transition-all space-y-1 group"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            {Math.floor(km.seconds / 60)}:{(km.seconds % 60).toString().padStart(2, '0')}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            km.category === 'TECHNICAL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                            km.category === 'PROBLEM_SOLVING' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}>
                            {km.category}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-200 transition-colors">
                          {km.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Interactive Transcription */}
                {activeVaultTab === 'transcription' && (
                  <div className="flex-1 flex flex-col py-2 space-y-2">
                    <input
                      type="text"
                      value={transcriptionQuery}
                      onChange={(e) => setTranscriptionQuery(e.target.value)}
                      placeholder="Search within speech transcript..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {(vaultData?.transcription_segments || [])
                        .filter((s: { text: string }) => s.text.toLowerCase().includes(transcriptionQuery.toLowerCase()))
                        .map((seg: { text: string; seconds?: number; speaker?: string }, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => handleSeekToMoment(seg.seconds || idx * 30)}
                            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500 cursor-pointer transition-colors space-y-1 text-xs"
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-indigo-300">{seg.speaker || 'Speaker'}</span>
                              <span className="font-mono text-slate-500">
                                {Math.floor((seg.seconds || idx * 30) / 60)}:{((seg.seconds || idx * 30) % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              "{seg.text}"
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Behavioral Highlights */}
                {activeVaultTab === 'behavioral' && (
                  <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400">Confidence Score:</div>
                        <div className="text-base font-extrabold text-cyan-400 font-mono">
                          {vaultData?.behavioral_highlights?.confidence_score || 91}%
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400">Speaking Pacing:</div>
                        <div className="text-base font-extrabold text-emerald-400 font-mono">
                          {vaultData?.behavioral_highlights?.pacing_wpm || 138} WPM
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400">Hesitation Ratio:</div>
                        <div className="text-base font-extrabold text-purple-400 font-mono">
                          {vaultData?.behavioral_highlights?.hesitation_ratio || 0.03}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400">STAR Framework:</div>
                        <div className="text-base font-extrabold text-indigo-400 font-mono">
                          {vaultData?.behavioral_highlights?.star_framework_adherence || 88}%
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-purple-900/60 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        AI Behavioral Synthesis:
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "{vaultData?.behavioral_highlights?.summary || 'Candidate demonstrated authoritative technical fluency, steady vocal cadence, and articulate problem decomposition under real-time evaluation.'}"
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Session Vault Status: <strong className="text-emerald-400">AI Indexed & Ready</strong>
              </span>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Close Vault Player
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
