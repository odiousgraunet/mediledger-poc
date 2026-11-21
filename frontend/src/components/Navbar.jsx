import React from 'react';
import { Shield, Activity, User, Building2, FlaskConical, Briefcase, BarChart3, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeRole, roles, onRoleChange, currentUser }) {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'PATIENT':
        return <User className="w-4 h-4 text-emerald-400" />;
      case 'HOSPITAL':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'DIAGNOSTIC_LAB':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'INSURANCE_COMPANY':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      default:
        return <Shield className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'PATIENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'HOSPITAL':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'DIAGNOSTIC_LAB':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'INSURANCE_COMPANY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-emerald-400/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  MediLedger
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  EVM Network
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Patient-Controlled Medical Authentication & Consent
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>MBA Economics</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Audit Trail</span>
            </button>
          </nav>

          {/* Active Role Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              {getRoleIcon(currentUser.role)}
              <div className="text-left hidden sm:block">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                  {currentUser.address ? `${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}` : '0x...'}
                </div>
              </div>

              {/* Quick Role Switch Dropdown */}
              <select
                aria-label="Active Role Selection"
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="patient1">Patient (Jane Doe)</option>
                <option value="patient2">Patient (Rahul Sharma)</option>
                <option value="hospital">Hospital (Apollo Hospital)</option>
                <option value="lab">Diagnostic Lab (Metro Path)</option>
                <option value="insurance">Insurance (Star Health)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
