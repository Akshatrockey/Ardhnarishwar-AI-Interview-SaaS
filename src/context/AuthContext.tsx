import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { AppDataStore } from '../services/storage';
import { ApiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonatedBy: User | null;
  isDemoMode: boolean;
  portalScope: 'org' | 'candidate';
  toggleDemoMode: () => void;
  login: (email: string, role?: UserRole, password?: string) => boolean;
  loginOrg: (user: User, token?: string) => void;
  loginCandidateUser: (candidateUser: User, token?: string) => void;
  loginAsCandidate: (tokenOrEmail: string) => { success: boolean; message?: string };
  logout: () => void;
  logoutOrg: () => void;
  logoutCandidate: () => void;
  switchPersona: (userId: string) => { success: boolean; message: string };
  exitImpersonation: () => void;
  rehydrateFromDatabase: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isRecruiter: boolean;
  isEmployee: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedBy, setImpersonatedBy] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [portalScope, setPortalScope] = useState<'org' | 'candidate'>('org');

  // Determine portal scope from URL path
  const detectPortalScope = useCallback((): 'org' | 'candidate' => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/candidate')) return 'candidate';
    if (path.startsWith('/org')) return 'org';
    const params = new URLSearchParams(window.location.search);
    const portal = params.get('portal') || params.get('mode');
    if (portal?.includes('candidate')) return 'candidate';
    return 'org';
  }, []);

  // Hydrate user and session from DB or scoped storage
  const rehydrateSession = useCallback(async () => {
    AppDataStore.init();
    const scope = detectPortalScope();
    setPortalScope(scope);

    const orgUserJson = localStorage.getItem('ardh_org_user');
    const candUserJson = localStorage.getItem('ardh_candidate_user');
    const legacyUserId = localStorage.getItem('ardhnarishwar_active_user_id');

    let activeUser: User | null = null;

    if (scope === 'candidate') {
      if (candUserJson) {
        try { activeUser = JSON.parse(candUserJson); } catch {}
      }
    } else {
      if (orgUserJson) {
        try { activeUser = JSON.parse(orgUserJson); } catch {}
      }
    }

    // Fallback to legacy or store lookup
    if (!activeUser && legacyUserId) {
      const users = AppDataStore.getUsers();
      activeUser = users.find(u => u.id === legacyUserId) || null;
    }

    // Try live database hydration if token exists
    const activeToken = scope === 'candidate' 
      ? localStorage.getItem('ardh_candidate_token') 
      : (localStorage.getItem('ardh_org_token') || localStorage.getItem('ardhnarishwar_token'));

    if (activeToken) {
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${activeToken}` }
        });
        if (res.ok) {
          const dbUser = await res.json();
          if (dbUser?.id) {
            activeUser = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role as UserRole,
              companyId: dbUser.company_id,
              status: dbUser.status || 'ACTIVE',
              createdAt: activeUser?.createdAt || new Date().toISOString()
            };
            if (scope === 'candidate') {
              localStorage.setItem('ardh_candidate_user', JSON.stringify(activeUser));
            } else {
              localStorage.setItem('ardh_org_user', JSON.stringify(activeUser));
            }
          }
        }
      } catch (err) {
        // Backend offline fallback handled gracefully
      }
    }

    // Impersonator check
    const savedImpersonatorId = localStorage.getItem('ardhnarishwar_impersonator_id');
    if (savedImpersonatorId) {
      const users = AppDataStore.getUsers();
      const originalAdmin = users.find(u => u.id === savedImpersonatorId);
      if (originalAdmin) setImpersonatedBy(originalAdmin);
    }

    setCurrentUser(activeUser);
  }, [detectPortalScope]);

  useEffect(() => {
    rehydrateSession();

    const handleRouteChange = () => {
      const newScope = detectPortalScope();
      setPortalScope(newScope);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [rehydrateSession, detectPortalScope]);

  const toggleDemoMode = () => {
    setIsDemoMode(false);
  };

  /**
   * Scoped Enterprise Login (No Candidate Session Collision)
   */
  const loginOrg = (user: User, token?: string) => {
    setCurrentUser(user);
    setPortalScope('org');
    localStorage.setItem('ardh_org_user', JSON.stringify(user));
    localStorage.setItem('ardhnarishwar_active_user_id', user.id);
    if (token) {
      localStorage.setItem('ardh_org_token', token);
      localStorage.setItem('ardhnarishwar_token', token);
    }
  };

  /**
   * Scoped Candidate Login (No Org Session Collision)
   */
  const loginCandidateUser = (candidateUser: User, token?: string) => {
    setCurrentUser(candidateUser);
    setPortalScope('candidate');
    localStorage.setItem('ardh_candidate_user', JSON.stringify(candidateUser));
    if (token) {
      localStorage.setItem('ardh_candidate_token', token);
    }
  };

  /**
   * Secure Enterprise Persona Switching / Authorized Impersonation
   */
  const switchPersona = (userId: string): { success: boolean; message: string } => {
    const users = AppDataStore.getUsers();
    const target = users.find(u => u.id === userId);

    if (!target) {
      return { success: false, message: 'Target user not found.' };
    }

    if (currentUser?.role === 'SUPER_ADMIN' && target.role !== 'SUPER_ADMIN') {
      setImpersonatedBy(currentUser);
      localStorage.setItem('ardhnarishwar_impersonator_id', currentUser.id);

      AppDataStore.logActivity({
        companyId: target.companyId,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: 'SUPER_ADMIN',
        action: 'SECURITY_AUTHORIZED_IMPERSONATION_STARTED',
        resource: `Target User: ${target.name} (${target.email})`,
        details: `Super Admin ${currentUser.name} initiated authorized impersonation of ${target.name} (Role: ${target.role})`,
        ipAddress: '127.0.0.1',
        severity: 'WARNING'
      });
    }

    loginOrg(target);
    return { success: true, message: `Switched active profile to ${target.name} (${target.role}).` };
  };

  const exitImpersonation = () => {
    if (!impersonatedBy) return;

    const originalAdmin = impersonatedBy;
    setCurrentUser(originalAdmin);
    setImpersonatedBy(null);
    localStorage.removeItem('ardhnarishwar_impersonator_id');
    localStorage.setItem('ardhnarishwar_active_user_id', originalAdmin.id);
    localStorage.setItem('ardh_org_user', JSON.stringify(originalAdmin));
  };

  const login = (email: string, _requestedRole?: UserRole, _password?: string): boolean => {
    const users = AppDataStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (user) {
      loginOrg(user);
      return true;
    }
    return false;
  };

  const loginAsCandidate = (tokenOrEmail: string): { success: boolean; message?: string } => {
    const candidates = AppDataStore.getCandidates();
    const trimmed = tokenOrEmail.trim().toUpperCase();
    
    const candidate = candidates.find(c => 
      c.interviewToken.toUpperCase() === trimmed || 
      c.id.toUpperCase() === trimmed || 
      c.email.toUpperCase() === trimmed
    );

    if (!candidate) {
      return { success: false, message: 'No candidate record found for this token or email.' };
    }

    const candidateUser: User = {
      id: candidate.id,
      email: candidate.email,
      name: `${candidate.firstName} ${candidate.lastName}`,
      role: 'CANDIDATE',
      companyId: candidate.companyId,
      createdAt: candidate.appliedAt || new Date().toISOString(),
      status: 'ACTIVE'
    };

    loginCandidateUser(candidateUser, candidate.interviewToken);
    return { success: true };
  };

  const logoutOrg = () => {
    if (currentUser?.role !== 'CANDIDATE') {
      setCurrentUser(null);
    }
    localStorage.removeItem('ardh_org_user');
    localStorage.removeItem('ardh_org_token');
    localStorage.removeItem('ardhnarishwar_token');
    localStorage.removeItem('ardhnarishwar_active_user_id');
    localStorage.removeItem('ardhnarishwar_impersonator_id');
  };

  const logoutCandidate = () => {
    if (currentUser?.role === 'CANDIDATE') {
      setCurrentUser(null);
    }
    localStorage.removeItem('ardh_candidate_user');
    localStorage.removeItem('ardh_candidate_token');
  };

  const logout = () => {
    const scope = detectPortalScope();
    if (scope === 'candidate') {
      logoutCandidate();
    } else {
      logoutOrg();
    }
    setCurrentUser(null);
    setImpersonatedBy(null);
  };

  const role = currentUser?.role || 'CANDIDATE';

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCompanyAdmin = role === 'COMPANY_ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isEmployee = role === 'EMPLOYEE';
  const isCandidate = role === 'CANDIDATE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        isImpersonating: !!impersonatedBy,
        impersonatedBy,
        isDemoMode,
        portalScope,
        toggleDemoMode,
        login,
        loginOrg,
        loginCandidateUser,
        loginAsCandidate,
        logout,
        logoutOrg,
        logoutCandidate,
        switchPersona,
        exitImpersonation,
        rehydrateFromDatabase: rehydrateSession,
        isSuperAdmin,
        isCompanyAdmin,
        isRecruiter,
        isEmployee,
        isCandidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
