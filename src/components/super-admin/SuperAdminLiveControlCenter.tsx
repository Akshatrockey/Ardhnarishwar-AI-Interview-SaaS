import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { useTenant } from '../../context/TenantContext';
import { AppDataStore } from '../../services/storage';
import { 
  Radio, 
  Video, 
  Activity, 
  ShieldAlert, 
  Send, 
  Users, 
  Server, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wifi, 
  Volume2, 
  Eye, 
  Layers, 
  Building2,
  Clock,
  Mic,
  MessageSquare
} from 'lucide-react';

interface SuperAdminLiveControlCenterProps {
  onJoinConferenceRoom?: (roomId: string, candidateName?: string, jobTitle?: string) => void;
}

export const SuperAdminLiveControlCenter: React.FC<SuperAdminLiveControlCenterProps> = ({
  onJoinConferenceRoom,
}) => {
  const { 
    isConnected, 
    latencyMs, 
    presenceStats, 
    activeTelemetryMap, 
    proctorAlerts, 
    sendSuperAdminBroadcast, 
    clearProctorAlerts 
  } = useRealtime();

  const { allCompanies } = useTenant();
  const candidates = AppDataStore.getCandidates();
  const jobs = AppDataStore.getJobs();

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState<string>('System Maintenance Advisory');
  const [broadcastMsg, setBroadcastMsg] = useState<string>('All live interview chambers operating normally on v3.6 Realtime Engine.');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'EMERGENCY'>('INFO');
  const [broadcastSentSuccess, setBroadcastSentSuccess] = useState<boolean>(false);

  const handleDispatchBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    sendSuperAdminBroadcast({
      id: `bcast_${Date.now()}`,
      senderId: 'usr_super_admin',
      senderName: 'Ardhnarishwar Super Admin HQ',
      title: broadcastTitle,
      message: broadcastMsg,
      severity: broadcastSeverity,
      timestamp: new Date().toISOString()
    });

    setBroadcastSentSuccess(true);
    setTimeout(() => setBroadcastSentSuccess(false), 2500);
  };

  const telemetryList = Object.values(activeTelemetryMap);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      
      {/* Top Hero Telemetry Ribbon */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-950 border border-indigo-900/50 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/25">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-300">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Global Real-Time Control Center
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                HQ TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Live multi-tenant WebSocket pipeline, active candidate stream radar, and platform-wide broadcast dispatcher.
            </p>
          </div>
        </div>

        {/* Live Network Health Status */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Wifi className="w-4 h-4 animate-bounce" />
              <span>WS CONNECTED</span>
            </div>
            <div className="text-slate-500">|</div>
            <div className="text-cyan-400">Ping: <strong>{latencyMs}ms</strong></div>
            <div className="text-slate-500">|</div>
            <div className="text-slate-300">Active Peers: <strong>{presenceStats.totalConnected}</strong></div>
          </div>
        </div>
      </div>

      {/* Global Presence & Platform Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Super Admins</div>
          <div className="text-xl font-black text-cyan-400">{presenceStats.superAdmins} Online</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Company Admins</div>
          <div className="text-xl font-black text-indigo-400">{presenceStats.companyAdmins} Online</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Recruiters</div>
          <div className="text-xl font-black text-purple-400">{presenceStats.recruiters} Online</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Employees</div>
          <div className="text-xl font-black text-teal-400">{presenceStats.employees} Online</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Candidates Live</div>
          <div className="text-xl font-black text-emerald-400">{presenceStats.candidates} in Chamber</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-sm">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Active WS Rooms</div>
          <div className="text-xl font-black text-amber-400">{presenceStats.activeRooms} Rooms</div>
        </div>
      </div>

      {/* Main Grid: Live Radar vs Global Broadcast & Proctor Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: ACTIVE CANDIDATE SESSIONS RADAR */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Active Candidate Session Radar ({telemetryList.length} Sessions)</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
            </span>
          </div>

          <div className="space-y-4">
            {telemetryList.map((tel) => {
              const comp = allCompanies.find(c => c.id === tel.companyId) || allCompanies[1];
              return (
                <div
                  key={tel.sessionId}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 shadow-md group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-cyan-300">
                        {tel.candidateName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">{tel.candidateName}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800">
                            {tel.candidateId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          {comp?.name} • Session: <span className="font-mono text-cyan-400">{tel.sessionId}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onJoinConferenceRoom && onJoinConferenceRoom(`ROOM-PANEL-${tel.candidateName.toUpperCase().replace(/\s+/g, '-')}-2026`, tel.candidateName, tel.questionTitle)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-800 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Video Chamber</span>
                    </button>
                  </div>

                  {/* Question & Audio Wave */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">Q{tel.questionIndex + 1}: {tel.questionTitle}</span>
                      <div className="flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
                        <Mic className="w-3 h-3" />
                        <span>{tel.wpm} WPM</span>
                      </div>
                    </div>

                    {/* Live Transcript Stream */}
                    {tel.liveTranscriptChunk && (
                      <p className="text-xs text-slate-300 italic font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                        "{tel.liveTranscriptChunk}"
                      </p>
                    )}

                    {/* Telemetry Meters */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Confidence:</span>
                        <strong className="text-cyan-300">{tel.confidencePct}%</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Face Tracking:</span>
                        <strong className={tel.faceVisible ? 'text-emerald-400' : 'text-rose-400'}>
                          {tel.faceVisible ? 'CENTERED' : 'OBSTRUCTED'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Running Score:</span>
                        <strong className="text-purple-300">{tel.runningScore || 88}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 1 COL: GLOBAL BROADCAST & PROCTOR ALERT TICKER */}
        <div className="space-y-6">
          
          {/* Global Broadcast Broadcaster Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Platform Global Broadcast</span>
            </h3>

            {broadcastSentSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Broadcast dispatched to all active connected chambers!</span>
              </div>
            )}

            <form onSubmit={handleDispatchBroadcast} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Broadcast Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Announcement Message</label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity('INFO')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    broadcastSeverity === 'INFO' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 bg-slate-950'
                  }`}
                >
                  INFO
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity('WARNING')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    broadcastSeverity === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 bg-slate-950'
                  }`}
                >
                  WARNING
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastSeverity('EMERGENCY')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    broadcastSeverity === 'EMERGENCY' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 bg-slate-950'
                  }`}
                >
                  EMERGENCY
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast to All Users</span>
              </button>
            </form>
          </div>

          {/* Real-Time Anti-Cheat Proctoring Alert Ticker */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Proctoring Alert Feed</span>
              </h3>
              {proctorAlerts.length > 0 && (
                <button
                  onClick={clearProctorAlerts}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Clear Feed
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {proctorAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-mono">
                  No cheat violations detected. All live chambers secure.
                </div>
              ) : (
                proctorAlerts.map(flag => (
                  <div
                    key={flag.id}
                    className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300">{flag.candidateName}</span>
                      <span className="text-[9px] font-mono text-rose-400">{flag.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{flag.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
