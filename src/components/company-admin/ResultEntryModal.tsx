import React, { useState } from 'react';
import { Candidate, CandidateStatus } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  Save, 
  Star, 
  Sliders, 
  FileCheck
} from 'lucide-react';

interface ResultEntryModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onSavedSuccess: () => void;
}

export const ResultEntryModal: React.FC<ResultEntryModalProps> = ({
  candidate,
  onClose,
  onSavedSuccess,
}) => {
  const { t } = useLanguage();

  const [finalStatus, setFinalStatus] = useState<CandidateStatus>('HIRED');
  const [overallScore, setOverallScore] = useState<number>(85);
  const [commRating, setCommRating] = useState<number>(8);
  const [techRating, setTechRating] = useState<number>(9);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(8);
  const [feedback, setFeedback] = useState<string>('Strong conceptual grasp of ROS2 architectures and clean STAR behavioral responses.');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!candidate) return null;

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const allCands = AppDataStore.getCandidates();
    const updated = allCands.map(c => {
      if (c.id === candidate.id) {
        return {
          ...c,
          status: finalStatus
        };
      }
      return c;
    });
    AppDataStore.saveCandidates(updated);

    AppDataStore.logActivity({
      companyId: candidate.companyId,
      actorId: 'admin_usr',
      actorName: 'Talent Acquisition Team',
      actorRole: 'COMPANY_ADMIN',
      action: `INTERVIEW_FINAL_RESULT_RECORDED_${finalStatus}`,
      resource: `${candidate.firstName} ${candidate.lastName} (${candidate.id})`,
      details: `Recorded final result: ${finalStatus} with overall score ${overallScore}/100. Technical: ${techRating}/10, Comm: ${commRating}/10.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    setTimeout(() => {
      setIsSaving(false);
      onSavedSuccess();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Enter Interview Result & Scorecard
              </h3>
              <div className="text-xs text-slate-400">
                Candidate: <strong className="text-amber-300">{candidate.firstName} {candidate.lastName}</strong> ({candidate.id})
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

        <form onSubmit={handleSaveResult} className="space-y-4">
          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Final Recommendation Status *
            </label>
            <select
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value as CandidateStatus)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="HIRED">✅ Selected & Job Offer Extended (HIRED)</option>
              <option value="SHORTLISTED">⏸ Shortlisted for Next Round</option>
              <option value="EVALUATED">📊 Evaluated & Under Review</option>
              <option value="REJECTED">❌ Not Selected / Rejected</option>
            </select>
          </div>

          {/* Overall Score Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300">Overall AI Composite Score:</span>
              <span className="font-mono font-extrabold text-amber-400">{overallScore} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={overallScore}
              onChange={(e) => setOverallScore(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Dimension Ratings */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Technical (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={techRating}
                onChange={(e) => setTechRating(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Comm (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={commRating}
                onChange={(e) => setCommRating(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Problem (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={problemSolvingRating}
                onChange={(e) => setProblemSolvingRating(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Evaluator Feedback & HR Notes
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Detailed feedback regarding candidate performance..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 outline-none resize-none"
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
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Result ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
