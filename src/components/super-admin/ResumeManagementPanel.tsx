import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  Calendar, 
  HardDrive, 
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';
import { useTenant } from '../../context/TenantContext';

interface ResumeRecord {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  company_id?: string;
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  status: string;
  download_url: string;
  uploaded_at: string;
}

export const ResumeManagementPanel: React.FC = () => {
  const { allCompanies } = useTenant();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [totalResumes, setTotalResumes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.listResumes({
        search: searchTerm || undefined,
        status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
        company_id: companyFilter !== 'ALL' ? companyFilter : undefined,
        limit: 100
      });

      if (res.data) {
        setResumes(res.data.resumes || []);
        setTotalResumes(res.data.total || 0);
      } else {
        setResumes([]);
        setTotalResumes(0);
      }
    } catch (err) {
      console.warn('Failed to load resumes:', err);
      setResumes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [statusFilter, companyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResumes();
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const res = await ApiClient.deleteResume(resumeId);
      if (res.data?.success) {
        setActionMessage({ type: 'success', text: 'Resume deleted successfully from storage vault and database.' });
        setDeleteConfirmId(null);
        if (selectedResume?.id === resumeId) setSelectedResume(null);
        fetchResumes();
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Failed to delete resume.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network error deleting resume.' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const API_BASE_URL: string =
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Global Resume Management Vault
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Centralized repository for all candidate resumes across client tenants with verified metadata and secure streaming.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchResumes}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-xl text-sm font-semibold">
              Total Resumes: {totalResumes}
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-fadeIn ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name, email, filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="VERIFIED">Verified</option>
              <option value="PARSED">Parsed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Organizations</option>
              {allCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Table + Metadata Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumes List Table (2 Cols on Large Screens) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Candidate Resume Vault ({resumes.length})
            </h2>
            <span className="text-xs text-slate-400">PDF • DOC • DOCX Storage</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
              <p className="text-sm">Querying database resume records...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No resumes uploaded yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                When candidates self-register or submit job applications, their verified resume files will be indexed and managed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">File Name</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Uploaded</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {resumes.map((r) => {
                    const isSelected = selectedResume?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedResume(r)}
                        className={`cursor-pointer transition hover:bg-slate-800/50 ${
                          isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-500' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white">{r.candidate_name}</div>
                          <div className="text-xs text-slate-400">{r.candidate_email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-slate-200 font-mono text-xs">
                            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{r.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {formatFileSize(r.file_size_bytes)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {formatDate(r.uploaded_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`${API_BASE_URL}${r.download_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition"
                              title="Download / View Resume"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => setDeleteConfirmId(r.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                              title="Delete Resume Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resume Detail & Metadata Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Resume Metadata & Dossier</span>
            </div>

            {selectedResume ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Target Candidate</div>
                  <div className="text-base font-bold text-white">{selectedResume.candidate_name}</div>
                  <div className="text-xs text-slate-400">{selectedResume.candidate_email}</div>
                  <div className="text-xs font-mono text-cyan-400 mt-2">ID: {selectedResume.candidate_id}</div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">File Name:</span>
                    <span className="text-white font-mono text-right truncate max-w-[180px]">{selectedResume.file_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">File Size:</span>
                    <span className="text-white">{formatFileSize(selectedResume.file_size_bytes)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">MIME Type:</span>
                    <span className="text-white font-mono">{selectedResume.file_type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Vault Status:</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-semibold">
                      {selectedResume.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Uploaded At:</span>
                    <span className="text-slate-300">{formatDate(selectedResume.uploaded_at)}</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <a
                    href={`${API_BASE_URL}${selectedResume.download_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Open / Download Resume File
                  </a>
                  <button
                    onClick={() => setDeleteConfirmId(selectedResume.id)}
                    className="w-full py-2 bg-slate-950 hover:bg-rose-950 text-rose-400 border border-rose-900/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete From Vault
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Select any resume from the table to inspect its metadata, file parameters, and candidate association.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Resume Deletion</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to permanently delete this resume from disk storage and the database? This action is irreversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteResume(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
