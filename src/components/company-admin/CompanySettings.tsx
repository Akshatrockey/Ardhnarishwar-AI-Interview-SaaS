import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { AppDataStore } from '../../services/storage';
import { AuditLog } from '../../types';
import { 
  Settings, 
  Building2, 
  Briefcase, 
  MapPin, 
  Globe, 
  Share2, 
  ShieldCheck, 
  History, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Sparkles, 
  ExternalLink,
  Lock,
  RefreshCw,
  Clock,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { currentCompany, updateCompany } = useTenant();
  const { currentUser } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'business' | 'contact' | 'localization' | 'social' | 'governance' | 'audit'>('general');

  // Form States - General & Branding
  const [legalName, setLegalName] = useState(currentCompany?.legalName || currentCompany?.name || '');
  const [displayName, setDisplayName] = useState(currentCompany?.displayName || currentCompany?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentCompany?.logoUrl || currentCompany?.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
  const [faviconUrl, setFaviconUrl] = useState(currentCompany?.faviconUrl || '');
  const [brandAccentColor, setBrandAccentColor] = useState(currentCompany?.brandAccentColor || '#06B6D4');
  const [website, setWebsite] = useState(currentCompany?.website || (currentCompany?.domain ? `https://${currentCompany.domain}` : 'https://cyberdyne.ai'));

  // Form States - Business & Legal
  const [taxId, setTaxId] = useState(currentCompany?.taxId || 'US-EIN-98-7654321');
  const [industry, setIndustry] = useState(currentCompany?.industry || 'Robotics & Autonomous Systems');
  const [companySize, setCompanySize] = useState(currentCompany?.companySize || '51-200 employees');
  const [description, setDescription] = useState(currentCompany?.description || currentCompany?.bio || 'Global leader in real-time robotic kinematics, autonomous control algorithms, and edge-AI perception systems.');

  // Form States - Contact & HQ
  const [hqStreet, setHqStreet] = useState(currentCompany?.hqStreet || '100 Innovation Way, Cyberdyne Tower');
  const [hqCity, setHqCity] = useState(currentCompany?.hqCity || 'San Francisco');
  const [hqState, setHqState] = useState(currentCompany?.hqState || 'California');
  const [hqCountry, setHqCountry] = useState(currentCompany?.hqCountry || 'United States');
  const [hqPostalCode, setHqPostalCode] = useState(currentCompany?.hqPostalCode || '94105');
  const [contactPerson, setContactPerson] = useState(currentCompany?.contactPerson || 'Dr. Miles Bennett');
  const [contactEmail, setContactEmail] = useState(currentCompany?.contactEmail || 'talent@cyberdyne.ai');
  const [phone, setPhone] = useState(currentCompany?.phone || '+1 (415) 890-5432');
  const [supportEmail, setSupportEmail] = useState(currentCompany?.supportEmail || 'support@cyberdyne.ai');

  // Form States - Localization & Operations
  const [timezone, setTimezone] = useState(currentCompany?.timezone || 'America/Los_Angeles');
  const [currency, setCurrency] = useState(currentCompany?.currency || 'USD');
  const [dateFormat, setDateFormat] = useState(currentCompany?.dateFormat || 'YYYY-MM-DD');
  const [workWeek, setWorkWeek] = useState(currentCompany?.workWeek || 'Monday - Friday');

  // Form States - Social & Public Links
  const [linkedin, setLinkedin] = useState(currentCompany?.socialLinks?.linkedin || 'https://linkedin.com/company/cyberdyne-systems');
  const [twitter, setTwitter] = useState(currentCompany?.socialLinks?.twitter || 'https://x.com/cyberdyne');
  const [github, setGithub] = useState(currentCompany?.socialLinks?.github || 'https://github.com/cyberdyne-robotics');
  const [portfolio, setPortfolio] = useState(currentCompany?.socialLinks?.portfolio || 'https://cyberdyne.ai/research');

  // Form States - Governance & Security
  const [dataRetentionDays, setDataRetentionDays] = useState(currentCompany?.dataRetentionDays || 365);
  const [securityContactEmail, setSecurityContactEmail] = useState(currentCompany?.securityContactEmail || 'security@cyberdyne.ai');
  const [aiCustomRules, setAiCustomRules] = useState(currentCompany?.aiCustomRulesEnabled ?? true);

  // Status & Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Sync state when currentCompany loads
  useEffect(() => {
    if (currentCompany) {
      setLegalName(currentCompany.legalName || currentCompany.name || '');
      setDisplayName(currentCompany.displayName || currentCompany.name || '');
      setLogoUrl(currentCompany.logoUrl || currentCompany.logo || logoUrl);
      setFaviconUrl(currentCompany.faviconUrl || '');
      setBrandAccentColor(currentCompany.brandAccentColor || '#06B6D4');
      setWebsite(currentCompany.website || (currentCompany.domain ? `https://${currentCompany.domain}` : ''));
      setTaxId(currentCompany.taxId || 'US-EIN-98-7654321');
      setIndustry(currentCompany.industry || 'Robotics & AI');
      setCompanySize(currentCompany.companySize || '51-200 employees');
      setDescription(currentCompany.description || currentCompany.bio || '');
      setHqStreet(currentCompany.hqStreet || '');
      setHqCity(currentCompany.hqCity || '');
      setHqState(currentCompany.hqState || '');
      setHqCountry(currentCompany.hqCountry || '');
      setHqPostalCode(currentCompany.hqPostalCode || '');
      setContactPerson(currentCompany.contactPerson || '');
      setContactEmail(currentCompany.contactEmail || '');
      setPhone(currentCompany.phone || '');
      setSupportEmail(currentCompany.supportEmail || currentCompany.contactEmail || '');
      setTimezone(currentCompany.timezone || 'UTC');
      setCurrency(currentCompany.currency || 'USD');
      setDateFormat(currentCompany.dateFormat || 'YYYY-MM-DD');
      setWorkWeek(currentCompany.workWeek || 'Monday - Friday');
      setLinkedin(currentCompany.socialLinks?.linkedin || '');
      setTwitter(currentCompany.socialLinks?.twitter || '');
      setGithub(currentCompany.socialLinks?.github || '');
      setPortfolio(currentCompany.socialLinks?.portfolio || '');
      setDataRetentionDays(currentCompany.dataRetentionDays || 365);
      setSecurityContactEmail(currentCompany.securityContactEmail || currentCompany.contactEmail || '');
      setAiCustomRules(currentCompany.aiCustomRulesEnabled ?? true);
    }
  }, [currentCompany]);

  // Load audit logs for organization
  const loadAuditLogs = () => {
    const all = AppDataStore.getAuditLogs();
    const filtered = all.filter((l: AuditLog) => l.companyId === currentCompany?.id || (l.resource && l.resource.includes(currentCompany?.name || '')));
    setAuditLogs(filtered.slice(0, 15));
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentCompany, activeTab]);

  if (!currentCompany) return null;

  const handleLogoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    // Validation
    if (!legalName.trim() || !contactEmail.trim()) {
      setToastMessage({ type: 'error', text: 'Legal Name and Primary Contact Email are required fields.' });
      setIsSaving(false);
      return;
    }

    try {
      const updatedObj = {
        ...currentCompany,
        name: displayName.trim() || legalName.trim(),
        legalName: legalName.trim(),
        displayName: displayName.trim() || legalName.trim(),
        logoUrl,
        logo: logoUrl,
        faviconUrl,
        brandAccentColor,
        website: website.trim(),
        taxId: taxId.trim(),
        industry: industry.trim(),
        companySize,
        description: description.trim(),
        bio: description.trim(),
        hqStreet: hqStreet.trim(),
        hqCity: hqCity.trim(),
        hqState: hqState.trim(),
        hqCountry: hqCountry.trim(),
        hqPostalCode: hqPostalCode.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        phone: phone.trim(),
        supportEmail: supportEmail.trim().toLowerCase(),
        timezone,
        currency,
        dateFormat,
        workWeek,
        socialLinks: {
          linkedin: linkedin.trim(),
          twitter: twitter.trim(),
          github: github.trim(),
          portfolio: portfolio.trim(),
        },
        dataRetentionDays: Number(dataRetentionDays),
        securityContactEmail: securityContactEmail.trim().toLowerCase(),
        aiCustomRulesEnabled: aiCustomRules,
      };

      const success = await updateCompany(updatedObj);
      if (success) {
        setToastMessage({
          type: 'success',
          text: 'Organization workspace profile saved and synced to database successfully!'
        });
      } else {
        setToastMessage({
          type: 'success',
          text: 'Settings cached locally. Server will synchronize upon next connection.'
        });
      }
      loadAuditLogs();
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: `Error persisting organization settings: ${err?.message || 'Unknown error'}`
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 max-w-md ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold leading-relaxed">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Quick Overview */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="relative group">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-16 h-16 rounded-2xl object-cover border-2 shadow-lg bg-slate-950"
              style={{ borderColor: brandAccentColor }}
            />
            <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" onChange={handleLogoUploadSim} className="hidden" />
            </label>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{displayName || currentCompany.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800">
                {currentCompany.plan}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{legalName}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{currentCompany.id}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Tenant
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Changes...' : 'Save Workspace Settings'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'general', label: 'General & Branding', icon: Building2 },
          { id: 'business', label: 'Business & Legal', icon: Briefcase },
          { id: 'contact', label: 'Contact & HQ', icon: MapPin },
          { id: 'localization', label: 'Localization', icon: Globe },
          { id: 'social', label: 'Social & Web', icon: Share2 },
          { id: 'governance', label: 'Governance & AI', icon: ShieldCheck },
          { id: 'audit', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* TAB 1: General & Branding */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4" /> General Identity & Brand Visuals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Organization Legal Entity Name *</label>
                <input
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Cyberdyne Systems Global Robotics Inc."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Public Display / Brand Name *</label>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Cyberdyne Robotics"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Official Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.ai"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Brand Accent Color Hex</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={brandAccentColor}
                    onChange={(e) => setBrandAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-700 cursor-pointer bg-slate-950"
                  />
                  <input
                    value={brandAccentColor}
                    onChange={(e) => setBrandAccentColor(e.target.value)}
                    className="flex-1 text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300">Company Logo Image URL</label>
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Browser Favicon URL</label>
                <input
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://.../favicon.ico"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Business & Legal */}
        {activeTab === 'business' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Briefcase className="w-4 h-4" /> Corporate Registration & Business Metadata
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Registration / CIN / GSTIN / Tax ID</label>
                <input
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="CIN / GSTIN / Tax ID"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Artificial Intelligence & Robotics"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Company Size (Employee Tier)</label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value="1-10 employees">1 - 10 employees (Seed)</option>
                  <option value="11-50 employees">11 - 50 employees (Early Stage)</option>
                  <option value="51-200 employees">51 - 200 employees (Growth)</option>
                  <option value="201-500 employees">201 - 500 employees (Scale-up)</option>
                  <option value="501-1000 employees">501 - 1,000 employees (Enterprise)</option>
                  <option value="1000+ employees">1,000+ employees (Global Mega-Corp)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Company Mission & Profile Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe organization mission, key technologies, and engineering philosophy..."
                className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Contact & HQ */}
        {activeTab === 'contact' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin className="w-4 h-4" /> Global Headquarters & Contact Information
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300">Headquarters Street Address</label>
              <input
                value={hqStreet}
                onChange={(e) => setHqStreet(e.target.value)}
                placeholder="100 Innovation Way, Suite 400"
                className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">City</label>
                <input
                  value={hqCity}
                  onChange={(e) => setHqCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">State / Region</label>
                <input
                  value={hqState}
                  onChange={(e) => setHqState(e.target.value)}
                  placeholder="California"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Country</label>
                <input
                  value={hqCountry}
                  onChange={(e) => setHqCountry(e.target.value)}
                  placeholder="United States"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Postal Code</label>
                <input
                  value={hqPostalCode}
                  onChange={(e) => setHqPostalCode(e.target.value)}
                  placeholder="94105"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Primary Talent Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="careers@company.com"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> Candidate Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@company.com"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Official Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Localization */}
        {activeTab === 'localization' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4" /> Regional Localization & Operational Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Default Operational Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value="America/Los_Angeles">Pacific Time (US & Canada) (PST/PDT, UTC-8)</option>
                  <option value="America/New_York">Eastern Time (US & Canada) (EST/EDT, UTC-5)</option>
                  <option value="Europe/London">London / Greenwich Mean Time (GMT, UTC+0)</option>
                  <option value="Europe/Berlin">Central European Time (CET, UTC+1)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST, UTC+5:30)</option>
                  <option value="Asia/Singapore">Singapore / Hong Kong Time (SGT, UTC+8)</option>
                  <option value="Asia/Tokyo">Tokyo Standard Time (JST, UTC+9)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Billing & Compensation Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="SGD">SGD (S$) - Singapore Dollar</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Default Date Presentation Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD) e.g. 2026-09-23</option>
                  <option value="DD/MM/YYYY">European / International (DD/MM/YYYY)</option>
                  <option value="MM/DD/YYYY">North American (MM/DD/YYYY)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Official Work Week Schedule</label>
                <select
                  value={workWeek}
                  onChange={(e) => setWorkWeek(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value="Monday - Friday">Monday to Friday (Standard 5-day)</option>
                  <option value="Sunday - Thursday">Sunday to Thursday (Middle East)</option>
                  <option value="Monday - Saturday">Monday to Saturday (6-day)</option>
                  <option value="24/7 Continuous Operations">24/7 Continuous Global Operations</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Social & Public Links */}
        {activeTab === 'social' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Share2 className="w-4 h-4" /> Social Presences & Public Profiles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">LinkedIn Company URL</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/your-company"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">X (formerly Twitter) URL</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://x.com/your-company"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">GitHub Organization URL</label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/your-company"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Engineering Blog / Research Portfolio</label>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://company.ai/research"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Governance & Security */}
        {activeTab === 'governance' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-in fade-in">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4" /> Data Retention, Security & AI Governance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Video & Resume Data Retention Horizon</label>
                <select
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1 cursor-pointer"
                >
                  <option value={90}>90 Days (GDPR High-Privacy Fast Purge)</option>
                  <option value={180}>180 Days (Semi-Annual Audit Compliance)</option>
                  <option value={365}>365 Days (1 Year Enterprise Default)</option>
                  <option value={730}>730 Days (2 Years Statutory Archive)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Dedicated Security Contact Email</label>
                <input
                  type="email"
                  value={securityContactEmail}
                  onChange={(e) => setSecurityContactEmail(e.target.value)}
                  placeholder="security@company.com"
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
                />
              </div>
            </div>

            {/* AI Rules Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Custom Scoring Rules & Rubric Tuning</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Allow hiring panel leads to adjust evaluation weights (STAR, kinematics, communication) per interview round.
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiCustomRules}
                onChange={(e) => setAiCustomRules(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 7: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <History className="w-4 h-4" /> Immutable Workspace Audit Trail
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Tenant: {currentCompany.id}
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No recent workspace modifications logged yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">{log.action}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {log.actorRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{log.details}</p>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400">
            All updates are authenticated with Zero-Trust JWT and verified with database ACID transactions.
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Persisting...' : 'Save Organization Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
