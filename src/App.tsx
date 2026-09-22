import React, { useState, useEffect } from 'react';
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

import { AppDataStore } from './services/storage';
import { Candidate, JobPosition } from './types';

const AppContent: React.FC = () => {
  const { currentUser, role, logout, switchPersona, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { activeBroadcasts, dismissBroadcast } = useRealtime();

  // Navigation & Direct Chamber State
  const [candidateTokenForChamber, setCandidateTokenForChamber] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false);
  const [authInitialTab, setAuthInitialTab] = useState<'admin' | 'candidate' | 'company_register' | 'employee_register'>('admin');
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Global URL Routing & Route Protection
  useEffect(() => {
    const handleUrlRouting = () => {
      const params = new URLSearchParams(window.location.search);
      
      const token = params.get('token') || params.get('interview');
      const roleParam = params.get('role') || params.get('persona') || params.get('user');
      const portalParam = params.get('portal');
      const pageParam = params.get('page');

      // 0. Landing Page Direct Link (?page=landing)
      if (pageParam === 'landing') {
        setShowLandingPage(true);
        return;
      }

      // 1. Direct Token Candidate AI Chamber Link (?token=...)
      if (token) {
        setCandidateTokenForChamber(token);
        setShowLandingPage(false);
        return;
      }

      // 2. URL Role Protection Check: Prevent URL Tampering
      if (roleParam && currentUser) {
        const requested = roleParam.toUpperCase().trim();
        // If candidate or employee tries to access admin via URL param
        if ((requested === 'SUPER_ADMIN' || requested === 'ADMIN') && currentUser.role !== 'SUPER_ADMIN') {
          console.warn(`[SECURITY] Blocked unauthorized URL escalation from ${currentUser.role} to SUPER_ADMIN.`);
          setAccessDeniedMessage(`Access Denied: You cannot switch to Super Admin with your current role (${currentUser.role}).`);
          setTimeout(() => setAccessDeniedMessage(null), 4000);
          return;
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setCandidateTokenForChamber('');
    setShowLandingPage(false);
  };

  // 1. Direct Token Candidate AI Chamber Link (?token=...) or Chamber launch button clicked
  if (candidateTokenForChamber) {
    return (
      <CandidatePortal
        initialToken={candidateTokenForChamber}
        onBackToApp={handleLogout}
      />
    );
  }

  // 2. Landing Page View (Commercial SaaS Showcase)
  if (showLandingPage) {
    return (
      <LandingPage
        onNavigateAuth={(tab) => {
          setAuthInitialTab(tab || 'admin');
          setShowLandingPage(false);
        }}
        onLaunchCandidateChamber={() => {
          setShowLandingPage(false);
        }}
        onOpenDemoChamber={() => {
          setShowLandingPage(false);
        }}
      />
    );
  }

  // 3. FIRST SCREEN: If user is not authenticated, show Login / Auth Portal (Zero Dashboard Exposure)
  if (!isAuthenticated || !currentUser) {
    return (
      <GlobalAuthPortal
        initialTab={authInitialTab}
        onCandidateLaunchChamber={(token) => {
          setCandidateTokenForChamber(token);
        }}
        onAdminLoginSuccess={() => {
          // Re-rendered automatically through AuthContext state change
        }}
      />
    );
  }

  // 3. ROLE-BASED DEDICATED FRONTENDS (NO MIXED DASHBOARDS)

  // Role 1: Super Admin Master Console
  if (currentUser.role === 'SUPER_ADMIN') {
    return (
      <RoleGuard allowedRoles={['SUPER_ADMIN']}>
        <SuperAdminPortal
          onSwitchToCandidate={() => {
            const cands = AppDataStore.getCandidates();
            if (cands.length > 0) {
              setCandidateTokenForChamber(cands[0].interviewToken);
            }
          }}
          onSwitchToCompany={() => {
            const ca = AppDataStore.getUsers().find(u => u.role === 'COMPANY_ADMIN');
            if (ca) switchPersona(ca.id);
          }}
          onSwitchToStaff={() => {
            const emp = AppDataStore.getUsers().find(u => u.role === 'EMPLOYEE');
            if (emp) switchPersona(emp.id);
          }}
          onLogout={handleLogout}
          onOpenLandingPage={() => setShowLandingPage(true)}
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
            }
          }}
          onLogout={handleLogout}
        />
      </RoleGuard>
    );
  }

  // Role 3: Candidate Portal
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
        }}
        onLogout={handleLogout}
        onOpenLandingPage={() => setShowLandingPage(true)}
      />
    </RoleGuard>
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
