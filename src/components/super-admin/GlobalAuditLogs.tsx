import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { AppDataStore } from '../../services/storage';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Clock,
  User,
  Building2
} from 'lucide-react';

export const GlobalAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');

  const refreshLogs = () => {
    setLogs(AppDataStore.getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.companyName && l.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || l.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const exportLogs = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ardhnarishwar_audit_logs_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white">Global Security & Audit Trails</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, cross-tenant activity logs capturing all authorization events, AI evaluations, and administrative changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshLogs}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, actor, resource, or details..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Severity:</span>
          {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                severityFilter === sev 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' 
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Organization Tenant</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map(log => {
                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                        log.severity === 'WARNING' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                        'bg-cyan-950 text-cyan-300 border-cyan-800'
                      }`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap font-sans">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 whitespace-nowrap">
                      <div>{log.actorName}</div>
                      <div className="text-[10px] text-slate-500">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap">
                      {log.companyName || (log.companyId ? log.companyId.replace('comp_', '') : 'Global')}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">
                      <div className="font-semibold text-slate-200">{log.resource}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-md">{log.details}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
