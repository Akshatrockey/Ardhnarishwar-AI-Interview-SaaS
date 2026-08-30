import React, { useState } from 'react';
import { Candidate, InterviewRound } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useLanguage, SUPPORTED_TIMEZONES, TimezoneCode } from '../../context/LanguageContext';
import { 
  Calendar, 
  Clock, 
  X, 
  Send, 
  CheckCircle2, 
  Globe, 
  Layers, 
  Sparkles, 
  Mail
} from 'lucide-react';

interface ScheduleInterviewModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onScheduledSuccess: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  candidate,
  onClose,
  onScheduledSuccess,
}) => {
  const { t, timezone, formatDateTime } = useLanguage();

  const now = new Date();
  const defaultStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEndTime = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState<string>(defaultStartTime);
  const [endTime, setEndTime] = useState<string>(defaultEndTime);
  const [selectedRoundType, setSelectedRoundType] = useState<string>('AI_SCREENING');
  const [scheduleTimezone, setScheduleTimezone] = useState<TimezoneCode>(timezone);
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<boolean>(false);

  if (!candidate) return null;

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save activity log
    AppDataStore.logActivity({
      companyId: candidate.companyId,
      actorId: 'admin_usr',
      actorName: 'Talent Acquisition Team',
      actorRole: 'RECRUITER',
      action: 'INTERVIEW_SCHEDULED_WINDOW_SET',
      resource: `${candidate.firstName} ${candidate.lastName} (${candidate.id})`,
      details: `Scheduled window: ${startTime} to ${endTime} (${scheduleTimezone}). Round: ${selectedRoundType}. Invitation email dispatched.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    // Update candidate status to SHORTLISTED
    const allCands = AppDataStore.getCandidates();
    const updated = allCands.map(c => c.id === candidate.id ? { ...c, status: 'SHORTLISTED' as const } : c);
    AppDataStore.saveCandidates(updated);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessBanner(true);
      setTimeout(() => {
        onScheduledSuccess();
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {t('nav.schedule', 'Schedule AI Interview')}
              </h3>
              <div className="text-xs text-slate-400">
                Candidate: <strong className="text-cyan-300">{candidate.firstName} {candidate.lastName}</strong> ({candidate.id})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Interview Scheduled Successfully!</div>
              <div>Invitation email dispatched with candidate token <strong className="font-mono">{candidate.interviewToken}</strong>.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveSchedule} className="space-y-4">
          {/* Datetime Window Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                End Time Window *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Timezone & Round Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Timezone</span>
              </label>
              <select
                value={scheduleTimezone}
                onChange={(e) => setScheduleTimezone(e.target.value as TimezoneCode)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz.code} value={tz.code}>
                    {tz.code} — {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Interview Round</span>
              </label>
              <select
                value={selectedRoundType}
                onChange={(e) => setSelectedRoundType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="AI_SCREENING">Round 1: AI Robotics Screening</option>
                <option value="TECHNICAL_ROBOTICS">Round 2: Technical Deep Dive</option>
                <option value="HR_BEHAVIORAL">Round 3: Behavioral & Culture Fit</option>
                <option value="LEADERSHIP_FINAL">Round 4: Final Executive Round</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Special Proctoring or Role Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Ensure candidate tests microphone before starting ROS2 simulation question..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none resize-none"
            />
          </div>

          {/* Email Notification Toggle */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-cyan-400" />
              <div className="text-xs">
                <div className="font-semibold text-slate-200">Send Email Notification</div>
                <div className="text-[10px] text-slate-500">Delivers invitation token & portal link to candidate email</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={(e) => setSendEmailNotification(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Scheduling...' : 'Confirm & Schedule ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
