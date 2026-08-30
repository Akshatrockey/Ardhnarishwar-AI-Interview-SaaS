import React, { useState } from 'react';
import { InterviewRound, RoundType } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useTenant } from '../../context/TenantContext';
import { 
  GitFork, 
  Plus, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  Layers, 
  Sliders, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

export const InterviewRoundsConfig: React.FC = () => {
  const { currentCompany } = useTenant();
  const [rounds, setRounds] = useState<InterviewRound[]>(AppDataStore.getRounds());
  const questions = AppDataStore.getQuestions();
  const [showAddModal, setShowAddModal] = useState(false);

  // New Round Form
  const [name, setName] = useState('');
  const [type, setType] = useState<RoundType>('TECHNICAL_ROBOTICS');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [passingScore, setPassingScore] = useState(70);
  const [proctoringStrictness, setProctoringStrictness] = useState<'STANDARD' | 'STRICT' | 'MILITARY_GRADE'>('MILITARY_GRADE');

  const filteredRounds = rounds.filter(r => 
    !currentCompany || r.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
  );

  const handleCreateRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const newRound: InterviewRound = {
      id: `rnd_${Date.now()}`,
      companyId: currentCompany.id,
      jobId: 'job_cyber_01',
      name,
      roundNumber: filteredRounds.length + 1,
      type,
      timeLimitMinutes,
      questionIds: ['q_rob_01', 'q_rob_02', 'q_rob_03', 'q_hr_01'],
      passingScore,
      allowRetake: false,
      proctoringStrictness,
    };

    const all = AppDataStore.getRounds();
    AppDataStore.saveRounds([newRound, ...all]);
    setRounds([newRound, ...rounds]);
    setShowAddModal(false);
    setName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Interview Rounds & Proctoring</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-stage AI interview rounds, question sequences, passing score thresholds, and proctoring strictness.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Configure New Round</span>
        </button>
      </div>

      {/* Rounds List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRounds.map(rnd => (
          <div
            key={rnd.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                  Stage {rnd.roundNumber}: {rnd.type.replace(/_/g, ' ')}
                </span>
                <h2 className="text-sm font-bold text-white mt-1.5">{rnd.name}</h2>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {rnd.proctoringStrictness.replace('_', ' ')} PROCTOR
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Duration Limit</div>
                <div className="font-bold text-white">{rnd.timeLimitMinutes} Mins</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Questions</div>
                <div className="font-bold text-cyan-400">{rnd.questionIds.length} Assigned</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Passing Cutoff</div>
                <div className="font-bold text-emerald-400">{rnd.passingScore}%</div>
              </div>
            </div>

            {/* Assigned Questions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Question Sequence</div>
              <div className="space-y-1">
                {rnd.questionIds.map((qid, i) => {
                  const q = questions.find(item => item.id === qid);
                  return (
                    <div key={i} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-bold text-cyan-400 font-mono">Q{i + 1}</span>
                        <span className="text-slate-300 truncate">{q?.title || qid}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{q?.category.split('_')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Round Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Configure New Interview Stage</h2>
            <form onSubmit={handleCreateRound} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Round Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Round 2: Kinematics & Real-Time Trajectory Planning"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Round Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as RoundType)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="TECHNICAL_ROBOTICS">Technical Robotics</option>
                    <option value="AI_SCREENING">AI Screening</option>
                    <option value="SOFTWARE_SYSTEMS">Software Systems</option>
                    <option value="HR_BEHAVIORAL">HR & Behavioral (STAR)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Proctoring Level</label>
                  <select
                    value={proctoringStrictness}
                    onChange={(e) => setProctoringStrictness(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="MILITARY_GRADE">Military-Grade (Full AV & Tab Lock)</option>
                    <option value="STRICT">Strict (Video & Audio Check)</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 20)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Passing Score (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Interview Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
