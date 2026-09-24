import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';

// Dedicated Role-Based Frontends
import { SuperAdminPortal } from './views/SuperAdminPortal';
import { CompanyAdminPortal } from './views/CompanyAdminPortal';
import { EmployeePortal } from './views/EmployeePortal';
import { CandidatePortal } from './views/CandidatePortal';
import { GlobalAuthPortal } from './views/GlobalAuthPortal';
import { LandingPage } from './views/LandingPage';
import { RoleGuard } from './components/common/RouteGuard';
import { AIChatbox } from './components/chatbox/AIChatbox';

import { AppDataStore } from './services/storage';
import { Candidate, JobPosition } from './types';
import { ShieldAlert, AlertCircle, X, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, role, logout, logoutOrg, logoutCandidate, switchPersona, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { activeBroadcasts, dismissBroadcast } = useRealtime();

  // Navigation & Direct Chamber State
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [candidateTokenForChamber, setCandidateTokenForChamber] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const path = window.location.pathname.toLowerCase();
    const isAuth = path.includes('/auth') || path.includes('/login') || path.includes('/register') || path.startsWith('/admin') || path.startsWith('/superadmin') || path.includes('/dashboard');
    const hasToken = new URLSearchParams(window.location.search).get('token');
    const isPortalParam = new URLSearchParams(window.location.search).get('portal');
    return !isAuth && !hasToken && !isPortalParam;
  });
  const [authInitialTab, setAuthInitialTab] = useState<'admin' | 'candidate' | 'company_register' | 'employee_register'>('admin');
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Safe navigation helper
  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  }, []);

  // Sync document.title and Route Isolation Guards
  useEffect(() => {
    const handleUrlRouting = () => {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      setCurrentPath(pathname);

      const token = params.get('token') || params.get('interview');
      const pageParam = params.get('page');
      const isAuthRoute = pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/register');
      const isDashboardRoute = pathname.includes('/dashboard');
      const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin') || params.get('portal') === 'superadmin' || params.get('portal') === 'super_admin';

      // 0. Website Frontend (Landing Page) by Default for root '/' and non-auth paths
      if (token) {
        setCandidateTokenForChamber(token);
        setShowLandingPage(false);
        document.title = 'Ardhnarishwar AI Robotics — Candidate Career Portal';
        return;
      }

      if (isAdminRoute) {
        setShowLandingPage(false);
        if (currentUser?.role === 'SUPER_ADMIN') {
          document.title = 'Ardhnarishwar AI Robotics — Super Admin Master Console';
        } else {
          document.title = 'Ardhnarishwar AI Robotics — Super Admin Secure Login';
        }
        return;
      }

      if (pathname === '/' || pathname === '' || pathname === '/landing' || pageParam === 'landing' || (!currentUser && !isAuthRoute && !isDashboardRoute && !isAdminRoute)) {
        setShowLandingPage(true);
        document.title = 'Ardhnarishwar AI Robotics — Autonomous SaaS Recruitment Platform';
        return;
      }

      // 2. Strict Portal Route Guard & Segregation
      if (currentUser) {
        // A. Candidate trying to access Enterprise (/org/*) or Admin (/admin/*) routes
        if (currentUser.role === 'CANDIDATE' && (pathname.startsWith('/org') || pathname.startsWith('/admin'))) {
          console.warn('[SECURITY 403] Candidate attempted unauthorized access to Enterprise Portal.');
          setAccessDeniedMessage('403 Forbidden: Candidate accounts cannot access Enterprise Recruiter administration routes. Redirected to Candidate Career Portal.');
          setTimeout(() => setAccessDeniedMessage(null), 5000);
          navigate('/candidate/dashboard');
          document.title = 'Ardhnarishwar AI Robotics — Candidate Career Portal';
          return;
        }

        // B. Non-Super Admin trying to access /admin routes
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'CANDIDATE' && pathname.startsWith('/admin')) {
          setAccessDeniedMessage('403 Forbidden: Super Admin Console requires master platform credentials. Redirected to Enterprise Workspace.');
          setTimeout(() => setAccessDeniedMessage(null), 4000);
          navigate('/org/dashboard');
          document.title = 'Ardhnarishwar AI Robotics — Enterprise & Recruiter Portal';
          return;
        }

        // C. Enterprise HR (non-super-admin) trying to access Candidate routes (/candidate/*)
        if (currentUser.role !== 'CANDIDATE' && currentUser.role !== 'SUPER_ADMIN' && pathname.startsWith('/candidate') && !params.get('preview')) {
          setAccessDeniedMessage('Redirected to your Enterprise Recruiter Portal.');
          setTimeout(() => setAccessDeniedMessage(null), 3500);
          navigate('/org/dashboard');
          document.title = 'Ardhnarishwar AI Robotics — Enterprise & Recruiter Portal';
          return;
        }
      }

      // 3. Dynamic Title Updates
      if (pathname.startsWith('/candidate') || currentUser?.role === 'CANDIDATE') {
        document.title = 'Ardhnarishwar AI Robotics — Candidate Career Portal';
      } else if (currentUser?.role === 'SUPER_ADMIN') {
        document.title = 'Ardhnarishwar AI Robotics — Super Admin Master Console';
      } else if (pathname.startsWith('/org') || currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'RECRUITER' || currentUser?.role === 'EMPLOYEE') {
        document.title = 'Ardhnarishwar AI Robotics — Enterprise & Recruiter Portal';
      } else {
        document.title = 'Ardhnarishwar AI Robotics — Autonomous SaaS Recruitment Platform';
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    setCandidateTokenForChamber('');
    setShowLandingPage(true);
    navigate('/');
  };

  const renderPortalContent = () => {
    const pathname = currentPath.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const isAuthRoute = pathname.includes('/auth') || pathname.includes('/login') || pathname.includes('/register');
    const isDashboardRoute = pathname.includes('/dashboard');
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin') || params.get('portal') === 'superadmin' || params.get('portal') === 'super_admin';

    // 1. Direct Token Candidate AI Chamber Link (?token=...) or Chamber launch button clicked
    if (candidateTokenForChamber) {
      return (
        <CandidatePortal
          initialToken={candidateTokenForChamber}
          onBackToApp={handleLogout}
        />
      );
    }

    // 2. Landing Page View (Website Frontend Presentation - DEFAULT ON ROOT)
    if (showLandingPage || pathname === '/' || pathname === '' || pathname === '/landing' || (!currentUser && !isAuthRoute && !isDashboardRoute && !isAdminRoute)) {
      return (
        <LandingPage
          onNavigateAuth={(tab) => {
            setAuthInitialTab(tab || 'admin');
            setShowLandingPage(false);
            if (tab === 'candidate') {
              navigate('/candidate/auth/login');
            } else if (tab === 'company_register') {
              navigate('/org/auth/register');
            } else {
              navigate('/org/auth/login');
            }
          }}
          onNavigateSuperAdmin={() => {
            setShowLandingPage(false);
            navigate('/admin/dashboard?portal=superadmin');
          }}
          onLaunchCandidateChamber={() => {
            setShowLandingPage(false);
            navigate('/candidate/dashboard');
          }}
          onOpenDemoChamber={() => {
            setShowLandingPage(false);
            navigate('/candidate/dashboard');
          }}
        />
      );
    }

    // 3. UNAUTHENTICATED ROUTE HANDLING (Explicit /auth or /login routes only)
    if (!isAuthenticated || !currentUser) {
      const isCandidateRoute = pathname.startsWith('/candidate');
      return (
        <GlobalAuthPortal
          portalMode={isCandidateRoute ? 'candidate' : 'enterprise'}
          initialTab={isAdminRoute ? 'admin' : (isCandidateRoute ? 'candidate' : (authInitialTab || 'admin'))}
          onCandidateLaunchChamber={(token) => {
            setCandidateTokenForChamber(token);
            navigate('/candidate/dashboard');
          }}
          onAdminLoginSuccess={(dest?: string) => {
            const activeUser = AppDataStore.getUsers().find(u => u.id === localStorage.getItem('ardhnarishwar_active_user_id'));
            if (dest) {
              navigate(dest);
            } else if (activeUser?.role === 'SUPER_ADMIN') {
              navigate('/admin/dashboard');
            } else {
              navigate('/org/dashboard');
            }
          }}
        />
      );
    }

    // 4. ROLE-BASED DEDICATED FRONTENDS (NO MIXED DASHBOARDS)

    // Role 1: Super Admin Master Console (Full Control Across All Portals)
    if (currentUser.role === 'SUPER_ADMIN') {
      if (pathname.startsWith('/candidate')) {
        return (
          <CandidatePortal
            initialToken={candidateTokenForChamber}
            onBackToApp={() => navigate('/admin/dashboard')}
          />
        );
      }
      if (pathname.startsWith('/org')) {
        return (
          <CompanyAdminPortal
            onSwitchToSuperAdmin={() => navigate('/admin/dashboard')}
            onSwitchToStaff={() => {
              const emp = AppDataStore.getUsers().find(u => u.role === 'EMPLOYEE');
              if (emp) switchPersona(emp.id);
            }}
            onSwitchToCandidate={(target?: Candidate | string) => {
              if (typeof target === 'string') {
                setCandidateTokenForChamber(target);
              } else if (target && target.interviewToken) {
                setCandidateTokenForChamber(target.interviewToken);
              }
              navigate('/candidate/dashboard');
            }}
            onLogout={handleLogout}
            onOpenLandingPage={() => {
              setShowLandingPage(true);
              navigate('/landing');
            }}
          />
        );
      }

      return (
        <RoleGuard allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminPortal
            onSwitchToCandidate={() => {
              navigate('/candidate/dashboard');
            }}
            onSwitchToCompany={() => {
              navigate('/org/dashboard');
            }}
            onSwitchToStaff={() => {
              const emp = AppDataStore.getUsers().find(u => u.role === 'EMPLOYEE');
              if (emp) switchPersona(emp.id);
            }}
            onLogout={handleLogout}
            onOpenLandingPage={() => {
              setShowLandingPage(true);
              navigate('/landing');
            }}
          />
        </RoleGuard>
      );
    }

    // Role 2: Staff Member / Interview Staff Portal
    if (currentUser.role === 'EMPLOYEE') {
      return (
        <RoleGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN']}>
          <EmployeePortal
            onSwitchToSuperAdmin={() => switchPersona('usr_super_admin')}
            onSwitchToCompany={() => {
              const ca = AppDataStore.getUsers().find(u => u.role === 'COMPANY_ADMIN');
              if (ca) switchPersona(ca.id);
            }}
            onSwitchToCandidate={() => {
              const cands = AppDataStore.getCandidates();
              if (cands.length > 0) {
                setCandidateTokenForChamber(cands[0].interviewToken);
                navigate('/candidate/dashboard');
              }
            }}
            onLogout={handleLogout}
          />
        </RoleGuard>
      );
    }

    // Role 3: Candidate Portal (Strict Isolation, Zero Enterprise Branding)
    if (currentUser.role === 'CANDIDATE') {
      return (
        <RoleGuard allowedRoles={['CANDIDATE', 'SUPER_ADMIN']}>
          <CandidatePortal
            initialToken={candidateTokenForChamber}
            onBackToApp={handleLogout}
          />
        </RoleGuard>
      );
    }

    // Role 4: Company Admin / HR Portal (COMPANY_ADMIN, RECRUITER)
    return (
      <RoleGuard allowedRoles={['COMPANY_ADMIN', 'RECRUITER', 'SUPER_ADMIN']}>
        <CompanyAdminPortal
          onSwitchToSuperAdmin={() => switchPersona('usr_super_admin')}
          onSwitchToStaff={() => {
            const emp = AppDataStore.getUsers().find(u => u.role === 'EMPLOYEE');
            if (emp) switchPersona(emp.id);
          }}
          onSwitchToCandidate={(target?: Candidate | string) => {
            if (typeof target === 'string') {
              setCandidateTokenForChamber(target);
            } else if (target && target.interviewToken) {
              setCandidateTokenForChamber(target.interviewToken);
            } else {
              const cands = AppDataStore.getCandidates();
              if (cands.length > 0) {
                setCandidateTokenForChamber(cands[0].interviewToken);
              }
            }
            navigate('/candidate/dashboard');
          }}
          onLogout={handleLogout}
          onOpenLandingPage={() => {
            setShowLandingPage(true);
            navigate('/landing');
          }}
        />
      </RoleGuard>
    );
  };

  return (
    <>
      {/* 403 Forbidden / Route Protection Toast Banner */}
      {accessDeniedMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] animate-in slide-in-from-top duration-300">
          <div className="p-4 rounded-2xl bg-slate-900/95 border border-rose-500/50 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-rose-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold leading-relaxed">
                {accessDeniedMessage}
              </span>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {renderPortalContent()}
      <AIChatbox />
    </>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TenantProvider>
            <RealtimeProvider>
              <AppContent />
            </RealtimeProvider>
          </TenantProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
