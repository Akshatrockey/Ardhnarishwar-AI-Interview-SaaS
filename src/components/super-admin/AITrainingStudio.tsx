import React, { useState } from 'react';
import { Question, AIEngineHyperparams, QuestionCategory } from '../../types';
import { AppDataStore } from '../../services/storage';
import { evaluateCandidateAnswer } from '../../ai-engine/scoringPipeline';
import { 
  Cpu, 
  Sliders, 
  Database, 
  Sparkles, 
  Plus, 
  Save, 
  Download, 
  Upload, 
  CheckCircle2, 
  Play, 
  Bot, 
  Trash2,
  FileCode
} from 'lucide-react';

export const AITrainingStudio: React.FC = () => {
  const [hyperparams, setHyperparams] = useState<AIEngineHyperparams>(AppDataStore.getHyperparams());
  const [questions, setQuestions] = useState<Question[]>(AppDataStore.getQuestions());
  const [selectedQuestion, setSelectedQuestion] = useState<Question>(questions[0]);
  const [sandboxAnswer, setSandboxAnswer] = useState<string>('');
  const [sandboxDurationSec, setSandboxDurationSec] = useState<number>(90);
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Question Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionCategory>('ROBOTICS_HARDWARE');
  const [newRoleCategory, setNewRoleCategory] = useState('Robotics Engineer');
  const [newPrompt, setNewPrompt] = useState('');
  const [newIdealAnswer, setNewIdealAnswer] = useState('');
  const [newConceptsStr, setNewConceptsStr] = useState('');

  const handleSaveHyperparams = () => {
    AppDataStore.saveHyperparams(hyperparams);
    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'AI_HYPERPARAMS_TUNED',
      resource: 'Core-AI Engine Config',
      details: `Updated semantic threshold to ${hyperparams.semanticThreshold}, filler penalty to ${hyperparams.fillerWordPenalization}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRunSandbox = () => {
    if (!sandboxAnswer.trim() || !selectedQuestion) return;
    const result = evaluateCandidateAnswer(
      sandboxAnswer,
      selectedQuestion,
      sandboxDurationSec,
      hyperparams
    );
    setSandboxResult(result);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      title: newTitle,
      category: newCategory,
      roleCategory: newRoleCategory,
      difficulty: 'MEDIUM',
      prompt: newPrompt,
      expectedDurationSec: 100,
      idealBenchmarkAnswer: newIdealAnswer,
      keyConcepts: newConceptsStr.split(',').map(s => s.trim()).filter(Boolean),
      antiPatterns: [],
      rubric: {
        relevanceWeight: 0.25,
        technicalWeight: 0.4,
        communicationWeight: 0.15,
        problemSolvingWeight: 0.15,
        confidenceWeight: 0.05,
      },
      isGlobal: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQ, ...questions];
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    setSelectedQuestion(newQ);
    setShowAddModal(false);

    // Reset fields
    setNewTitle('');
    setNewPrompt('');
    setNewIdealAnswer('');
    setNewConceptsStr('');
  };

  const exportDataset = () => {
    const dataStr = JSON.stringify({ hyperparams, questions }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ardhnarishwar_ai_training_dataset_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-cyan-900/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            ARDHNARISHWAR PROPRIETARY CORE-AI
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Training Studio & Dataset Tuning</h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Maintain your internal semantic ontology, ideal benchmark answers, and rubric hyperparameter weights. Completely independent of external paid API keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportDataset}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Benchmark Question</span>
          </button>
        </div>
      </div>

      {/* Grid: Hyperparameters & Live Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hyperparameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Scoring Engine Hyperparameters
              </h2>
              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            {/* Slider 1: Semantic Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Semantic Cosine Threshold</span>
                <span className="font-mono text-cyan-400 font-bold">{hyperparams.semanticThreshold}</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={hyperparams.semanticThreshold}
                onChange={(e) => setHyperparams({ ...hyperparams, semanticThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Minimum TF-IDF vector similarity required for full relevance marks.</p>
            </div>

            {/* Slider 2: Filler Word Penalization */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Filler Word Penalization</span>
                <span className="font-mono text-indigo-400 font-bold">{hyperparams.fillerWordPenalization}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.2"
                step="0.01"
                value={hyperparams.fillerWordPenalization}
                onChange={(e) => setHyperparams({ ...hyperparams, fillerWordPenalization: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Deduction factor applied for verbal fillers (um, like, basically).</p>
            </div>

            {/* Slider 3: Concept Density Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Concept Graph Density Multiplier</span>
                <span className="font-mono text-emerald-400 font-bold">{hyperparams.conceptDensityMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                value={hyperparams.conceptDensityMultiplier}
                onChange={(e) => setHyperparams({ ...hyperparams, conceptDensityMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Boosts technical scoring when candidates reference domain concepts.</p>
            </div>

            {/* Slider 4: STAR Strictness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">STAR Method Strictness</span>
                <span className="font-mono text-purple-400 font-bold">{hyperparams.starMethodStrictness}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={hyperparams.starMethodStrictness}
                onChange={(e) => setHyperparams({ ...hyperparams, starMethodStrictness: parseFloat(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Enforces presence of Situation, Task, Action, and Quantifiable Results.</p>
            </div>

            <button
              onClick={handleSaveHyperparams}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply & Save Hyperparameters</span>
            </button>
          </div>

          {/* Question Bank Quick Selector */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Active Benchmark Questions ({questions.length})
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {questions.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedQuestion.id === q.id 
                      ? 'bg-cyan-950 border border-cyan-800 text-cyan-300 font-semibold' 
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[220px]">{q.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {q.category.split('_')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live AI Evaluation Sandbox */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Live Model Evaluation Sandbox
              </h2>
              <span className="text-[11px] font-mono text-cyan-400">
                Target: {selectedQuestion?.title}
              </span>
            </div>

            {/* Selected Question Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-200">Question Prompt:</div>
              <p className="text-xs text-slate-300 italic leading-relaxed">"{selectedQuestion?.prompt}"</p>

              <div className="pt-2 text-xs font-bold text-slate-200">Mandatory Key Concepts:</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedQuestion?.keyConcepts.map((c, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Sandbox Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Candidate Answer Transcript</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Response Duration:</span>
                  <input
                    type="number"
                    value={sandboxDurationSec}
                    onChange={(e) => setSandboxDurationSec(parseInt(e.target.value) || 60)}
                    className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-cyan-400 font-mono text-center"
                  />
                  <span className="text-slate-400">sec</span>
                </div>
              </div>

              <textarea
                value={sandboxAnswer}
                onChange={(e) => setSandboxAnswer(e.target.value)}
                placeholder="Type or paste candidate response transcript to execute in-house NLP vectorizer, semantic matcher, and real-time scoring..."
                rows={5}
                className="w-full text-xs p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleRunSandbox}
              disabled={!sandboxAnswer.trim()}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Execute In-House AI Evaluation</span>
            </button>

            {/* Sandbox Evaluation Output */}
            {sandboxResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/60 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-300">Evaluation Score Output</span>
                  <span className="text-xl font-extrabold text-cyan-400 font-mono">{sandboxResult.score}/100</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900">
                    <div className="text-[10px] text-slate-400">Relevance</div>
                    <div className="font-bold text-cyan-400">{sandboxResult.dimensionScores.relevance}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900">
                    <div className="text-[10px] text-slate-400">Technical Depth</div>
                    <div className="font-bold text-indigo-400">{sandboxResult.dimensionScores.technicalDepth}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900">
                    <div className="text-[10px] text-slate-400">Communication</div>
                    <div className="font-bold text-emerald-400">{sandboxResult.dimensionScores.communication}%</div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-300">AI Feedback:</div>
                  <p className="text-slate-400 leading-relaxed bg-slate-900 p-2.5 rounded-lg">
                    {sandboxResult.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Benchmark Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Add Global Benchmark Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Question Title</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SLAM Loop Closure & Pose Graph Optimization"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="ROBOTICS_HARDWARE">Robotics Hardware</option>
                    <option value="TECHNICAL">Technical Systems</option>
                    <option value="CONTROL_SYSTEMS">Control Systems</option>
                    <option value="EMBEDDED_C_CPP">Embedded C++</option>
                    <option value="BEHAVIORAL">Behavioral (STAR)</option>
                    <option value="HR">HR / Culture</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Role Target</label>
                  <input
                    value={newRoleCategory}
                    onChange={(e) => setNewRoleCategory(e.target.value)}
                    placeholder="e.g. Autonomous Navigation Engineer"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Question Prompt for Candidate</label>
                <textarea
                  required
                  rows={3}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Describe the exact question the AI interviewer will ask..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Ideal Benchmark Answer (Ground Truth)</label>
                <textarea
                  required
                  rows={3}
                  value={newIdealAnswer}
                  onChange={(e) => setNewIdealAnswer(e.target.value)}
                  placeholder="Comprehensive technical answer for semantic TF-IDF vectorization..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Mandatory Key Concepts (Comma separated)</label>
                <input
                  required
                  value={newConceptsStr}
                  onChange={(e) => setNewConceptsStr(e.target.value)}
                  placeholder="e.g. Loop closure, Pose graph, Mahalanobis distance, g2o solver"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
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
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
