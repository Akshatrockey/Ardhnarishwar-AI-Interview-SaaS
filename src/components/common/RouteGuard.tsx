import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { UserRole } from '../../types';
import { ShieldAlert, Lock, ArrowLeft, LogOut } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRedirectToDashboard?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  onRedirectToDashboard,
}) => {
  const { currentUser, role, logout } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white text-center">
        <div className="max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black">Authentication Required</h2>
          <p className="text-xs text-slate-400">
            You must be logged in to access this internal portal. Please authenticate first.
          </p>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/30"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  const hasRole = allowedRoles.includes(role);

  if (!hasRole) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white text-center animate-in fade-in">
        <div className="max-w-md p-8 rounded-3xl bg-slate-900 border border-rose-900/60 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/90 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              403 FORBIDDEN
            </span>
            <h2 className="text-xl font-black text-white">Access Denied</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your active role (<strong>{role}</strong>) does not possess authorization to view this portal.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            Required Permissions: {allowedRoles.join(', ')}
          </div>

          <div className="flex gap-2 pt-2">
            {onRedirectToDashboard && (
              <button
                onClick={onRedirectToDashboard}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>My Dashboard</span>
              </button>
            )}
            <button
              onClick={() => logout()}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

interface TenantGuardProps {
  requiredCompanyId?: string;
  children: React.ReactNode;
}

export const TenantGuard: React.FC<TenantGuardProps> = ({
  requiredCompanyId,
  children,
}) => {
  const { currentUser, role } = useAuth();
  const { currentCompany } = useTenant();

  // Super Admin can inspect all tenants
  if (role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Verify company match
  const userCompanyId = currentUser?.companyId || currentCompany?.id;
  if (requiredCompanyId && userCompanyId && userCompanyId !== requiredCompanyId) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-2 text-rose-200 text-xs">
        <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto" />
        <h4 className="font-bold">Tenant Isolation Violation</h4>
        <p>You cannot access resources belonging to a different company account.</p>
      </div>
    );
  }

  return <>{children}</>;
};
