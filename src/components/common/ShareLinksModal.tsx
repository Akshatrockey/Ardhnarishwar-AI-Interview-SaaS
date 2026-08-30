import React, { useState } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  UserCheck, 
  Lock, 
  Building2, 
  Users, 
  Video, 
  Send, 
  Mail, 
  Share2, 
  X,
  QrCode,
  Globe,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { AppDataStore } from '../../services/storage';

interface ShareLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLinksModal: React.FC<ShareLinksModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState<string>('TOKEN_PRIYA_ROBOTICS_2026');
  const [customRoom, setCustomRoom] = useState<string>('ROOM-ARDH-ROBOTICS-882');
  const [showQrKey, setShowQrKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const shareableLinks = [
    {
      id: 'candidate_interview',
      title: 'Candidate Live AI Interview Chamber',
      description: '1-Click candidate access: directly launches the AI interview & hardware diagnostic.',
      badge: 'Auto-Start Interview',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: UserCheck,
      iconColor: 'text-emerald-400',
      url: `${baseUrl}/?token=${customToken}`,
      hasCustomInput: true,
      customType: 'token'
    },
    {
      id: 'super_admin',
      title: 'Super Admin HQ Control Center',
      description: 'Direct 1-click access to global tenant management, live monitor, and AI training studio.',
      badge: '1-Click Auto-Login',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: Lock,
      iconColor: 'text-cyan-400',
      url: `${baseUrl}/?role=super_admin`
    },
    {
      id: 'recruiter',
      title: 'HR Recruiter Talent Workspace',
      description: 'Direct access to candidate pipeline, interview scheduling, and AI scoring panels.',
      badge: '1-Click Auto-Login',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: Users,
      iconColor: 'text-purple-400',
      url: `${baseUrl}/?role=recruiter`
    },
    {
      id: 'company_admin',
      title: 'Company Admin / HR Director Portal',
      description: 'Full tenant administration, job postings, scoring rules, and organization metrics.',
      badge: '1-Click Auto-Login',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: Building2,
      iconColor: 'text-indigo-400',
      url: `${baseUrl}/?role=company_admin`
    },
    {
      id: 'employee',
      title: 'Staff Employee & Interviewer Desk',
      description: 'Live attendance punch desk, assigned panel interviews, and meeting room access.',
      badge: '1-Click Auto-Login',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      icon: Sparkles,
      iconColor: 'text-teal-400',
      url: `${baseUrl}/?role=employee`
    },
    {
      id: 'video_conference',
      title: 'Live Video Conference Meeting Room',
      description: 'Direct 1-click video call room for panel interviews and multi-user conference.',
      badge: 'Direct Video Call',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Video,
      iconColor: 'text-rose-400',
      url: `${baseUrl}/?room=${customRoom}`,
      hasCustomInput: true,
      customType: 'room'
    },
    {
      id: 'candidate_reg',
      title: 'Candidate Self-Registration & Job Apply',
      description: 'Public job application portal where candidates apply and generate their token.',
      badge: 'Public Apply',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Globe,
      iconColor: 'text-amber-400',
      url: `${baseUrl}/?portal=candidate`
    },
    {
      id: 'global_auth',
      title: 'Global Platform Sign-In / Landing Page',
      description: 'Public gateway with multi-role login, company registration, and features overview.',
      badge: 'Landing Page',
      badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      icon: Link2,
      iconColor: 'text-slate-400',
      url: `${baseUrl}/?portal=auth`
    }
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleWhatsAppShare = (url: string, title: string) => {
    const text = encodeURIComponent(`Check out ${title} on Ardhnarishwar AI SaaS:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmailShare = (url: string, title: string) => {
    const subject = encodeURIComponent(`${title} - Ardhnarishwar AI SaaS`);
    const body = encodeURIComponent(`Hi,\n\nPlease access the Ardhnarishwar AI Interview platform here:\n${url}\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Share Project & 1-Click Access Links</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  Instant Auto-Login Links
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Send any link below to candidates, interviewers, or team members to open the exact view automatically!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Domain Banner */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Active Live Origin:</span>
            <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {baseUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Works on Mobile, Tablet & Desktop</span>
          </div>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shareableLinks.map((item) => {
              const Icon = item.icon;
              const isCopied = copiedKey === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${item.iconColor}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </h4>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${item.badgeColor} mt-0.5`}>
                            {item.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    {item.hasCustomInput && item.customType === 'token' && (
                      <div className="pt-1">
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                          Candidate Token:
                        </label>
                        <input
                          type="text"
                          value={customToken}
                          onChange={(e) => setCustomToken(e.target.value)}
                          placeholder="TOKEN_PRIYA_ROBOTICS_2026"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    {item.hasCustomInput && item.customType === 'room' && (
                      <div className="pt-1">
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                          Meeting Room ID:
                        </label>
                        <input
                          type="text"
                          value={customRoom}
                          onChange={(e) => setCustomRoom(e.target.value)}
                          placeholder="ROOM-ARDH-ROBOTICS-882"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-rose-300 font-mono outline-none focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* URL Display & Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-slate-300 truncate select-all">
                      {item.url}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.id, item.url)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                          isCopied
                            ? 'bg-emerald-600 text-white font-black'
                            : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Open In New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleWhatsAppShare(item.url, item.title)}
                        className="p-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors"
                        title="Share via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEmailShare(item.url, item.title)}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                        title="Share via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Anyone opening these links will automatically bypass manual logins and land directly in the workspace!</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
