import React, { useState, useEffect } from 'react';
import { JobPosition, ExperienceLevel, Question, QuestionCategory, InterviewRound, JobStatus } from '../../types';
import { AppDataStore } from '../../services/storage';
import { useTenant } from '../../context/TenantContext';
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Layers, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Edit2,
  Trash2,
  Copy,
  BookOpen,
  Sliders,
  DollarSign,
  Calendar,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export const JobManager: React.FC = () => {
  const { currentCompany } = useTenant();
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJobForQuestions, setSelectedJobForQuestions] = useState<JobPosition | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Job Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Software & AI Engineering');
  const [location, setLocation] = useState('San Francisco, CA / Hybrid');
  const [jobType, setJobType] = useState<'FULL_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID'>('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('SENIOR');
  const [salaryRange, setSalaryRange] = useState('$140,000 - $180,000 / Year');
  const [openings, setOpenings] = useState<number>(2);
  const [deadline, setDeadline] = useState<string>('2026-12-31');
  const [passingScore, setPassingScore] = useState<number>(70);
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('');

  // New Question Form State (Predefined Ground Truth)
  const [qTitle, setQTitle] = useState('');
  const [qPrompt, setQPrompt] = useState('');
  const [qType, setQType] = useState<'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'PROBLEM_SOLVING'>('TECHNICAL');
  const [qExpectedAnswer, setQExpectedAnswer] = useState('');
  const [qCriteria, setQCriteria] = useState('');
  const [qKeywords, setQKeywords] = useState('');
  const [qMaxScore, setQMaxScore] = useState<number>(10);
  const [qDifficulty, setQDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [qCategory, setQCategory] = useState<QuestionCategory>('TECHNICAL');

  const refreshData = () => {
    const allJobs = AppDataStore.getJobs().filter(j => 
      !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setJobs(allJobs);
    setQuestions(AppDataStore.getQuestions());
  };

  useEffect(() => {
    refreshData();
  }, [currentCompany]);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const roundId = `rnd_${Date.now()}`;
    const newJob: JobPosition = {
      id: `job_${Date.now()}`,
      companyId: currentCompany.id,
      title,
      department,
      location,
      type: jobType,
      experienceLevel,
      description,
      requiredSkills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
      status: 'DRAFT', // Starts as draft until validated with questions
      createdAt: new Date().toISOString(),
      roundIds: [roundId],
      totalApplicants: 0,
    };

    // Create an initial interview round for this job
    const newRound: InterviewRound = {
      id: roundId,
      companyId: currentCompany.id,
      jobId: newJob.id,
      name: `${title} - AI Technical Assessment`,
      roundNumber: 1,
      type: 'TECHNICAL_ROBOTICS',
      timeLimitMinutes: 30,
      questionIds: [],
      passingScore: passingScore || 70,
      allowRetake: false,
      proctoringStrictness: 'STRICT',
    };

    const allJobs = AppDataStore.getJobs();
    const allRounds = AppDataStore.getRounds();

    AppDataStore.saveJobs([newJob, ...allJobs]);
    AppDataStore.saveRounds([newRound, ...allRounds]);
    setJobs([newJob, ...jobs]);

    AppDataStore.logActivity({
      companyId: currentCompany.id,
      actorId: 'usr_admin',
      actorName: 'Company Administrator',
      actorRole: 'COMPANY_ADMIN',
      action: 'JOB_CREATED',
      resource: `Job: ${title}`,
      details: `Created new draft job opening for ${title} (${department})`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    setShowAddModal(false);
    resetJobForm();
    setSuccessMessage(`Job "${title}" created as Draft! Please link interview questions before publishing.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const resetJobForm = () => {
    setTitle('');
    setDescription('');
    setSkillsStr('');
  };

  // Job Publish Validation
  const handleToggleJobStatus = (job: JobPosition, newStatus: JobStatus) => {
    setValidationError(null);

    if (newStatus === 'OPEN') {
      // Validate that job has linked questions and all questions have predefined expected answers
      const rounds = AppDataStore.getRounds().filter(r => r.jobId === job.id);
      const questionIds = rounds.flatMap(r => r.questionIds);
      const linkedQuestions = questions.filter(q => questionIds.includes(q.id));

      if (linkedQuestions.length === 0) {
        setValidationError(`Cannot publish job "${job.title}". You must add at least 1 interview question with a predefined expected answer.`);
        setTimeout(() => setValidationError(null), 6000);
        return;
      }

      const invalidQuestions = linkedQuestions.filter(q => !q.expectedAnswer || !q.expectedAnswer.trim());
      if (invalidQuestions.length > 0) {
        setValidationError(`Cannot publish job "${job.title}". Question "${invalidQuestions[0].title}" is missing an Expected Answer.`);
        setTimeout(() => setValidationError(null), 6000);
        return;
      }
    }

    const updated = jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j);
    AppDataStore.saveJobs(updated);
    setJobs(updated);
    setSuccessMessage(`Job "${job.title}" status updated to ${newStatus}.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle Save / Edit Question for Job
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForQuestions) return;

    if (!qExpectedAnswer.trim()) {
      setValidationError('Expected Answer / Correct Answer is required.');
      return;
    }

    if (!qCriteria.trim()) {
      setValidationError('Evaluation Criteria is required.');
      return;
    }

    const criteriaList = qCriteria.split('\n').map(s => s.trim()).filter(Boolean);

    const rounds = AppDataStore.getRounds();
    let targetRound = rounds.find(r => r.jobId === selectedJobForQuestions.id);
    if (!targetRound) {
      targetRound = {
        id: `rnd_${Date.now()}`,
        companyId: currentCompany?.id || 'comp_cyberdyne',
        jobId: selectedJobForQuestions.id,
        name: `${selectedJobForQuestions.title} Assessment`,
        roundNumber: 1,
        type: 'TECHNICAL_ROBOTICS',
        timeLimitMinutes: 30,
        questionIds: [],
        passingScore: 70,
        allowRetake: false,
        proctoringStrictness: 'STRICT',
      };
      rounds.push(targetRound);
    }

    if (editingQuestion) {
      const updatedQuestion: Question = {
        ...editingQuestion,
        title: qTitle,
        prompt: qPrompt,
        questionType: qType,
        expectedAnswer: qExpectedAnswer,
        evaluationCriteria: criteriaList,
        keyConcepts: qKeywords.split(',').map(s => s.trim()).filter(Boolean),
        maxScore: Number(qMaxScore) || 10,
        difficulty: qDifficulty,
        category: qCategory,
      };
      const updatedAll = questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q);
      AppDataStore.saveQuestions(updatedAll);
      setQuestions(updatedAll);
    } else {
      const newQuestion: Question = {
        id: `q_${Date.now()}`,
        title: qTitle,
        category: qCategory,
        roleCategory: selectedJobForQuestions.title,
        difficulty: qDifficulty,
        prompt: qPrompt,
        questionType: qType,
        expectedDurationSec: 120,
        expectedAnswer: qExpectedAnswer,
        idealBenchmarkAnswer: qExpectedAnswer,
        evaluationCriteria: criteriaList,
        keyConcepts: qKeywords.split(',').map(s => s.trim()).filter(Boolean),
        maxScore: Number(qMaxScore) || 10,
        antiPatterns: [],
        rubric: {
          relevanceWeight: 0.25,
          technicalWeight: 0.40,
          communicationWeight: 0.15,
          problemSolvingWeight: 0.10,
          confidenceWeight: 0.10,
        },
        isGlobal: false,
        companyId: currentCompany?.id,
        createdAt: new Date().toISOString(),
      };

      const updatedAll = [newQuestion, ...questions];
      targetRound.questionIds.push(newQuestion.id);
      AppDataStore.saveQuestions(updatedAll);
      AppDataStore.saveRounds(rounds);
      setQuestions(updatedAll);
    }

    setShowAddQuestionModal(false);
    setEditingQuestion(null);
    resetQuestionForm();
    setSuccessMessage('Interview question saved with predefined benchmark evaluation criteria.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const resetQuestionForm = () => {
    setQTitle('');
    setQPrompt('');
    setQExpectedAnswer('');
    setQCriteria('');
    setQKeywords('');
    setQMaxScore(10);
    setQDifficulty('MEDIUM');
    setQCategory('TECHNICAL');
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQTitle(q.title);
    setQPrompt(q.prompt);
    setQType((q.questionType as any) || 'TECHNICAL');
    setQExpectedAnswer(q.expectedAnswer || '');
    setQCriteria(Array.isArray(q.evaluationCriteria) ? q.evaluationCriteria.join('\n') : (q.evaluationCriteria || ''));
    setQKeywords((q.keyConcepts || []).join(', '));
    setQMaxScore(q.maxScore || 10);
    setQDifficulty(q.difficulty);
    setQCategory(q.category);
    setShowAddQuestionModal(true);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!selectedJobForQuestions) return;
    const rounds = AppDataStore.getRounds();
    const targetRound = rounds.find(r => r.jobId === selectedJobForQuestions.id);
    if (targetRound) {
      targetRound.questionIds = targetRound.questionIds.filter(id => id !== qId);
      AppDataStore.saveRounds(rounds);
    }
    const updated = questions.filter(q => q.id !== qId);
    AppDataStore.saveQuestions(updated);
    setQuestions(updated);
    setSuccessMessage('Question removed from job question sequence.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDuplicateQuestion = (q: Question) => {
    if (!selectedJobForQuestions) return;
    const duplicated: Question = {
      ...q,
      id: `q_${Date.now()}`,
      title: `${q.title} (Copy)`,
    };
    const updatedAll = [duplicated, ...questions];
    const rounds = AppDataStore.getRounds();
    const targetRound = rounds.find(r => r.jobId === selectedJobForQuestions.id);
    if (targetRound) {
      targetRound.questionIds.push(duplicated.id);
      AppDataStore.saveRounds(rounds);
    }
    AppDataStore.saveQuestions(updatedAll);
    setQuestions(updatedAll);
    setSuccessMessage('Question duplicated successfully.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getJobQuestions = (jobId: string) => {
    const rounds = AppDataStore.getRounds().filter(r => r.jobId === jobId);
    const qIds = rounds.flatMap(r => r.questionIds);
    return questions.filter(q => qIds.includes(q.id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-black text-white">Job Postings & Interview Questions</h1>
          </div>
          <p className="text-xs text-slate-400">
            Define job roles, hiring criteria, and assign predefined benchmark questions and answers for autonomous AI evaluation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </button>
      </div>

      {/* Alerts */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title or department..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Status:</span>
          {['ALL', 'OPEN', 'DRAFT', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => {
          const jobQuestions = getJobQuestions(job.id);
          const hasValidQuestions = jobQuestions.length > 0 && jobQuestions.every(q => q.expectedAnswer && q.expectedAnswer.trim());

          return (
            <div
              key={job.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                      {job.experienceLevel} • {job.type}
                    </span>
                    <h2 className="text-base font-bold text-white mt-1.5 leading-snug">{job.title}</h2>
                    <p className="text-xs text-slate-400">{job.department}</p>
                  </div>

                  <select
                    value={job.status}
                    onChange={(e) => handleToggleJobStatus(job, e.target.value as JobStatus)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono outline-none border cursor-pointer ${
                      job.status === 'OPEN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : job.status === 'DRAFT'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="OPEN">PUBLISHED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Question Link Status Card */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{jobQuestions.length} Interview Questions</span>
                    </span>
                    {hasValidQuestions ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Needs Questions
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedJobForQuestions(job)}
                    className="w-full py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Manage Questions & Answers</span>
                  </button>
                </div>

                {/* Skills Tags */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Required Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.map((sk, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {job.location.split('/')[0]}
                </span>
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {job.totalApplicants || 0} Candidates
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MANAGE QUESTIONS MODAL FOR SELECTED JOB */}
      {selectedJobForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  Predefined Question Studio
                </span>
                <h2 className="text-xl font-black text-white">
                  Questions for: {selectedJobForQuestions.title}
                </h2>
                <p className="text-xs text-slate-400">
                  Define the exact questions, expected answers, and evaluation criteria. The AI will strictly ask these questions and compare candidate responses against your benchmarks.
                </p>
              </div>

              <button
                onClick={() => setSelectedJobForQuestions(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-300 font-bold">
                Assigned Questions: {getJobQuestions(selectedJobForQuestions.id).length}
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setShowAddQuestionModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question to Job</span>
              </button>
            </div>

            {/* Questions Sequence List */}
            <div className="space-y-4">
              {getJobQuestions(selectedJobForQuestions.id).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                          Q{idx + 1}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {q.questionType || 'TECHNICAL'}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                          Max: {q.maxScore || 10} Marks
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {q.difficulty}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white pt-1">{q.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed italic">{q.prompt}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400"
                        title="Edit Question"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400"
                        title="Duplicate Question"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-transparent hover:border-rose-800"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Predefined Expected Answer:</span>
                      </div>
                      <p className="text-slate-300 line-clamp-3 leading-relaxed">
                        {q.expectedAnswer || 'No expected answer defined.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="font-bold text-cyan-400 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Evaluation Criteria:</span>
                      </div>
                      <p className="text-slate-300 line-clamp-3 leading-relaxed">
                        {Array.isArray(q.evaluationCriteria) ? q.evaluationCriteria.join(', ') : (q.evaluationCriteria || 'Key concept coverage and clarity.')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {getJobQuestions(selectedJobForQuestions.id).length === 0 && (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Questions Added Yet</h4>
                  <p className="text-xs text-slate-400">
                    Add the questions you want the AI interviewer to ask for this position.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingQuestion ? 'Edit Interview Question' : 'Add Predefined Interview Question'}
              </h2>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Question Title / Identifier</label>
                <input
                  required
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="e.g. Explain RESTful API Design & Status Codes"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="BEHAVIORAL">Behavioral</option>
                    <option value="SITUATIONAL">Situational</option>
                    <option value="PROBLEM_SOLVING">Problem Solving</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Max Score (Marks)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={qMaxScore}
                    onChange={(e) => setQMaxScore(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Question Prompt (What AI will ask)</label>
                <textarea
                  required
                  rows={3}
                  value={qPrompt}
                  onChange={(e) => setQPrompt(e.target.value)}
                  placeholder="The exact verbal prompt the AI interviewer will deliver to the candidate..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 uppercase">
                  Expected Answer / Correct Answer (Ground Truth) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={qExpectedAnswer}
                  onChange={(e) => setQExpectedAnswer(e.target.value)}
                  placeholder="Define the correct/benchmark answer. The candidate's response will be compared against this predefined text."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-emerald-800/80 text-emerald-200 outline-none resize-none mt-1 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-400 uppercase">
                  Evaluation Criteria & Rubric *
                </label>
                <textarea
                  required
                  rows={3}
                  value={qCriteria}
                  onChange={(e) => setQCriteria(e.target.value)}
                  placeholder="Specify criteria line-by-line (e.g. Must mention HTTP methods, 200 OK vs 404 Not Found, statelessness)..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-cyan-800/80 text-cyan-200 outline-none resize-none mt-1 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Important Keywords / Concepts (Comma separated)</label>
                <input
                  value={qKeywords}
                  onChange={(e) => setQKeywords(e.target.value)}
                  placeholder="e.g. REST, HTTP methods, GET, POST, stateless, 200, 404, idempotency"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30"
                >
                  {editingQuestion ? 'Update Question' : 'Save Question to Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Create New Job Position</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Job Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <input
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. AI Platforms Unit"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Experience Tier</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="ENTRY">Entry Level (0-2 Yrs)</option>
                    <option value="MID">Mid Level (3-5 Yrs)</option>
                    <option value="SENIOR">Senior (5-8 Yrs)</option>
                    <option value="LEAD">Lead / Staff (8+ Yrs)</option>
                    <option value="PRINCIPAL">Principal / Director</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Location & Mode</label>
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote / Hybrid"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Passing Cutoff (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Job Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of the position, scope, and objectives..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Required Skills (Comma separated)</label>
                <input
                  required
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Python, PyTorch, Transformers, LLMs, Docker, FastAPI"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30"
                >
                  Create Draft Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
