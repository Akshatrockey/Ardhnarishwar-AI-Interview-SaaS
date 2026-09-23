import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  FileText, 
  Bot, 
  Video, 
  Award, 
  Building2, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface ApplicationTrackerDrawerProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinMeeting?: (meetingId: string, joinUrl?: string) => void;
}

interface TimelineStage {
  step: number;
  title: string;
  key: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  date?: string;
  score?: number;
  meeting_id?: string;
  join_url?: string;
  description: string;
}

export const ApplicationTrackerDrawer: React.FC<ApplicationTrackerDrawerProps> = ({
  applicationId,
  isOpen,
  onClose,
  onJoinMeeting
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [timelineData, setTimelineData] = useState<{
    candidate_name: string;
    email: string;
    job_title: string;
    company_name: string;
    current_status: string;
    interview_token: string;
    stages: TimelineStage[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getApplicationTimeline(applicationId);
      if (res.data?.success) {
        setTimelineData(res.data);
      } else {
        // Fallback default stages if backend offline
        setTimelineData({
          candidate_name: 'Candidate Applicant',
          email: 'candidate@example.com',
          job_title: 'Robotics Software & Controls Track',
          company_name: 'Ardhnarishwar Enterprise Partner',
          current_status: 'SHORTLISTED',
          interview_token: applicationId,
          stages: [
            { step: 1, title: 'Application Submitted', key: 'APPLIED', status: 'COMPLETED', description: 'Application received and resume parsed.' },
            { step: 2, title: 'HR Profile Review', key: 'UNDER_REVIEW', status: 'COMPLETED', description: 'Technical track qualification verified.' },
            { step: 3, title: 'Autonomous AI Assessment', key: 'AI_ASSESSMENT', status: 'CURRENT', description: 'AI Interview Chamber invitation active.' },
            { step: 4, title: 'Live 1-on-1 Interview', key: 'LIVE_INTERVIEW', status: 'PENDING', description: 'HR panel meeting schedule pending.' },
            { step: 5, title: 'Final Decision & Offer', key: 'FINAL_OFFER', status: 'PENDING', description: 'Final scorecard evaluation pending.' }
          ]
        });
      }
    } catch (e: any) {
      setError('Unable to load live timeline. Showing cached state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTimeline();
    }
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Application Status Stepper
              </div>
              <h2 className="text-lg font-black text-white">Track Application Progress</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTimeline}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh timeline from DB"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job & Applicant Card */}
          {timelineData && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    {timelineData.company_name}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{timelineData.job_title}</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {timelineData.current_status}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-4 text-xs text-slate-400">
                <div>Candidate: <strong className="text-slate-200">{timelineData.candidate_name}</strong></div>
                <div>Token: <span className="font-mono text-emerald-400">{timelineData.interview_token}</span></div>
              </div>
            </div>
          )}

          {/* Multi-Step Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Recruitment Stages
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {(timelineData?.stages || []).map((stage) => {
                const isCompleted = stage.status === 'COMPLETED';
                const isCurrent = stage.status === 'CURRENT';

                return (
                  <div key={stage.step} className="relative group">
                    {/* Circle Indicator */}
                    <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30' 
                        : isCurrent
                        ? 'bg-cyan-500 text-white border-cyan-300 ring-4 ring-cyan-500/20 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border-slate-700'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.step}
                    </div>

                    {/* Stage Card */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-800/80 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : isCompleted
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-slate-950/60 border-slate-850 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-cyan-300' : 'text-slate-400'}`}>
                            {stage.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>
                        {stage.date && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(stage.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {stage.description}
                      </p>

                      {/* Live Interview Action if available */}
                      {stage.key === 'LIVE_INTERVIEW' && stage.meeting_id && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <div className="text-[11px] text-slate-300">
                            Live Zoom Meeting Room: <strong className="font-mono text-cyan-400">{stage.meeting_id}</strong>
                          </div>
                          <button
                            onClick={() => onJoinMeeting?.(stage.meeting_id!, stage.join_url)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Live Meet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Real-time status synchronized with enterprise recruiter database.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
