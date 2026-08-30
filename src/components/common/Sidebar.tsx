import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Layers, 
  Cpu, 
  Building2, 
  ShieldAlert, 
  Settings, 
  Sparkles, 
  Radio,
  Video, 
  FileText, 
  Calendar, 
  Mail, 
  Award,
  Clock,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange
}) => {
  const { currentUser } = useAuth();
  const { currentCompany } = useTenant();
  const { t } = useLanguage();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isEmployee = currentUser?.role === 'EMPLOYEE';

  // Navigation Items for Super Admin
  const superAdminNavItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Platform Telemetry'), icon: LayoutDashboard },
    { id: 'live_control_center', label: 'Live Control Center', icon: Radio, badge: 'Realtime' },
    { id: 'live_conference', label: 'Live Video Room (Zoom)', icon: Video, badge: 'Live Panel' },
    { id: 'resumes', label: t('nav.resumes', 'Resume Shortlisting'), icon: FileText, badge: 'AI Screen' },
    { id: 'results', label: t('nav.results', 'Results & Scorecards'), icon: Award, badge: 'Dossier' },
    { id: 'schedule', label: t('nav.schedule', 'Interview Schedule'), icon: Calendar },
    { id: 'live_monitor', label: t('nav.live_monitor', 'Live Monitor & Video Vault'), icon: Video, badge: 'Vault' },
    { id: 'ai_training', label: t('nav.ai_studio', 'AI Training Studio'), icon: Cpu, badge: 'Zero API' },
    { id: 'companies', label: t('nav.companies', 'Tenant Management'), icon: Building2 },
    { id: 'email_settings', label: t('nav.settings', 'Email & Notifications'), icon: Mail },
    { id: 'audit_logs', label: 'Security & Audit Logs', icon: ShieldAlert },
  ];

  // Navigation Items for Company Admin & Recruiter
  const companyNavItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Recruiter Dashboard'), icon: LayoutDashboard },
    { id: 'live_monitor', label: 'Live Candidate Monitor', icon: Radio, badge: 'Intercom' },
    { id: 'live_conference', label: 'Live Video Room (Zoom)', icon: Video, badge: 'Live Panel' },
    { id: 'candidates', label: 'Candidate Pipeline', icon: Users },
    { id: 'results', label: t('nav.results', 'Results & Scorecards'), icon: Award, badge: 'AI Score' },
    { id: 'resumes', label: t('nav.resumes', 'Resume Shortlisting'), icon: FileText, badge: 'AI Match' },
    { id: 'schedule', label: t('nav.schedule', 'Interview Schedule'), icon: Calendar },
    { id: 'jobs', label: t('nav.jobs', 'Job Openings'), icon: Briefcase },
    { id: 'rounds', label: 'Interview Rounds & Stages', icon: Layers },
    { id: 'email_settings', label: 'Email Gateway', icon: Mail },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
  ];

  // Navigation Items for Staff Employee
  const employeeNavItems = [
    { id: 'employee_desk', label: 'Employee Self-Service', icon: Clock, badge: 'Punch' },
    { id: 'live_conference', label: 'Live Video Room (Zoom)', icon: Video, badge: 'Meeting' },
    { id: 'schedule', label: 'My Assigned Panels', icon: Calendar },
    { id: 'results', label: 'Candidate Peer Reviews', icon: Award },
    { id: 'settings', label: 'My Workspace Profile', icon: Settings },
  ];

  const currentNavItems = isSuperAdmin 
    ? superAdminNavItems 
    : isEmployee 
    ? employeeNavItems 
    : companyNavItems;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/70 backdrop-blur flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-5">
        {/* Active Context Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-inner">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Workspace</span>
            <span className="text-cyan-400 font-mono">
              {isSuperAdmin ? 'SUPER ADMIN' : isEmployee ? 'STAFF MEMBER' : 'TENANT'}
            </span>
          </div>
          <div className="text-xs font-extrabold text-white truncate">
            {isSuperAdmin ? 'Ardhnarishwar Global HQ' : (currentCompany?.name || 'Cyberdyne Systems')}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Domain: {currentCompany?.domain || 'ardhnarishwar.ai'}</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase px-3 py-1 tracking-wider">
            {isSuperAdmin ? 'Platform Management' : isEmployee ? 'Employee Desk' : 'Talent & Interviews'}
          </div>

          {currentNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-md shadow-cyan-950/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer / Engine Status Widget */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>REAL-TIME ENGINE</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="text-[11px] font-bold text-slate-300">FastAPI WebSocket Hub</div>
          <p className="text-[10px] text-slate-500 font-mono">100% In-House NLP • No External APIs</p>
        </div>

        <div className="text-[10px] text-slate-500 text-center font-mono">
          Ardhnarishwar AI SaaS © 2026
        </div>
      </div>
    </aside>
  );
};
