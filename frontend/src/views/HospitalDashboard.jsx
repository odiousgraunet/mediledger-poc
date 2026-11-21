import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Search, FileText, CheckCircle2, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import RecordCard from '../components/RecordCard';
import RecordDetailModal from '../components/RecordDetailModal';
import VerificationModal from '../components/VerificationModal';
import {
  fetchIssuerRecords,
  registerNewRecord,
  requestRecordAccess,
  fetchRecordDetail,
  verifyRecordHash,
  fetchAllRecords
} from '../services/api';

export default function HospitalDashboard({ currentUser, activeRole, roles }) {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [allNetworkRecords, setAllNetworkRecords] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('issued'); // 'issued', 'register', 'network'
  const [loading, setLoading] = useState(false);
  const [selectedRecordData, setSelectedRecordData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // New Record Form State
  const [formData, setFormData] = useState({
    recordId: `REC-HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
    patientAddress: roles?.patient1?.address || '',
    patientName: 'Jane Doe',
    patientUhid: 'MED-PAT-882194',
    docType: 'DISCHARGE_SUMMARY',
    primaryDiagnosis: 'Acute Coronary Syndrome - Conservative Management',
    treatingConsultant: 'Dr. Aris Thorne, MD, DM (Cardiology)',
    courseInHospital: 'Patient admitted via emergency with angina symptoms. Stabilized, observed for 72 hours, cardiac markers normal on discharge.',
    totalAmountINR: 92400,
    claimId: 'CLM-APOLLO-2026-9041'
  });

  const [requestTargetRecord, setRequestTargetRecord] = useState('');
  const [requestPurpose, setRequestPurpose] = useState('Secondary Referral & Emergency Treatment Review');

  const loadData = async () => {
    if (!currentUser.address) return;
    setLoading(true);
    try {
      const [issuedRes, allRes] = await Promise.all([
        fetchIssuerRecords(currentUser.address, activeRole, currentUser.address).catch(() => ({ records: [] })),
        fetchAllRecords(activeRole, currentUser.address).catch(() => ({ records: [] }))
      ]);
      setIssuedRecords(issuedRes.records || []);
      setAllNetworkRecords(allRes.records || []);
    } catch (err) {
      console.error("Error loading hospital data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (roles?.patient1?.address && !formData.patientAddress) {
      setFormData(prev => ({ ...prev, patientAddress: roles.patient1.address }));
    }
  }, [currentUser.address, activeRole, roles]);

  const handleRegisterRecord = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        recordId: formData.recordId,
        patientAddress: formData.patientAddress,
        docType: formData.docType,
        clinicalData: {
          recordId: formData.recordId,
          documentType: formData.docType,
          patient: {
            name: formData.patientName,
            uhid: formData.patientUhid,
            wallet: formData.patientAddress
          },
          facility: {
            name: currentUser.name,
            registrationNo: currentUser.id || 'HOSP-DEL-2018-094',
            treatingConsultant: formData.treatingConsultant
          },
          clinicalDetails: {
            primaryDiagnosis: formData.primaryDiagnosis,
            courseInHospital: formData.courseInHospital,
            admissionDate: new Date(Date.now() - 3 * 86400000).toISOString(),
            dischargeDate: new Date().toISOString()
          },
          billingSummary: {
            totalAmountINR: Number(formData.totalAmountINR),
            preAuthClaimId: formData.claimId
          }
        }
      };

      await registerNewRecord(payload, activeRole, currentUser.address);
      alert(`Success! Record ${formData.recordId} anchored on the blockchain with SHA-256 fingerprint.`);
      setFormData({
        recordId: `REC-HOSP-${Math.floor(1000 + Math.random() * 9000)}`,
        patientAddress: roles?.patient1?.address || '',
        patientName: 'Jane Doe',
        patientUhid: 'MED-PAT-882194',
        docType: 'DISCHARGE_SUMMARY',
        primaryDiagnosis: 'Acute Coronary Syndrome',
        treatingConsultant: 'Dr. Aris Thorne, MD',
        courseInHospital: 'Patient stabilized and discharged.',
        totalAmountINR: 85000,
        claimId: `CLM-APOLLO-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setActiveSubTab('issued');
      await loadData();
    } catch (err) {
      alert("Registration failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (recordId = null) => {
    const target = recordId || requestTargetRecord;
    if (!target) {
      alert("Please specify a Target Record ID");
      return;
    }
    try {
      await requestRecordAccess(target, requestPurpose, activeRole, currentUser.address);
      alert(`Access request for ${target} submitted to patient on the smart contract.`);
      setRequestTargetRecord('');
    } catch (err) {
      alert("Access request failed: " + err.message);
    }
  };

  const handleViewRecord = async (recordId) => {
    try {
      const detail = await fetchRecordDetail(recordId, activeRole, currentUser.address);
      setSelectedRecordData(detail);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerify = async (recordId) => {
    try {
      const res = await verifyRecordHash(recordId, null, activeRole, currentUser.address);
      setVerificationResult(res);
    } catch (err) {
      alert("Verification failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Healthcare Provider Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id || 'HOSP-DEL-2018-094'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{currentUser.name}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Anchors clinical documents to the blockchain via SHA-256 digests. Off-chain medical records remain confidential while cryptographic non-repudiation protects hospitals against liability and malpractice disputes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('register')}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-brand-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue New Record</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('issued')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'issued' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hospital Issued Records ({issuedRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab('register')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'register' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Register & Anchor New Record
          </button>
          <button
            onClick={() => setActiveSubTab('network')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'network' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Network Explorer & Consent Requests
          </button>
        </div>
      </div>

      {/* TAB 1: Issued Records */}
      {activeSubTab === 'issued' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Records Issued By This Hospital</span>
            </h3>
          </div>
          {issuedRecords.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No records issued yet. Click "Issue New Record" to anchor a patient record on-chain.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {issuedRecords.map((rec) => (
                <RecordCard
                  key={rec.recordId}
                  record={rec}
                  onView={handleViewRecord}
                  onVerify={handleVerify}
                  userRole={currentUser.role}
                  hasAccess={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Register New Record Form */}
      {activeSubTab === 'register' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Anchor New Clinical Record on Blockchain</h3>
              <p className="text-xs text-slate-400">Stores document off-chain & registers cryptographic SHA-256 fingerprint on-chain</p>
            </div>
          </div>

          <form onSubmit={handleRegisterRecord} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Record ID</label>
                <input
                  type="text"
                  value={formData.recordId}
                  onChange={(e) => setFormData({ ...formData, recordId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Type</label>
                <select
                  value={formData.docType}
                  onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="CARDIOLOGY_REPORT">Cardiology Report</option>
                  <option value="SURGERY_NOTES">Surgery Notes</option>
                  <option value="EMERGENCY_CONSULTATION">Emergency Consultation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Patient Wallet</label>
                <select
                  value={formData.patientAddress}
                  onChange={(e) => {
                    const addr = e.target.value;
                    const isP1 = addr === roles?.patient1?.address;
                    setFormData({
                      ...formData,
                      patientAddress: addr,
                      patientName: isP1 ? 'Jane Doe' : 'Rahul Sharma',
                      patientUhid: isP1 ? 'MED-PAT-882194' : 'MED-PAT-771923'
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                >
                  <option value={roles?.patient1?.address || ''}>Jane Doe (Patient 1)</option>
                  <option value={roles?.patient2?.address || ''}>Rahul Sharma (Patient 2)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Patient Name</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">UHID</label>
                <input
                  type="text"
                  value={formData.patientUhid}
                  onChange={(e) => setFormData({ ...formData, patientUhid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Primary Clinical Diagnosis</label>
              <input
                type="text"
                value={formData.primaryDiagnosis}
                onChange={(e) => setFormData({ ...formData, primaryDiagnosis: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course in Hospital / Treatment Notes</label>
              <textarea
                rows={3}
                value={formData.courseInHospital}
                onChange={(e) => setFormData({ ...formData, courseInHospital: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hospital Incurred Bill (INR)</label>
                <input
                  type="number"
                  value={formData.totalAmountINR}
                  onChange={(e) => setFormData({ ...formData, totalAmountINR: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pre-Auth / Insurance Claim ID</label>
                <input
                  type="text"
                  value={formData.claimId}
                  onChange={(e) => setFormData({ ...formData, claimId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Mining Transaction...' : 'Anchor Record to Blockchain'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Network Explorer & Consent Request */}
      {activeSubTab === 'network' && (
        <div className="space-y-6">
          {/* Quick Consent Request Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Request Medical Record Consent from Patient</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Target Record ID (e.g. REC-2026-002)"
                value={requestTargetRecord}
                onChange={(e) => setRequestTargetRecord(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
              />
              <input
                type="text"
                placeholder="Clinical Purpose"
                value={requestPurpose}
                onChange={(e) => setRequestPurpose(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
              />
              <button
                onClick={() => handleRequestAccess()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Submit Smart Contract Request</span>
              </button>
            </div>
          </div>

          {/* All Network Records */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">All Anchored Records on Ledger ({allNetworkRecords.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allNetworkRecords.map((rec) => {
                const isMine = rec.issuer.toLowerCase() === currentUser.address?.toLowerCase();
                return (
                  <RecordCard
                    key={rec.recordId}
                    record={rec}
                    onView={handleViewRecord}
                    onVerify={handleVerify}
                    onRequestAccess={() => handleRequestAccess(rec.recordId)}
                    userRole={currentUser.role}
                    hasAccess={isMine}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedRecordData && (
        <RecordDetailModal
          recordData={selectedRecordData}
          onClose={() => setSelectedRecordData(null)}
        />
      )}

      {verificationResult && (
        <VerificationModal
          result={verificationResult}
          onClose={() => setVerificationResult(null)}
        />
      )}
    </div>
  );
}
