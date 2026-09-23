import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, CompanyStatus } from '../types';
import { AppDataStore } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface TenantContextType {
  currentCompany: Company | null;
  allCompanies: Company[];
  activeCompanyId: string;
  selectCompany: (companyId: string) => void;
  updateCompany: (company: Company) => Promise<boolean>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'recordingStorageUsedMb'>) => Company;
  toggleCompanyStatus: (companyId: string) => void;
  refreshTenantData: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');

  const refreshTenantData = async () => {
    const localCompanies = AppDataStore.getCompanies();
    setAllCompanies(localCompanies);

    // Sync with backend API
    try {
      const res = await ApiClient.listCompanies();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Merge server companies with local properties
        const merged = res.data.map((srv: any) => {
          const match = localCompanies.find(c => c.id === srv.id);
          return {
            ...(match || {}),
            ...srv,
            legalName: srv.legal_name || srv.legalName || match?.legalName || srv.name,
            displayName: srv.display_name || srv.displayName || match?.displayName || srv.name,
            taxId: srv.tax_id || srv.taxId || match?.taxId,
            companySize: srv.company_size || srv.companySize || match?.companySize,
            brandAccentColor: srv.brand_accent_color || srv.brandAccentColor || match?.brandAccentColor || '#06B6D4',
            supportEmail: srv.support_email || srv.supportEmail || match?.supportEmail || srv.contactEmail,
            timezone: srv.timezone || match?.timezone || 'UTC',
            currency: srv.currency || match?.currency || 'USD',
            dateFormat: srv.date_format || srv.dateFormat || match?.dateFormat || 'YYYY-MM-DD',
            workWeek: srv.work_week || srv.workWeek || match?.workWeek || 'Monday - Friday',
            socialLinks: srv.social_links || srv.socialLinks || match?.socialLinks || {},
            dataRetentionDays: srv.data_retention_days || srv.dataRetentionDays || match?.dataRetentionDays || 365,
            securityContactEmail: srv.security_contact_email || srv.securityContactEmail || match?.securityContactEmail || srv.contactEmail,
          };
        });
        setAllCompanies(merged);
        AppDataStore.saveCompanies(merged);
      }
    } catch (e) {
      // Offline fallback: keep localCompanies
    }
  };

  useEffect(() => {
    refreshTenantData();
  }, []);

  // When user changes, sync company if not super admin
  useEffect(() => {
    if (currentUser && currentUser.companyId) {
      setActiveCompanyId(currentUser.companyId);
    } else if (isSuperAdmin) {
      if (!activeCompanyId && allCompanies.length > 0) {
        setActiveCompanyId(allCompanies[0]?.id || '');
      }
    }
  }, [currentUser, isSuperAdmin, allCompanies]);

  const selectCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
  };

  const updateCompany = async (updated: Company): Promise<boolean> => {
    // 1. Optimistic local update
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
      details: `Updated settings for ${updated.name}. Legal: ${updated.legalName || updated.name}`,
      ipAddress: '127.0.0.1',
      severity: 'INFO'
    });

    // 2. Persist to Backend REST API
    try {
      const payload = {
        name: updated.name,
        legal_name: updated.legalName || updated.name,
        display_name: updated.displayName || updated.name,
        logo_url: updated.logoUrl || updated.logo,
        favicon_url: updated.faviconUrl,
        brand_accent_color: updated.brandAccentColor,
        website: updated.website,
        tax_id: updated.taxId,
        company_size: updated.companySize,
        description: updated.description || updated.bio,
        hq_street: updated.hqStreet,
        hq_city: updated.hqCity,
        hq_state: updated.hqState,
        hq_country: updated.hqCountry,
        hq_postal_code: updated.hqPostalCode,
        phone: updated.phone,
        contact_email: updated.contactEmail,
        contact_person: updated.contactPerson,
        support_email: updated.supportEmail,
        timezone: updated.timezone,
        currency: updated.currency,
        date_format: updated.dateFormat,
        work_week: updated.workWeek,
        social_links: updated.socialLinks,
        data_retention_days: updated.dataRetentionDays,
        security_contact_email: updated.securityContactEmail,
        ai_custom_rules_enabled: updated.aiCustomRulesEnabled,
        industry: updated.industry,
      };

      const res = await ApiClient.updateCompanySettings(updated.id, payload);
      if (res.data?.data) {
        const srv = res.data.data;
        const normalized: Company = {
          ...updated,
          legalName: srv.legal_name || updated.legalName,
          displayName: srv.display_name || updated.displayName,
          taxId: srv.tax_id || updated.taxId,
          companySize: srv.company_size || updated.companySize,
          timezone: srv.timezone || updated.timezone,
          currency: srv.currency || updated.currency,
        };
        const syncedList = allCompanies.map(c => c.id === updated.id ? normalized : c);
        setAllCompanies(syncedList);
        AppDataStore.saveCompanies(syncedList);
      }
      return true;
    } catch (err) {
      console.warn('Backend API update failed, cached locally:', err);
      return false;
    }
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
