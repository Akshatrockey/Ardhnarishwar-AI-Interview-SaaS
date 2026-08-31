import React, { useState } from 'react';
import { Question, QuestionCategory, DifficultyLevel } from '../../types';
import { AppDataStore } from '../../services/storage';
import { 
  Database, 
  Search, 
  Plus, 
  Sparkles, 
  Tag, 
  Layers, 
  Trash2, 
  Edit3, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Clock,
  Award,
  ListChecks,
  FileCheck
} from 'lucide-react';

export const GlobalQuestionBankManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(AppDataStore.getQuestions());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<QuestionCategory>('ROBOTICS_HARDWARE');
  const [roleCategory, setRoleCategory] = useState('Robotics Engineer');
  const [questionType, setQuestionType] = useState('TECHNICAL');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [duration, setDuration] = useState<number>(90);
  const [maxScore, setMaxScore] = useState<number>(10);
  const [prompt, setPrompt] = useState('');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [criteriaStr, setCriteriaStr] = useState('');
  const [conceptsStr, setConceptsStr] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddModal = () => {
    setTitle('');
    setCategory('ROBOTICS_HARDWARE');
    setRoleCategory('Autonomous Perception Engineer');
    setQuestionType('TECHNICAL');
    setDifficulty('MEDIUM');
    setDuration(90);
    setMaxScore(10);
    setPrompt('');
    setExpectedAnswer('');
    setCriteriaStr('');
    setConceptsStr('');
    setEditingId(null);
    setShowAddModal(true);
  };

  const openEditModal = (q: Question) => {
    setEditingId(q.id);
    setTitle(q.title);
    setCategory(q.category);
    setRoleCategory(q.roleCategory);
    setQuestionType(q.questionType || 'TECHNICAL');
    setDifficulty(q.difficulty);
    setDuration(q.expectedDurationSec);
    setMaxScore(q.maxScore || 10);
    setPrompt(q.prompt);
    setExpectedAnswer(q.expectedAnswer || q.idealBenchmarkAnswer);
    setCriteriaStr((q.evaluationCriteria || []).join('\n'));
    setConceptsStr(q.keyConcepts.join(', '));
    setShowEditModal(true);
  };

  const handleClone = (q: Question) => {
    const cloned: Question = {
      ...q,
      id: `q_clone_${Date.now()}`,
      title: `${q.title} (Clone)`,
      createdAt: new Date().toISOString(),
    };
    const updated = [cloned, ...questions];
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    showToast(`Cloned question "${cloned.title}"`);
  };

  const handleDelete = () => {
    if (!questionToDelete) return;
    const updated = questions.filter(q => q.id !== questionToDelete.id);
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'QUESTION_DELETED',
      resource: `Question: ${questionToDelete.title}`,
      details: 'Super Admin deleted benchmark question from Question Bank',
      ipAddress: '127.0.0.1',
      severity: 'WARNING',
    });
    showToast(`Deleted "${questionToDelete.title}"`);
    setQuestionToDelete(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) {
      showToast('Question Title and Prompt are required.');
      return;
    }
    if (!expectedAnswer.trim()) {
      showToast('Expected Answer / Correct Answer is required!');
      return;
    }
    if (!criteriaStr.trim()) {
      showToast('Evaluation Criteria is required!');
      return;
    }

    const criteriaList = criteriaStr
      .split('\n')
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      title: title.trim(),
      category,
      roleCategory: roleCategory.trim() || 'Robotics Engineer',
      questionType,
      difficulty,
      prompt: prompt.trim(),
      expectedDurationSec: Number(duration) || 90,
      expectedAnswer: expectedAnswer.trim(),
      idealBenchmarkAnswer: expectedAnswer.trim(),
      evaluationCriteria: criteriaList.length > 0 ? criteriaList : ['Accurately addresses the core prompt question'],
      keyConcepts: conceptsStr.split(',').map(s => s.trim()).filter(Boolean),
      antiPatterns: [],
      maxScore: Number(maxScore) || 10,
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
    setShowAddModal(false);
    showToast(`Created question "${newQ.title}" (${newQ.maxScore} marks)`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!expectedAnswer.trim()) {
      showToast('Expected Answer / Correct Answer is required!');
      return;
    }
    if (!criteriaStr.trim()) {
      showToast('Evaluation Criteria is required!');
      return;
    }

    const criteriaList = criteriaStr
      .split('\n')
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    const updated = questions.map(q => {
      if (q.id === editingId) {
        return {
          ...q,
          title: title.trim(),
          category,
          roleCategory: roleCategory.trim(),
          questionType,
          difficulty,
          expectedDurationSec: Number(duration) || 90,
          maxScore: Number(maxScore) || 10,
          prompt: prompt.trim(),
          expectedAnswer: expectedAnswer.trim(),
          idealBenchmarkAnswer: expectedAnswer.trim(),
          evaluationCriteria: criteriaList,
          keyConcepts: conceptsStr.split(',').map(s => s.trim()).filter(Boolean),
        };
      }
      return q;
    });
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    setShowEditModal(false);
    showToast(`Updated "${title}"`);
  };

  const filtered = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.roleCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.keyConcepts.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === 'ALL' || q.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl bg-cyan-950/95 border border-cyan-700 text-cyan-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Global Question Bank & Benchmarks</h1>
            <p className="text-xs text-slate-400">
              Enterprise questions with predefined Expected Answers & Evaluation Criteria ({questions.length} Total).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Predefined Question</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by concept, title, role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          {['ALL', 'ROBOTICS_HARDWARE', 'TECHNICAL', 'CONTROL_SYSTEMS', 'EMBEDDED_C_CPP', 'BEHAVIORAL', 'HR'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {cat.split('_')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(q => (
          <div
            key={q.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                      {q.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      Max: {q.maxScore || 10} pts
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      {q.difficulty}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white mt-1.5">{q.title}</h2>
                  <p className="text-[11px] text-slate-400">{q.roleCategory}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                    title="Edit Question & Expected Answer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleClone(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                    title="Duplicate Question"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQuestionToDelete(q)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Candidate Prompt */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Candidate Prompt:</div>
                <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 leading-relaxed italic">
                  "{q.prompt}"
                </p>
              </div>

              {/* Expected Answer Preview */}
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileCheck className="w-3 h-3" />
                  Expected Answer:
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-emerald-950/50 leading-relaxed line-clamp-3">
                  {q.expectedAnswer || q.idealBenchmarkAnswer}
                </p>
              </div>

              {/* Criteria count and key concepts */}
              {q.evaluationCriteria && q.evaluationCriteria.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
                    <ListChecks className="w-3 h-3" />
                    Evaluation Criteria ({q.evaluationCriteria.length} Points)
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 pl-3 list-disc">
                    {q.evaluationCriteria.slice(0, 2).map((crit, idx) => (
                      <li key={idx} className="truncate">{crit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Concepts */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Keywords ({q.keyConcepts.length})</div>
                <div className="flex flex-wrap gap-1">
                  {q.keyConcepts.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> {q.expectedDurationSec}s
              </span>
              <span className="font-mono text-cyan-400 font-bold">Ground Truth Predefined</span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODALS */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                {showAddModal ? 'Create Predefined Benchmark Question' : 'Edit Predefined Question & Benchmark'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Question Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. What is an API?"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300">Question Type *</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="CONCEPTUAL">Conceptual</option>
                    <option value="CODING">Coding</option>
                    <option value="SYSTEM_DESIGN">System Design</option>
                    <option value="HR">HR / Culture</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Max Score (Marks) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || 10)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold outline-none mt-1 text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Duration (s)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Role Target</label>
                <input
                  value={roleCategory}
                  onChange={(e) => setRoleCategory(e.target.value)}
                  placeholder="e.g. Software Engineer / Robotics Specialist"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Question Prompt (What AI Asks) *</label>
                <textarea
                  required
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="The exact question the candidate will hear/read..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>Expected Answer / Correct Answer * (Required for AI Evaluation)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Predefined ground truth</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={expectedAnswer}
                  onChange={(e) => setExpectedAnswer(e.target.value)}
                  placeholder="e.g. An API is an Application Programming Interface that allows different software applications or systems to communicate with each other..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-emerald-900/60 focus:border-emerald-500 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                  <span>Evaluation Criteria * (Required - Enter each criterion on a new line)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Scoring rubric points</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={criteriaStr}
                  onChange={(e) => setCriteriaStr(e.target.value)}
                  placeholder="Understands the meaning of API&#10;Knows that API enables communication between systems&#10;Understands the purpose of an API"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-indigo-900/60 focus:border-indigo-500 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Important Keywords (Comma separated)</label>
                <input
                  value={conceptsStr}
                  onChange={(e) => setConceptsStr(e.target.value)}
                  placeholder="e.g. Application Programming Interface, communication, systems, protocols"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25"
                >
                  {showAddModal ? 'Save Predefined Question' : 'Update Predefined Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Question?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <strong>"{questionToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GlobalQuestionBankManager;
