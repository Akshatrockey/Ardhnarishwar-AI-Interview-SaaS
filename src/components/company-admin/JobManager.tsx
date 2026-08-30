import React, { useState, useEffect } from 'react';
import { JobPosition, ExperienceLevel } from '../../types';
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
  MoreVertical,
  Search
} from 'lucide-react';

export const JobManager: React.FC = () => {
  const { currentCompany } = useTenant();
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Job Form
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Robotics Perception & Control');
  const [location, setLocation] = useState('San Francisco, CA / Hybrid');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('SENIOR');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('');

  const refreshJobs = () => {
    const all = AppDataStore.getJobs().filter(j => 
      !currentCompany || j.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setJobs(all);
  };

  useEffect(() => {
    refreshJobs();
  }, [currentCompany]);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const newJob: JobPosition = {
      id: `job_${Date.now()}`,
      companyId: currentCompany.id,
      title,
      department,
      location,
      type: 'FULL_TIME',
      experienceLevel,
      description,
      requiredSkills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      roundIds: ['rnd_cyber_01'],
      totalApplicants: 0,
    };

    const all = AppDataStore.getJobs();
    AppDataStore.saveJobs([newJob, ...all]);
    setJobs([newJob, ...jobs]);

    AppDataStore.logActivity({
      companyId: currentCompany.id,
      actorId: 'usr_admin',
      actorName: 'Company Administrator',
      actorRole: 'COMPANY_ADMIN',
      action: 'JOB_POSITION_CREATED',
      resource: `Job: ${title}`,
      details: `Created new opening with level ${experienceLevel} in ${department}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setSkillsStr('');
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Job Openings & Requirements</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure positions, required engineering skill taxonomies, and assign autonomous AI interview rounds.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job Opening</span>
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {job.experienceLevel}
                  </span>
                  <h2 className="text-sm font-bold text-white mt-1.5 leading-snug">{job.title}</h2>
                  <p className="text-[11px] text-slate-400">{job.department}</p>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {job.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {job.description}
              </p>

              {/* Skills Tags */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Required Competencies</div>
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
                <Users className="w-3.5 h-3.5" /> {job.totalApplicants || 4} Candidates
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Create New Engineering Position</h2>
            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Job Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Autonomous SLAM & Navigation Architect"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <input
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Autonomous Navigation Unit"
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

              <div>
                <label className="text-xs font-semibold text-slate-300">Location & Work Mode</label>
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Boston, MA / Hybrid"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Job Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of engineering responsibilities, robotics stack, and goals..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none resize-none mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Required Skills (Comma separated)</label>
                <input
                  required
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. ROS 2, LiDAR Odometry, C++20, Extended Kalman Filter"
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
                  Create Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
