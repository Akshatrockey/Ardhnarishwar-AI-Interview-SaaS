import React, { useState } from 'react';
import { InterviewSession, Candidate } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Video, 
  Play, 
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
  HelpCircle,
  Award
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
                    onClick={() => { setSelectedSession(sess); setShowPlayerModal(true); }}
                    className="flex-1 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-bold border border-purple-800/80 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Watch Recording</span>
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

      {/* Video Player Modal */}
      {showPlayerModal && selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Candidate Session Recording: {getCandidateForSession(selectedSession.candidateId).firstName} {getCandidateForSession(selectedSession.candidateId).lastName}
                </h3>
                <p className="text-xs text-slate-400">Session ID: {selectedSession.id}</p>
              </div>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-2">
                <Play className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                <div className="text-xs text-slate-400 font-mono">Simulated HD 1080p Video Vault Stream</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Overall Score: <strong className="text-emerald-400">{selectedSession.overallScore || 88}%</strong></span>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
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
