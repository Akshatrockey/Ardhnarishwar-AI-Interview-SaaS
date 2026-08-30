import React, { useState } from 'react';
import { Company, PlanType } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { AppDataStore } from '../../services/storage';
import { 
  Building2, 
  Plus, 
  HardDrive, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ShieldCheck, 
  MoreVertical,
  Search,
  Filter
} from 'lucide-react';

export const CompanyManager: React.FC = () => {
  const { allCompanies, createCompany, toggleCompanyStatus, selectCompany } = useTenant();
  const { switchPersona } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenWorkspace = (companyId: string) => {
    selectCompany(companyId);
    const users = AppDataStore.getUsers();
    let targetAdmin = users.find(u => u.companyId === companyId && u.role === 'COMPANY_ADMIN') ||
                      users.find(u => u.companyId === companyId);

    if (!targetAdmin) {
      const comp = allCompanies.find(c => c.id === companyId);
      targetAdmin = {
        id: `usr_${companyId}_admin`,
        email: comp?.contactEmail || `admin@${comp?.slug || 'company'}.com`,
        name: comp?.contactPerson || `${comp?.name || 'Company'} Administrator`,
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE',
        designation: 'Company Administrator & Hiring Director'
      };
      AppDataStore.saveUsers([...users, targetAdmin]);
    }

    const res = switchPersona(targetAdmin.id);
    if (!res.success) {
      setActionError(res.message);
      setTimeout(() => setActionError(null), 4000);
    }
  };

  // New Company Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [industry, setIndustry] = useState('Autonomous Robotics');
  const [plan, setPlan] = useState<PlanType>('ENTERPRISE_ROBOTICS');

  const filteredCompanies = allCompanies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createCompany({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      domain,
      plan,
      status: 'ACTIVE',
      maxJobs: plan === 'ENTERPRISE_ROBOTICS' ? 999 : plan === 'GROWTH' ? 20 : 5,
      maxCandidatesPerMonth: plan === 'ENTERPRISE_ROBOTICS' ? 5000 : plan === 'GROWTH' ? 500 : 100,
      contactEmail,
      contactPerson,
      industry,
      aiCustomRulesEnabled: plan === 'ENTERPRISE_ROBOTICS',
      recordingStorageQuotaMb: plan === 'ENTERPRISE_ROBOTICS' ? 50000 : 10000,
    });

    setShowAddModal(false);
    setName('');
    setSlug('');
    setDomain('');
    setContactEmail('');
    setContactPerson('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Client Company Accounts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-tenant company accounts, provision isolated workspaces, and configure SaaS subscription limits.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Company</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies by name, domain, industry..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Total Organizations: <strong className="text-white">{allCompanies.length}</strong></span>
          <span>•</span>
          <span>Active Subscriptions: <strong className="text-emerald-400">{allCompanies.filter(c => c.status === 'ACTIVE').length}</strong></span>
        </div>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(comp => {
          const isArdhnarishwar = comp.id === 'comp_ardhnarishwar';
          return (
            <div
              key={comp.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                      {comp.name[0]}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white truncate max-w-[180px]">{comp.name}</h2>
                      <p className="text-[11px] text-slate-400">{comp.industry}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    comp.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                    comp.status === 'TRIAL' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Plan Tier:</span>
                    <span className="font-semibold text-cyan-300">{comp.plan.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Domain:</span>
                    <span className="font-mono text-slate-300">{comp.domain}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lead Contact:</span>
                    <span className="text-slate-300">{comp.contactPerson}</span>
                  </div>
                </div>

                {/* Storage & Candidate Quotas */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-cyan-400" /> Storage Used
                    </span>
                    <span className="font-mono">{comp.recordingStorageUsedMb} / {comp.recordingStorageQuotaMb} MB</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full"
                      style={{ width: `${Math.min(100, (comp.recordingStorageUsedMb / comp.recordingStorageQuotaMb) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenWorkspace(comp.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </button>

                {!isArdhnarishwar && (
                  <button
                    onClick={() => toggleCompanyStatus(comp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      comp.status === 'ACTIVE'
                        ? 'bg-rose-950/40 hover:bg-rose-900 text-rose-300 border-rose-800'
                        : 'bg-emerald-950/40 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    {comp.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboard Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Onboard New SaaS Client Organization</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Company / Organization Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Robotics Dynamics"
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Workspace Domain</label>
                  <input
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="apexrobotics.com"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
                  <input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Autonomous Mobile Robots"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Primary Contact Person</label>
                  <input
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Dr. Alex Vance"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Contact Email</label>
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="talent@apexrobotics.com"
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subscription Tier</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PlanType)}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none mt-1"
                >
                  <option value="ENTERPRISE_ROBOTICS">Enterprise Robotics ($3,999/mo) — Unlimited Jobs & Custom AI</option>
                  <option value="GROWTH">Growth Scale ($1,499/mo) — 20 Jobs & 500 Candidates</option>
                  <option value="STARTER">Starter ($499/mo) — 5 Jobs & 100 Candidates</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
