import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Company } from '../../types';
import { Settings, Building2, Users, Save, CheckCircle2, Shield, HardDrive } from 'lucide-react';

export const CompanySettings: React.FC = () => {
  const { currentCompany, updateCompany } = useTenant();
  const [name, setName] = useState(currentCompany?.name || '');
  const [contactEmail, setContactEmail] = useState(currentCompany?.contactEmail || '');
  const [contactPerson, setContactPerson] = useState(currentCompany?.contactPerson || '');
  const [industry, setIndustry] = useState(currentCompany?.industry || '');
  const [aiCustomRules, setAiCustomRules] = useState(currentCompany?.aiCustomRulesEnabled ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentCompany) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany({
      ...currentCompany,
      name,
      contactEmail,
      contactPerson,
      industry,
      aiCustomRulesEnabled: aiCustomRules,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Company Workspace Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure organization branding, recruiter team permissions, and workspace parameters.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" /> Settings Updated!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building2 className="w-4 h-4 text-cyan-400" /> Organization Profile
        </h2>

        <div>
          <label className="text-xs font-semibold text-slate-300">Company Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Primary Contact Person</label>
            <input
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Contact Email</label>
            <input
              required
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-cyan-500 mt-1"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> AI Engine Rules & Permissions
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Custom Scoring Rules & Rubric Tuning</div>
              <div className="text-[11px] text-slate-400">Allow company recruiters to override rubric weights for specialized roles.</div>
            </div>
            <input
              type="checkbox"
              checked={aiCustomRules}
              onChange={(e) => setAiCustomRules(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Organization Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
