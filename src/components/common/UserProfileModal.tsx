import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { User, Company, Candidate } from '../../types';
import { AppDataStore } from '../../services/storage';
import { ArdhnarishwarLogo } from './ArdhnarishwarLogo';
import { 
  User as UserIcon, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Video, 
  Award, 
  FileText, 
  Calendar, 
  Clock, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Briefcase, 
  Key, 
  Lock,
  Globe,
  Share2,
  HardDrive
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
  targetCandidate?: Candidate | null;
  onLaunchMeeting?: (roomId: string, candidateName?: string, jobTitle?: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  targetCandidate,
  onLaunchMeeting,
}) => {
  const { currentUser, role } = useAuth();
  const { currentCompany } = useTenant();

  const user = targetUser || currentUser;
  const candidate = targetCandidate;

  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'meetings' | 'edit'>('overview');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form State
  const [editName, setEditName] = useState<string>(candidate ? `${candidate.firstName} ${candidate.lastName}` : user?.name || '');
  const [editEmail, setEditEmail] = useState<string>(candidate ? candidate.email : user?.email || '');
  const [editPhone, setEditPhone] = useState<string>(candidate?.phone || user?.phone || '+1 (555) 019-2834');
  const [editBio, setEditBio] = useState<string>(candidate?.bio || user?.bio || 'Autonomous Robotics & AI Engineering Specialist focusing on hard real-time systems.');
  const [editDesignation, setEditDesignation] = useState<string>(candidate?.currentTitle || user?.designation || 'Senior Robotics Engineer');
  const [editLocation, setEditLocation] = useState<string>(candidate?.location || user?.location || 'San Francisco, CA');
  const [editSkills, setEditSkills] = useState<string>(
    (candidate?.skills || user?.skills || ['ROS 2', 'C++20', 'Inverse Kinematics', 'TensorRT', 'Kalman Filter']).join(', ')
  );

  if (!isOpen) return null;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isCandidateRole = !!candidate || user?.role === 'CANDIDATE';
  const isEmployeeRole = user?.role === 'EMPLOYEE';
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'RECRUITER';

  const meetingRoomId = candidate?.meetingRoomId || user?.meetingRoomId || `ROOM-ARDH-${(candidate?.firstName || user?.name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '')}-2026`;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);

    if (candidate) {
      const allCand = AppDataStore.getCandidates();
      const updatedCand: Candidate = {
        ...candidate,
        firstName: editName.split(' ')[0] || candidate.firstName,
        lastName: editName.split(' ').slice(1).join(' ') || candidate.lastName,
        email: editEmail,
        phone: editPhone,
        currentTitle: editDesignation,
        bio: editBio,
        location: editLocation,
        skills: skillsArray,
      };
      AppDataStore.saveCandidates(allCand.map(c => c.id === candidate.id ? updatedCand : c));
    } else if (user) {
      const allUsers = AppDataStore.getUsers();
      const updatedUser: User = {
        ...user,
        name: editName,
        email: editEmail,
        phone: editPhone,
        designation: editDesignation,
        bio: editBio,
        location: editLocation,
        skills: skillsArray,
      };
      AppDataStore.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditing(false);
    }, 1500);
  };

  const handleCopyMeetingLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://ardhnarishwar.ai/meet/${meetingRoomId}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartDirectMeeting = () => {
    if (onLaunchMeeting) {
      const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : user?.name || 'Interviewee';
      const title = candidate?.currentTitle || user?.designation || 'Robotics Assessment';
      onLaunchMeeting(meetingRoomId, name, title);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Top Banner with Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border-b border-slate-800/80">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/25">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xl text-white">
                    {candidate ? `${candidate.firstName[0]}${candidate.lastName[0]}` : (user?.name?.[0] || 'U')}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online & Registered" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">
                    {candidate ? `${candidate.firstName} ${candidate.lastName}` : (user?.name || 'User Profile')}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                    {candidate ? 'CANDIDATE' : (user?.role || 'USER')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {candidate?.currentTitle || user?.designation || 'Enterprise Member'} • {currentCompany?.name || 'Ardhnarishwar SaaS'}
                </p>
              </div>
            </div>

            {/* Quick Action: 1-Click Video Meeting Launcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartDirectMeeting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Launch Video Meeting</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-slate-800/80 -mb-6 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview & Bio
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'credentials'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Security & Credentials
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'meetings'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Video Room & Connect
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'edit'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Bio & Details Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Professional Bio</div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {candidate?.bio || user?.bio || 'Autonomous Robotics & AI Engineering Specialist focusing on hard real-time kinematics, multi-agent SLAM, and embedded motor control.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{candidate?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{candidate?.phone || user?.phone || '+1 (555) 019-2834'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{candidate?.location || user?.location || 'San Francisco, CA'}</span>
                  </div>
                </div>
              </div>

              {/* Skills Radar & Competencies */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Verified Skill Matrix & Competencies</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(candidate?.skills || user?.skills || ['ROS 2', 'Inverse Kinematics', 'Jacobian Matrix', 'C++20', 'TensorRT', 'Kalman Filter', 'Computer Vision']).map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-cyan-300 border border-slate-800 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Role-Specific Stats Deck */}
              {isSuperAdmin && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Platform Clearance</div>
                    <div className="text-sm font-black text-cyan-400">LEVEL 5 MASTER</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Tenants Governed</div>
                    <div className="text-sm font-black text-white">4 Active</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Security Audits</div>
                    <div className="text-sm font-black text-emerald-400">100% PASS</div>
                  </div>
                </div>
              )}

              {candidate && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Experience</div>
                    <div className="text-base font-black text-cyan-400">{candidate.yearsOfExperience} Years</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Status</div>
                    <div className="text-sm font-black text-emerald-400">{candidate.status}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Interview Token</div>
                    <div className="text-xs font-mono font-bold text-white truncate">{candidate.interviewToken}</div>
                  </div>
                </div>
              )}

              {isEmployeeRole && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Staff Code</div>
                    <div className="text-xs font-mono font-black text-cyan-400">{user?.employeeCode || 'EMP-CYBER-042'}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Monthly Hours</div>
                    <div className="text-sm font-black text-white">{user?.totalPunchHours || 176.4} hrs</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Assigned Panels</div>
                    <div className="text-sm font-black text-purple-400">{user?.assignedInterviewsCount || 6} Panels</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREDENTIALS & SECURITY */}
          {activeTab === 'credentials' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-extrabold text-white">Cryptographic Access Identity</div>
                      <div className="text-[10px] text-slate-400 font-mono">Zero-Trust JWT Auth & Role Bound</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    VERIFIED ACTIVE
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>User Unique ID:</span>
                    <span className="text-slate-200">{candidate?.id || user?.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assigned Role:</span>
                    <span className="text-cyan-400 font-bold">{candidate ? 'CANDIDATE' : user?.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Registered Domain:</span>
                    <span className="text-slate-200">{currentCompany?.domain || 'ardhnarishwar.ai'}</span>
                  </div>
                </div>
              </div>

              {candidate && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Uploaded Candidate Resume</span>
                  </div>
                  <div className="text-xs font-mono text-cyan-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>{candidate.resumeFileName || `${candidate.firstName}_${candidate.lastName}_Resume.pdf`}</span>
                    <span className="text-[10px] text-slate-400 font-sans">PDF Document</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VIDEO MEETINGS & CONNECT */}
          {activeTab === 'meetings' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950 border border-purple-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Direct Video Conference Room</h3>
                    <p className="text-[11px] text-slate-300">
                      Join instant 1-on-1 or multi-panel interviews directly via WebRTC video room.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-300">
                  <span>Room ID: {meetingRoomId}</span>
                  <button
                    onClick={handleCopyMeetingLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] transition-colors"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>

                <button
                  onClick={handleStartDirectMeeting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Live Video Room Now</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EDIT PROFILE */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in">
              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Profile details successfully updated and saved globally!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Professional Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
