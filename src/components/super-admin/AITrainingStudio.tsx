import React, { useState } from 'react';
import { Question, QuestionCategory, DifficultyLevel, CandidateAnswer, AIEngineHyperparams } from '../../types';
import { evaluateCandidateAnswer, DEFAULT_AI_HYPERPARAMS } from '../../ai-engine/scoringPipeline';
import { AppDataStore } from '../../services/storage';
import { 
  Sliders, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  Activity, 
  Sparkles, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Layers, 
  Clock, 
  HelpCircle,
  Award,
  ListChecks,
  FileCheck
} from 'lucide-react';

const QUESTION_PRESETS: {
  label: string;
  title: string;
  category: QuestionCategory;
  roleCategory: string;
  questionType: string;
  difficulty: DifficultyLevel;
  duration: number;
  maxScore: number;
  prompt: string;
  expectedAnswer: string;
  evaluationCriteria: string;
  concepts: string;
}[] = [
  {
    label: 'SLAM & Pose Graph (Robotics)',
    title: 'Visual SLAM & Loop Closure Optimization',
    category: 'ROBOTICS_HARDWARE',
    roleCategory: 'Autonomous Navigation Engineer',
    questionType: 'TECHNICAL',
    difficulty: 'HARD',
    duration: 120,
    maxScore: 10,
    prompt: 'Explain how you detect loop closures in visual SLAM systems and optimize the global pose graph using factor graphs to mitigate drift.',
    expectedAnswer: 'Visual loop closure uses DBoW2/DBoW3 bag-of-words or NetVLAD embeddings for candidate identification, followed by RANSAC 3D-to-2D PnP geometric verification. Once confirmed, the loop constraint is added to a GTSAM/g2o pose graph solver utilizing Levenberg-Marquardt optimization with Huber robust loss kernels.',
    evaluationCriteria: 'Understands visual loop closure candidate detection (DBoW / NetVLAD)\nExplains geometric verification using RANSAC PnP\nDescribes pose graph factor optimization via Levenberg-Marquardt in GTSAM or g2o',
    concepts: 'Loop closure, Pose graph, Factor graphs, DBoW2, GTSAM, g2o, Mahalanobis distance, Robust loss kernels'
  },
  {
    label: 'Embedded C++ & FreeRTOS',
    title: 'Real-Time Motor Control & Deterministic Scheduling',
    category: 'EMBEDDED_C_CPP',
    roleCategory: 'Embedded Robotics Systems Engineer',
    questionType: 'CODING',
    difficulty: 'HARD',
    duration: 110,
    maxScore: 10,
    prompt: 'Describe your approach to designing a zero-latency, hard real-time motor controller using FreeRTOS tasks, DMA, and CAN bus peripherals without priority inversion.',
    expectedAnswer: 'The system utilizes FreeRTOS preemptive priority scheduling with dedicated highest-priority ISRs servicing ADC/encoder timer capture via DMA. Inter-task communications use lock-free circular ring buffers and Priority Inheritance Mutexes to completely eliminate priority inversion on the shared CAN bus driver.',
    evaluationCriteria: 'Explains preemptive priority task scheduling in FreeRTOS\nDescribes lock-free ring buffer communication between ISR and control task\nIdentifies priority inversion prevention mechanisms (Priority Inheritance Mutexes)',
    concepts: 'FreeRTOS, DMA, CAN bus, Priority inheritance, Ring buffer, ISR, Deterministic timing, Field Oriented Control'
  },
  {
    label: 'Behavioral STAR Matrix',
    title: 'High-Stakes Technical Conflict & Architectural Trade-off',
    category: 'BEHAVIORAL',
    roleCategory: 'Lead Systems Architect',
    questionType: 'BEHAVIORAL',
    difficulty: 'MEDIUM',
    duration: 90,
    maxScore: 10,
    prompt: 'Tell me about a time when your team disagreed on a critical architectural choice right before a production deadline. How did you resolve it using data?',
    expectedAnswer: 'In our previous autonomous delivery deployment, the team was divided between LiDAR-first vs pure-vision perception. I set up an automated benchmark matrix comparing mAP, latency, and thermal footprint on identical edge hardware. Data showed LiDAR was required for low-light compliance, achieving consensus and delivering 2 weeks early.',
    evaluationCriteria: 'Demonstrates clear STAR structure (Situation, Task, Action, Result)\nUtilizes objective empirical benchmarking rather than subjective arguments\nShows constructive collaboration and documented architecture alignment',
    concepts: 'Situation, Task, Action, Result, Architectural trade-off, Benchmark matrix, Data-driven consensus'
  },
  {
    label: 'Distributed AI Inference',
    title: 'Low-Latency TensorRT Model Quantization & Batching',
    category: 'TECHNICAL',
    roleCategory: 'AI / Machine Learning Engineer',
    questionType: 'SYSTEM_DESIGN',
    difficulty: 'HARD',
    duration: 100,
    maxScore: 10,
    prompt: 'How do you optimize deep learning perception models for sub-10ms inference on embedded Nvidia Jetson GPUs using TensorRT and INT8 calibration?',
    expectedAnswer: 'We perform Post-Training Quantization (PTQ) or Quantization-Aware Training (QAT) with entropy calibrators to quantize FP32/FP16 weights into INT8 while preserving mAP within 1%. Layer fusion, CUDA graph capture, and zero-copy shared memory queues ensure sub-10ms end-to-end pipeline latency.',
    evaluationCriteria: 'Explains INT8 Post-Training Quantization (PTQ) / Calibration process\nDescribes layer fusion and kernel auto-tuning in TensorRT\nUnderstands memory optimizations (zero-copy unified memory, CUDA streams)',
    concepts: 'TensorRT, INT8 quantization, Layer fusion, CUDA graphs, PTQ, QAT, Jetson Orin, Latency profiling'
  }
];

export const AITrainingStudio: React.FC = () => {
  const [hyperparams, setHyperparams] = useState<AIEngineHyperparams>(AppDataStore.getHyperparams());
  const [questions, setQuestions] = useState<Question[]>(AppDataStore.getQuestions());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(() => {
    const qs = AppDataStore.getQuestions();
    return qs.length > 0 ? qs[0] : null;
  });

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Interactive Sandbox state
  const [sandboxAnswer, setSandboxAnswer] = useState<string>(
    'Forward kinematics calculates the Cartesian pose of the end-effector from joint angles using Denavit-Hartenberg matrices. Inverse kinematics calculates joint angles for a target pose. Singularities happen when the Jacobian matrix determinant approaches zero. We avoid them using Damped Least Squares Levenberg-Marquardt regularization and manipulability index tracking.'
  );
  const [sandboxDurationSec, setSandboxDurationSec] = useState<number>(30);
  const [sandboxResult, setSandboxResult] = useState<CandidateAnswer | null>(null);

  // Modals & Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Form State (for both Add and Edit)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<QuestionCategory>('ROBOTICS_HARDWARE');
  const [formRoleCategory, setFormRoleCategory] = useState('Robotics Engineer');
  const [formQuestionType, setFormQuestionType] = useState('TECHNICAL');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [formDuration, setFormDuration] = useState<number>(90);
  const [formMaxScore, setFormMaxScore] = useState<number>(10);
  const [formPrompt, setFormPrompt] = useState('');
  const [formExpectedAnswer, setFormExpectedAnswer] = useState('');
  const [formCriteriaStr, setFormCriteriaStr] = useState('');
  const [formConceptsStr, setFormConceptsStr] = useState('');

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  };

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
    showToast('Scoring Engine Hyperparameters saved & applied globally!', 'success');
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

  // Open Create Modal (Clean or Preset)
  const openAddModalWithPreset = (preset?: typeof QUESTION_PRESETS[0]) => {
    if (preset) {
      setFormTitle(preset.title);
      setFormCategory(preset.category);
      setFormRoleCategory(preset.roleCategory);
      setFormQuestionType(preset.questionType);
      setFormDifficulty(preset.difficulty);
      setFormDuration(preset.duration);
      setFormMaxScore(preset.maxScore);
      setFormPrompt(preset.prompt);
      setFormExpectedAnswer(preset.expectedAnswer);
      setFormCriteriaStr(preset.evaluationCriteria);
      setFormConceptsStr(preset.concepts);
    } else {
      setFormTitle('');
      setFormCategory('ROBOTICS_HARDWARE');
      setFormRoleCategory('Robotics Perception Engineer');
      setFormQuestionType('TECHNICAL');
      setFormDifficulty('MEDIUM');
      setFormDuration(90);
      setFormMaxScore(10);
      setFormPrompt('');
      setFormExpectedAnswer('');
      setFormCriteriaStr('');
      setFormConceptsStr('');
    }
    setEditingQuestionId(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (q: Question) => {
    setEditingQuestionId(q.id);
    setFormTitle(q.title);
    setFormCategory(q.category);
    setFormRoleCategory(q.roleCategory);
    setFormQuestionType(q.questionType || 'TECHNICAL');
    setFormDifficulty(q.difficulty);
    setFormDuration(q.expectedDurationSec);
    setFormMaxScore(q.maxScore || 10);
    setFormPrompt(q.prompt);
    setFormExpectedAnswer(q.expectedAnswer || q.idealBenchmarkAnswer);
    setFormCriteriaStr((q.evaluationCriteria || []).join('\n'));
    setFormConceptsStr(q.keyConcepts.join(', '));
    setShowEditModal(true);
  };

  // Clone Question
  const handleCloneQuestion = (q: Question) => {
    const cloned: Question = {
      ...q,
      id: `q_clone_${Date.now()}`,
      title: `${q.title} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    const updated = [cloned, ...questions];
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    setSelectedQuestion(cloned);
    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'QUESTION_CLONED',
      resource: `Question: ${cloned.title}`,
      details: `Duplicated question ${q.id} into ${cloned.id}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });
    showToast(`Duplicated question as "${cloned.title}"`, 'info');
  };

  // Save New Question with REQUIRED Validations
  const handleSaveNewQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrompt.trim()) {
      showToast('Question Title and Prompt are required.', 'danger');
      return;
    }
    if (!formExpectedAnswer.trim()) {
      showToast('Expected Answer / Correct Answer is mandatory for automatic AI evaluation!', 'danger');
      return;
    }
    if (!formCriteriaStr.trim()) {
      showToast('Evaluation Criteria is mandatory!', 'danger');
      return;
    }

    const criteriaList = formCriteriaStr
      .split('\n')
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      roleCategory: formRoleCategory.trim() || 'Robotics Engineer',
      questionType: formQuestionType,
      difficulty: formDifficulty,
      prompt: formPrompt.trim(),
      expectedDurationSec: Number(formDuration) || 90,
      expectedAnswer: formExpectedAnswer.trim(),
      idealBenchmarkAnswer: formExpectedAnswer.trim(),
      evaluationCriteria: criteriaList.length > 0 ? criteriaList : ['Accurately addresses the core prompt question'],
      keyConcepts: formConceptsStr.split(',').map(s => s.trim()).filter(Boolean),
      antiPatterns: [],
      maxScore: Number(formMaxScore) || 10,
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

    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'QUESTION_CREATED',
      resource: `Question: ${newQ.title}`,
      details: `Created new benchmark question with Expected Answer (${newQ.maxScore} marks)`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    showToast(`Benchmark question "${newQ.title}" saved!`, 'success');
  };

  // Save Edited Question with REQUIRED Validations
  const handleSaveEditedQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;

    if (!formExpectedAnswer.trim()) {
      showToast('Expected Answer / Correct Answer is required!', 'danger');
      return;
    }
    if (!formCriteriaStr.trim()) {
      showToast('Evaluation Criteria is required!', 'danger');
      return;
    }

    const criteriaList = formCriteriaStr
      .split('\n')
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    const updated = questions.map(q => {
      if (q.id === editingQuestionId) {
        return {
          ...q,
          title: formTitle.trim(),
          category: formCategory,
          roleCategory: formRoleCategory.trim(),
          questionType: formQuestionType,
          difficulty: formDifficulty,
          expectedDurationSec: Number(formDuration) || 90,
          maxScore: Number(formMaxScore) || 10,
          prompt: formPrompt.trim(),
          expectedAnswer: formExpectedAnswer.trim(),
          idealBenchmarkAnswer: formExpectedAnswer.trim(),
          evaluationCriteria: criteriaList,
          keyConcepts: formConceptsStr.split(',').map(s => s.trim()).filter(Boolean),
        };
      }
      return q;
    });

    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    const updatedSelected = updated.find(q => q.id === editingQuestionId) || null;
    setSelectedQuestion(updatedSelected);
    setShowEditModal(false);
    setEditingQuestionId(null);

    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'QUESTION_UPDATED',
      resource: `Question ID: ${editingQuestionId}`,
      details: `Updated benchmark details & criteria for ${formTitle}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    showToast('Question and evaluation criteria updated!', 'success');
  };

  // Delete Question Handler
  const confirmDeleteQuestion = () => {
    if (!questionToDelete) return;

    const remaining = questions.filter(q => q.id !== questionToDelete.id);
    AppDataStore.saveQuestions(remaining);
    setQuestions(remaining);

    if (selectedQuestion?.id === questionToDelete.id) {
      setSelectedQuestion(remaining.length > 0 ? remaining[0] : null);
      setSandboxResult(null);
    }

    AppDataStore.logActivity({
      actorId: 'usr_super_admin',
      actorName: 'Ardhnarishwar Super Admin',
      actorRole: 'SUPER_ADMIN',
      action: 'QUESTION_DELETED',
      resource: `Question: ${questionToDelete.title}`,
      details: `Super Admin deleted benchmark question ID ${questionToDelete.id}`,
      ipAddress: '127.0.0.1',
      severity: 'WARNING',
    });

    showToast(`Deleted question "${questionToDelete.title}"`, 'danger');
    setQuestionToDelete(null);
  };

  // Reset to Enterprise Factory Defaults
  const handleResetToDefaults = () => {
    AppDataStore.resetToDefault();
    const freshQuestions = AppDataStore.getQuestions();
    setQuestions(freshQuestions);
    setSelectedQuestion(freshQuestions[0]);
    setHyperparams(AppDataStore.getHyperparams());
    setShowResetConfirmModal(false);
    showToast('All benchmark questions restored to enterprise defaults.', 'info');
  };

  // Filtered Questions
  const filteredQuestions = questions.filter(q => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      q.title.toLowerCase().includes(term) ||
      q.prompt.toLowerCase().includes(term) ||
      q.roleCategory.toLowerCase().includes(term) ||
      q.keyConcepts.some(c => c.toLowerCase().includes(term));

    const matchesCat = selectedCategoryFilter === 'ALL' || q.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 border ${
          toastMessage.type === 'success' 
            ? 'bg-cyan-950/95 border-cyan-700 text-cyan-200' 
            : toastMessage.type === 'danger'
            ? 'bg-rose-950/95 border-rose-700 text-rose-200'
            : 'bg-indigo-950/95 border-indigo-700 text-indigo-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">AI Training Studio & Question Management</h1>
              <p className="text-xs text-slate-400">
                Define Expected Answers & Evaluation Criteria for deterministic automated evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => openAddModalWithPreset()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Predefined Question</span>
          </button>
        </div>
      </div>

      {/* Quick Template Presets Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Question Authoring Presets (Quick Start):</span>
          </span>
          <span className="text-[11px] text-slate-500">Auto-populates Expected Answers and Evaluation Criteria</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {QUESTION_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => openAddModalWithPreset(preset)}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-700/60 text-left transition-all group"
            >
              <div className="text-[11px] font-bold text-cyan-400 group-hover:text-cyan-300 truncate">
                + {preset.label}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {preset.title} ({preset.maxScore} marks)
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Hyperparameters & Question Bank Manager */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Question Bank Manager & Selector with DELETE support */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Benchmark Questions ({questions.length})
              </h3>
              <button
                onClick={() => openAddModalWithPreset()}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions, concepts, roles..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                {['ALL', 'ROBOTICS_HARDWARE', 'TECHNICAL', 'EMBEDDED_C_CPP', 'BEHAVIORAL', 'HR'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategoryFilter === cat
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat.split('_')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  No questions match your filter.
                </div>
              ) : (
                filteredQuestions.map(q => {
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      className={`group w-full p-2.5 rounded-2xl text-xs flex items-center justify-between gap-2 transition-all border ${
                        isSelected 
                          ? 'bg-cyan-950/70 border-cyan-700/80 text-cyan-200 shadow-md shadow-cyan-950/40' 
                          : 'bg-slate-950/80 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setSandboxResult(null);
                        }}
                        className="flex-1 text-left truncate flex items-center gap-2"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                        <span className="truncate font-semibold max-w-[170px]">{q.title}</span>
                      </button>

                      {/* Item Quick Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                          {q.maxScore || 10} pts
                        </span>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(q); }}
                          title="Edit Question & Expected Answer"
                          className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleCloneQuestion(q); }}
                          title="Clone / Duplicate"
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); setQuestionToDelete(q); }}
                          title="Delete Question"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hyperparameters Controls */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Scoring Engine Hyperparameters
            </h3>

            {/* Slider 1: Semantic Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Semantic Cosine Threshold</span>
                <span className="font-mono text-cyan-400 font-bold">{hyperparams.semanticThreshold}</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={hyperparams.semanticThreshold}
                onChange={(e) => setHyperparams({ ...hyperparams, semanticThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">Threshold required for full semantic alignment against Expected Answer.</p>
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

            <button
              onClick={handleSaveHyperparams}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply & Save Hyperparameters</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Question Workspace & Sandbox */}
        <div className="lg:col-span-7 space-y-5">
          {selectedQuestion ? (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              
              {/* Question Header & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {selectedQuestion.category.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      Max: {selectedQuestion.maxScore || 10} marks
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      {selectedQuestion.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> {selectedQuestion.expectedDurationSec}s
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-1.5">{selectedQuestion.title}</h2>
                  <p className="text-xs text-slate-400">{selectedQuestion.roleCategory}</p>
                </div>

                {/* Question Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedQuestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleCloneQuestion(selectedQuestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    onClick={() => setQuestionToDelete(selectedQuestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Question Details & Predefined Expected Answer Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Candidate Prompt (What AI Asks):</div>
                  <p className="text-xs text-slate-200 mt-1 italic leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    "{selectedQuestion.prompt}"
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      Predefined Expected Answer (Ground Truth):
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Hidden from candidate</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    {selectedQuestion.expectedAnswer || selectedQuestion.idealBenchmarkAnswer}
                  </p>
                </div>

                {/* Predefined Evaluation Criteria */}
                {selectedQuestion.evaluationCriteria && selectedQuestion.evaluationCriteria.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5" />
                      Predefined Evaluation Criteria ({selectedQuestion.evaluationCriteria.length}):
                    </div>
                    <ul className="mt-1.5 space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 text-xs text-slate-300">
                      {selectedQuestion.evaluationCriteria.map((crit, ci) => (
                        <li key={ci} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Important Keywords / Concepts:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedQuestion.keyConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Model Testing Sandbox */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    Test Evaluation Against Predefined Benchmark
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Simulate Candidate Answer</span>
                </div>

                <textarea
                  rows={4}
                  value={sandboxAnswer}
                  onChange={(e) => setSandboxAnswer(e.target.value)}
                  placeholder="Enter sample candidate transcript here to test automated evaluation against this question..."
                  className="w-full text-xs p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Duration:</span>
                    <input
                      type="number"
                      value={sandboxDurationSec}
                      onChange={(e) => setSandboxDurationSec(parseInt(e.target.value) || 30)}
                      className="w-16 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-center font-mono"
                    />
                    <span>seconds</span>
                  </div>

                  <button
                    onClick={handleRunSandbox}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Predefined Evaluation</span>
                  </button>
                </div>

                {/* Evaluation Results Card */}
                {sandboxResult && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-900/60 shadow-xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">Evaluation Result:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sandboxResult.status === 'CORRECT' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                            : sandboxResult.status === 'PARTIALLY_CORRECT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {sandboxResult.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-sm font-black text-cyan-400">
                        {sandboxResult.obtainedScore} / {sandboxResult.maxScore} marks ({sandboxResult.score}%)
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-cyan-400">Evaluation Reason: </span>
                      {sandboxResult.evaluationReason}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Relevance</div>
                        <div className="font-bold text-cyan-400 text-sm">{sandboxResult.dimensionScores.relevance}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Technical Depth</div>
                        <div className="font-bold text-indigo-400 text-sm">{sandboxResult.dimensionScores.technicalDepth}%</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Communication</div>
                        <div className="font-bold text-emerald-400 text-sm">{sandboxResult.dimensionScores.communication}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <Database className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Benchmark Question Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select a question from the left sidebar or create a new one to evaluate and test.
              </p>
              <button
                onClick={() => openAddModalWithPreset()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Create Benchmark Question
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE QUESTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Create New Benchmark Question
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Question Title *</label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. What is an API?"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Question Type *</label>
                  <select
                    value={formQuestionType}
                    onChange={(e) => setFormQuestionType(e.target.value)}
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
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(parseInt(e.target.value) || 10)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold outline-none mt-1 text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Duration (sec)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 90)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Question Prompt (What AI Asks) *</label>
                <textarea
                  required
                  rows={2}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="e.g. What is an API and why is it used in software systems?"
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
                  value={formExpectedAnswer}
                  onChange={(e) => setFormExpectedAnswer(e.target.value)}
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
                  value={formCriteriaStr}
                  onChange={(e) => setFormCriteriaStr(e.target.value)}
                  placeholder="Understands the meaning of API&#10;Knows that API enables communication between systems&#10;Understands the purpose of an API"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-indigo-900/60 focus:border-indigo-500 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Important Keywords / Concepts (Comma separated)</label>
                <input
                  value={formConceptsStr}
                  onChange={(e) => setFormConceptsStr(e.target.value)}
                  placeholder="e.g. Application Programming Interface, communication, endpoints, request, response"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25"
                >
                  Save Benchmark Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUESTION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                Edit Question & Predefined Expected Answer
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Question Title *</label>
                <input
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Question Type *</label>
                  <select
                    value={formQuestionType}
                    onChange={(e) => setFormQuestionType(e.target.value)}
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
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(parseInt(e.target.value) || 10)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold outline-none mt-1 text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Duration (sec)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 90)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Question Prompt for Candidate *</label>
                <textarea
                  required
                  rows={2}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>Expected Answer / Correct Answer * (Required for AI Evaluation)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Predefined benchmark</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formExpectedAnswer}
                  onChange={(e) => setFormExpectedAnswer(e.target.value)}
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
                  value={formCriteriaStr}
                  onChange={(e) => setFormCriteriaStr(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-indigo-900/60 focus:border-indigo-500 text-slate-200 outline-none resize-none mt-1 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Important Keywords / Concepts (Comma separated)</label>
                <input
                  value={formConceptsStr}
                  onChange={(e) => setFormConceptsStr(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25"
                >
                  Update Question & Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-900/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-950 border border-rose-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Benchmark Question?</h3>
                <p className="text-xs text-rose-300">This action will remove the question from the active bank.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white truncate">{questionToDelete.title}</div>
              <div className="text-[11px] text-slate-400 line-clamp-2 italic">"{questionToDelete.prompt}"</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25"
              >
                Yes, Delete Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET TO FACTORY DEFAULTS MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-amber-900/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-950 border border-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Reset Benchmark Questions?</h3>
                <p className="text-xs text-amber-300">Restores all enterprise seed questions and default weights.</p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Any custom questions you created will be replaced by the official enterprise robotics & software questions dataset.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDefaults}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25"
              >
                Yes, Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AITrainingStudio;
