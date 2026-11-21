import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientDashboard from './views/PatientDashboard';
import HospitalDashboard from './views/HospitalDashboard';
import LabDashboard from './views/LabDashboard';
import InsuranceDashboard from './views/InsuranceDashboard';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import AuditExplorer from './views/AuditExplorer';
import { fetchRoles } from './services/api';

// Fallback accounts in case API is loading or contracts just deployed
const DEFAULT_ACCOUNTS = {
  admin: { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', role: 'ADMIN', name: 'MediLedger Governance' },
  hospital: { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', role: 'HOSPITAL', name: 'Apollo Super Specialty Hospital', id: 'HOSP-DEL-2018-094' },
  lab: { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', role: 'DIAGNOSTIC_LAB', name: 'Metro PathLabs Diagnostic Network', id: 'NABL-MC-5421' },
  insurance: { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', role: 'INSURANCE_COMPANY', name: 'Star Health & Allied Insurance', id: 'IRDAI-HL-103' },
  patient1: { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', role: 'PATIENT', name: 'Jane Doe', id: 'MED-PAT-882194' },
  patient2: { address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', role: 'PATIENT', name: 'Rahul Sharma', id: 'MED-PAT-771923' }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'analytics', 'audit'
  const [activeRole, setActiveRole] = useState('patient1');
  const [roles, setRoles] = useState(DEFAULT_ACCOUNTS);
  const [contracts, setContracts] = useState({});

  useEffect(() => {
    fetchRoles()
      .then((data) => {
        if (data.accounts) setRoles(data.accounts);
        if (data.contracts) setContracts(data.contracts);
      })
      .catch((err) => {
        console.warn("Using default account configuration:", err.message);
      });
  }, []);

  const currentUser = roles[activeRole] || DEFAULT_ACCOUNTS.patient1;

  const renderDashboardByRole = () => {
    switch (currentUser.role) {
      case 'PATIENT':
        return <PatientDashboard currentUser={currentUser} activeRole={activeRole} roles={roles} />;
      case 'HOSPITAL':
        return <HospitalDashboard currentUser={currentUser} activeRole={activeRole} roles={roles} />;
      case 'DIAGNOSTIC_LAB':
        return <LabDashboard currentUser={currentUser} activeRole={activeRole} roles={roles} />;
      case 'INSURANCE_COMPANY':
        return <InsuranceDashboard currentUser={currentUser} activeRole={activeRole} roles={roles} />;
      default:
        return <PatientDashboard currentUser={currentUser} activeRole={activeRole} roles={roles} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        roles={roles}
        onRoleChange={setActiveRole}
        currentUser={currentUser}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboardByRole()}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'audit' && <AuditExplorer />}
      </main>

      {/* Footer / Network Status */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-slate-300">Local Hardhat EVM (31337) Active</span>
            </span>
            <span>•</span>
            <span>Hybrid Off-Chain + SHA-256 On-Chain Anchor</span>
          </div>
          <div className="text-center sm:text-right">
            <span>MediLedger Academic Project • MBA Finance & Healthcare Blockchain Research</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
