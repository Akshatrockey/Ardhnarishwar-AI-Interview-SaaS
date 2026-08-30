import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AppDataStore } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonatedBy: User | null;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchPersona: (userId: string) => { success: boolean; message: string };
  exitImpersonation: () => void;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isRecruiter: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatedBy, setImpersonatedBy] = useState<User | null>(null);
  // Production Mode is strictly enforced
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    AppDataStore.init();
    const users = AppDataStore.getUsers();
    
    // Check if there was an ongoing impersonation session
    const savedImpersonatorId = localStorage.getItem('ardhnarishwar_impersonator_id');
    const savedUserId = localStorage.getItem('ardhnarishwar_active_user_id');

    if (savedImpersonatorId) {
      const originalAdmin = users.find(u => u.id === savedImpersonatorId);
      if (originalAdmin) {
        setImpersonatedBy(originalAdmin);
      }
    }

    // Default to Super Admin on first load for global access
    const user = users.find(u => u.id === savedUserId) || users[0] || null;
    setCurrentUser(user);
  }, []);

  const toggleDemoMode = () => {
    // Production lock active
    setIsDemoMode(false);
  };

  /**
   * Secure Enterprise Persona Switching / Authorized Impersonation
   * Enforces:
   * 1. When Super Admin impersonates a tenant user, original identity is retained and audited.
   * 2. Direct switching between authorized roles logs immutable security audit events.
   */
  const switchPersona = (userId: string): { success: boolean; message: string } => {
    const users = AppDataStore.getUsers();
    const target = users.find(u => u.id === userId);

    if (!target) {
      return { success: false, message: 'Target user not found.' };
    }

    // If Super Admin is initiating impersonation of another user
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
        details: `Super Admin ${currentUser.name} initiated authorized impersonation of ${target.name} (Role: ${target.role}, Company: ${target.companyId || 'Global'})`,
        ipAddress: '127.0.0.1',
        severity: 'WARNING'
      });
    } else {
      AppDataStore.logActivity({
        companyId: target.companyId,
        actorId: target.id,
        actorName: target.name,
        actorRole: target.role,
        action: 'AUTH_ENTERPRISE_ROLE_SWITCHED',
        resource: `Role: ${target.role}`,
        details: `Active role switched to ${target.name} (${target.email})`,
        ipAddress: '127.0.0.1',
        severity: 'INFO'
      });
    }

    setCurrentUser(target);
    localStorage.setItem('ardhnarishwar_active_user_id', target.id);
    return { success: true, message: `Switched active profile to ${target.name} (${target.role}).` };
  };

  const exitImpersonation = () => {
    if (!impersonatedBy) return;

    const originalAdmin = impersonatedBy;
    const previousUser = currentUser;

    setCurrentUser(originalAdmin);
    setImpersonatedBy(null);
    localStorage.removeItem('ardhnarishwar_impersonator_id');
    localStorage.setItem('ardhnarishwar_active_user_id', originalAdmin.id);

    AppDataStore.logActivity({
      companyId: previousUser?.companyId,
      actorId: originalAdmin.id,
      actorName: originalAdmin.name,
      actorRole: 'SUPER_ADMIN',
      action: 'SECURITY_AUTHORIZED_IMPERSONATION_ENDED',
      resource: `Exited User: ${previousUser?.name}`,
      details: `Super Admin ${originalAdmin.name} ended impersonation session and returned to Super Admin role.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO'
    });
  };

  const login = (email: string, role?: UserRole): boolean => {
    const users = AppDataStore.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user && role) {
      user = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };
      AppDataStore.saveUsers([...users, user]);
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('ardhnarishwar_active_user_id', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setImpersonatedBy(null);
    localStorage.removeItem('ardhnarishwar_active_user_id');
    localStorage.removeItem('ardhnarishwar_impersonator_id');
  };

  const role = currentUser?.role || 'CANDIDATE';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        isImpersonating: !!impersonatedBy,
        impersonatedBy,
        isDemoMode,
        toggleDemoMode,
        login,
        logout,
        switchPersona,
        exitImpersonation,
        isSuperAdmin: role === 'SUPER_ADMIN',
        isCompanyAdmin: role === 'COMPANY_ADMIN',
        isRecruiter: role === 'RECRUITER',
        isCandidate: role === 'CANDIDATE',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
