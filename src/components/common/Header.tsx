import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTheme, THEME_OPTIONS } from '../../context/ThemeContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useLanguage, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, LanguageCode, CurrencyCode } from '../../context/LanguageContext';
import { ArdhnarishwarLogo } from './ArdhnarishwarLogo';
import { UserProfileModal } from './UserProfileModal';
import { ShareLinksModal } from './ShareLinksModal';
import { AppDataStore } from '../../services/storage';
import { User } from '../../types';
import { 
  Building2, 
  Moon, 
  Sun, 
  Sparkles, 
  ExternalLink, 
  ChevronDown, 
  ShieldAlert, 
  LogOut, 
  AlertTriangle, 
  Globe, 
  Coins, 
  Clock, 
  Wifi, 
  User as UserIcon, 
  Palette, 
  Video,
  Share2,
  Bell,
  CheckCircle2,
  Home
} from 'lucide-react';

interface HeaderProps {
  onOpenCandidateDemo?: () => void;
  onOpenCandidatePortal?: () => void;
  onOpenLandingPage?: () => void;
  onNavigateTab: (tab: string) => void;
  onLogout?: () => void;
  onLaunchMeeting?: (roomId: string, candidateName?: string, jobTitle?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenCandidateDemo, 
  onOpenCandidatePortal,
  onOpenLandingPage,
  onNavigateTab,
  onLogout,
  onLaunchMeeting,
}) => {
  const { 
    currentUser, 
    switchPersona, 
    isImpersonating, 
    impersonatedBy, 
    exitImpersonation,
    logout
  } = useAuth();

  const handleLaunchChamber = onOpenCandidatePortal || onOpenCandidateDemo;

  const { allCompanies, currentCompany, selectCompany } = useTenant();
  const { theme, setTheme, toggleTheme, currentThemeOption } = useTheme();
  const { isConnected, latencyMs } = useRealtime();
  const { 
    language, 
    setLanguage, 
    currency, 
    setCurrency, 
    currentTimeStr 
  } = useLanguage();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const notifications = [
    { id: 'n1', title: 'AI Scorecard Dossier Ready', desc: 'Candidate Priya Sharma completed Robotics Perception interview (Score: 92%).', time: '2m ago', unread: true },
    { id: 'n2', title: 'New Application Received', desc: 'Candidate self-registered for Lead Perception opening.', time: '18m ago', unread: true },
    { id: 'n3', title: 'Proctoring Telemetry Normal', desc: 'Zero unauthorized tab switches or face occlusions detected.', time: '1h ago', unread: false },
  ];

  const users = AppDataStore.getUsers();
  const personas: { id: string; label: string; role: string }[] = users.map((u: User) => ({
    id: u.id,
    label: `${u.name} (${u.role.replace(/_/g, ' ')})`,
    role: u.role
  }));

  const handleSelectPersona = (userId: string) => {
    const res = switchPersona(userId);
    if (!res.success) {
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 3000);
    } else {
      setShowPersonaMenu(false);
    }
  };

  const handleSignOut = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* 1. High-Visibility Impersonation Banner */}
      {isImpersonating && impersonatedBy && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-2 text-slate-950 font-bold text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black shrink-0 animate-bounce" />
            <span>
              <strong>AUTHORIZED IMPERSONATION ACTIVE:</strong> Viewing as <u>{currentUser?.name}</u> ({currentUser?.role}). Audited by <strong>{impersonatedBy.name}</strong>.
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black text-white hover:bg-slate-900 transition-colors text-xs font-extrabold shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Impersonation</span>
          </button>
        </div>
      )}

      {/* 2. Main Navigation Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        
        {/* Brand Logo & Context */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={true} />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* WebSocket Real-Time Connectivity Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WS LIVE ({latencyMs}ms)</span>
          </div>

          {/* Global Localizations Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-xl">
            
            {/* Real-time Clock */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 pr-2 border-r border-slate-800">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTimeStr}</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                    {l.flag} {l.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
              <Coins className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Share Links Hub Launcher */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/30 transition-all shadow-sm active:scale-95"
            title="Get 1-Click Shareable Project Links"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Share Links</span>
          </button>

          {/* Quick Candidate Portal Launcher */}
          {handleLaunchChamber && (
            <button
              onClick={handleLaunchChamber}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-950 to-indigo-950 text-cyan-300 border border-cyan-800 hover:border-cyan-600 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Candidate Chamber</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </button>
          )}

          {/* Tenant Switcher (Super Admin only) */}
          {(currentUser?.role === 'SUPER_ADMIN' || impersonatedBy?.role === 'SUPER_ADMIN') && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors font-mono"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[110px] truncate">{currentCompany?.name || 'All Tenants'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCompanyMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="text-[10px] font-mono text-slate-400 px-3 py-1.5 uppercase font-bold">
                    Switch Active Tenant
                  </div>
                  {allCompanies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectCompany(c.id);
                        setShowCompanyMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        currentCompany?.id === c.id ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] font-mono opacity-70">{c.plan.split('_')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Public Landing Page Switcher */}
          {onOpenLandingPage && (
            <button
              onClick={onOpenLandingPage}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:text-white transition-all shadow-sm"
              title="Visit Product Landing Page"
            >
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              <span>Landing Page</span>
            </button>
          )}

          {/* Real-Time Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Notifications</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    3 New
                  </span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-200">{n.title}</span>
                        <span className="text-[9px] font-mono text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multi-Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors text-xs font-semibold"
              title="Select Platform Theme"
            >
              <span className={`w-3 h-3 rounded-full ${currentThemeOption.previewAccent} animate-pulse shrink-0`} />
              <span className="hidden md:inline font-mono text-[11px]">{currentThemeOption.name.split(' (')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in space-y-1.5">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase px-2 py-1 flex items-center justify-between">
                  <span>Select Visual Theme</span>
                  <span className="text-cyan-400">4 Curated Themes</span>
                </div>
                {THEME_OPTIONS.map((tOpt) => (
                  <button
                    key={tOpt.id}
                    onClick={() => {
                      setTheme(tOpt.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      theme === tOpt.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${tOpt.previewAccent}`} />
                      <div>
                        <div className="font-bold">{tOpt.name}</div>
                        <div className="text-[10px] text-slate-400">{tOpt.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Full Profile Launcher Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-slate-100 border border-slate-700 transition-all font-semibold shadow-sm"
            title="Open Full User Profile"
          >
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">
              {currentUser?.name?.[0] || 'U'}
            </div>
            <span className="max-w-[100px] truncate hidden sm:inline">{currentUser?.name || 'User'}</span>
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Persona Switcher / Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Switch Enterprise Role"
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Enterprise Role Governance
                    </div>
                    <div className="text-[11px] font-semibold text-slate-200">
                      Production Access Control
                    </div>
                  </div>
                  
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    STRICT PROD: ACTIVE
                  </span>
                </div>

                {actionFeedback && (
                  <div className="p-2 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{actionFeedback}</span>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  {personas.map(p => {
                    const isCurrent = currentUser?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPersona(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={handleSignOut}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-800/60"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out to Auth Portal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Full User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLaunchMeeting={onLaunchMeeting}
        />
      )}

      {/* Share Project Links Hub Modal */}
      <ShareLinksModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
};
