import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, CompanyStatus } from '../types';
import { AppDataStore } from '../services/storage';
import { useAuth } from './AuthContext';

interface TenantContextType {
  currentCompany: Company | null;
  allCompanies: Company[];
  activeCompanyId: string;
  selectCompany: (companyId: string) => void;
  updateCompany: (company: Company) => void;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'recordingStorageUsedMb'>) => Company;
  toggleCompanyStatus: (companyId: string) => void;
  refreshTenantData: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('comp_cyberdyne');

  const refreshTenantData = () => {
    const companies = AppDataStore.getCompanies();
    setAllCompanies(companies);
  };

  useEffect(() => {
    refreshTenantData();
  }, []);

  // When user changes, sync company if not super admin
  useEffect(() => {
    if (currentUser && currentUser.companyId) {
      setActiveCompanyId(currentUser.companyId);
    } else if (isSuperAdmin) {
      // Keep selected or fallback to cyberdyne for demonstration
      if (!activeCompanyId && allCompanies.length > 0) {
        setActiveCompanyId(allCompanies[1]?.id || allCompanies[0].id);
      }
    }
  }, [currentUser, isSuperAdmin, allCompanies]);

  const selectCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
  };

  const updateCompany = (updated: Company) => {
    const list = allCompanies.map(c => c.id === updated.id ? updated : c);
    AppDataStore.saveCompanies(list);
    setAllCompanies(list);
    AppDataStore.logActivity({
      companyId: updated.id,
      actorId: currentUser?.id || 'sys',
      actorName: currentUser?.name || 'System',
      actorRole: currentUser?.role || 'SUPER_ADMIN',
      action: 'TENANT_UPDATED',
      resource: `Company: ${updated.name}`,
      details: `Updated settings, plan: ${updated.plan}, status: ${updated.status}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO'
    });
  };

  const createCompany = (data: Omit<Company, 'id' | 'createdAt' | 'recordingStorageUsedMb'>): Company => {
    const newCompany: Company = {
      ...data,
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      recordingStorageUsedMb: 0,
    };
    const list = [...allCompanies, newCompany];
    AppDataStore.saveCompanies(list);
    setAllCompanies(list);
    AppDataStore.logActivity({
      companyId: newCompany.id,
      actorId: currentUser?.id || 'sys',
      actorName: currentUser?.name || 'System',
      actorRole: currentUser?.role || 'SUPER_ADMIN',
      action: 'TENANT_CREATED',
      resource: `Company: ${newCompany.name}`,
      details: `Created new organization with plan ${newCompany.plan}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO'
    });
    return newCompany;
  };

  const toggleCompanyStatus = (companyId: string) => {
    const list = allCompanies.map(c => {
      if (c.id === companyId) {
        const nextStatus: CompanyStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        AppDataStore.logActivity({
          companyId: c.id,
          actorId: currentUser?.id || 'sys',
          actorName: currentUser?.name || 'System',
          actorRole: currentUser?.role || 'SUPER_ADMIN',
          action: 'TENANT_STATUS_TOGGLED',
          resource: `Company: ${c.name}`,
          details: `Changed status from ${c.status} to ${nextStatus}`,
          ipAddress: '127.0.0.1',
          severity: 'WARNING'
        });
        return { ...c, status: nextStatus };
      }
      return c;
    });
    AppDataStore.saveCompanies(list);
    setAllCompanies(list);
  };

  const currentCompany = allCompanies.find(c => c.id === activeCompanyId) || allCompanies[0] || null;

  return (
    <TenantContext.Provider
      value={{
        currentCompany,
        allCompanies,
        activeCompanyId,
        selectCompany,
        updateCompany,
        createCompany,
        toggleCompanyStatus,
        refreshTenantData,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
