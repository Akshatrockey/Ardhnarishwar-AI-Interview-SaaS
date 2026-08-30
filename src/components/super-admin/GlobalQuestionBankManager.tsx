import React, { useState } from 'react';
import { Question, QuestionCategory } from '../../types';
import { AppDataStore } from '../../services/storage';
import { Database, Search, Plus, Sparkles, Tag, Layers, Trash2 } from 'lucide-react';

export const GlobalQuestionBankManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(AppDataStore.getQuestions());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.roleCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || q.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Global Robotics & Tech Question Bank</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Curated ground-truth interview questions with ideal benchmark answers and key concept vectors.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total: <strong className="text-white">{questions.length} Questions</strong>
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
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          {['ALL', 'ROBOTICS_HARDWARE', 'TECHNICAL', 'CONTROL_SYSTEMS', 'EMBEDDED_C_CPP', 'BEHAVIORAL', 'HR'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
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
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {q.category.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-sm font-bold text-white mt-1.5">{q.title}</h2>
                  <p className="text-[11px] text-slate-400">{q.roleCategory}</p>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  {q.difficulty}
                </span>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800 leading-relaxed italic">
                "{q.prompt}"
              </p>

              {/* Key Concepts */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Key Concept Graph ({q.keyConcepts.length})</div>
                <div className="flex flex-wrap gap-1">
                  {q.keyConcepts.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Duration: {q.expectedDurationSec}s</span>
              <span className="font-mono text-cyan-400">Ground Truth Vectorized</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
