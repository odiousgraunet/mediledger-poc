import React, { useState, useEffect } from 'react';
import { FlaskConical, PlusCircle, CheckCircle2, ShieldCheck, Key, RefreshCw, Activity } from 'lucide-react';
import RecordCard from '../components/RecordCard';
import RecordDetailModal from '../components/RecordDetailModal';
import VerificationModal from '../components/VerificationModal';
import {
  fetchIssuerRecords,
  registerNewRecord,
  fetchRecordDetail,
  verifyRecordHash
} from '../services/api';

export default function LabDashboard({ currentUser, activeRole, roles }) {
  const [issuedReports, setIssuedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [selectedRecordData, setSelectedRecordData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // New Lab Report Form
  const [labForm, setLabForm] = useState({
    recordId: `REC-LAB-${Math.floor(1000 + Math.random() * 9000)}`,
    patientAddress: roles?.patient1?.address || '',
    patientName: 'Jane Doe',
    patientUhid: 'MED-PAT-882194',
    docType: 'LAB_REPORT',
    testPanel: 'Comprehensive Metabolic & Cardiac Panel',
    pathologist: 'Dr. Sunita Rao, MD (Pathology)',
    specimen: 'Serum & Whole Blood (EDTA)',
    interpretation: 'Elevated hs-Troponin-T and hs-CRP. Suggestive of acute myocardial inflammation.',
    results: [
      { test: 'High Sensitivity Troponin T', value: '0.19', unit: 'ng/mL', referenceRange: '< 0.014', flag: 'HIGH' },
      { test: 'Creatine Kinase (CK-MB)', value: '26.2', unit: 'U/L', referenceRange: '0 - 25', flag: 'HIGH' },
      { test: 'Total Cholesterol', value: '210', unit: 'mg/dL', referenceRange: '< 200', flag: 'BORDERLINE' },
      { test: 'hs-CRP', value: '5.2', unit: 'mg/L', referenceRange: '< 1.0', flag: 'ELEVATED' }
    ]
  });

  const loadData = async () => {
    if (!currentUser.address) return;
    setLoading(true);
    try {
      const res = await fetchIssuerRecords(currentUser.address, activeRole, currentUser.address);
      setIssuedReports(res.records || []);
    } catch (err) {
      console.error("Error loading lab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (roles?.patient1?.address && !labForm.patientAddress) {
      setLabForm(prev => ({ ...prev, patientAddress: roles.patient1.address }));
    }
  }, [currentUser.address, activeRole, roles]);

  const handleRegisterLabReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        recordId: labForm.recordId,
        patientAddress: labForm.patientAddress,
        docType: labForm.docType,
        clinicalData: {
          recordId: labForm.recordId,
          documentType: labForm.docType,
          patient: {
            name: labForm.patientName,
            uhid: labForm.patientUhid,
            wallet: labForm.patientAddress
          },
          laboratory: {
            name: currentUser.name,
            nablAccreditationNo: currentUser.id || 'NABL-MC-5421',
            pathologist: labForm.pathologist,
            specimen: labForm.specimen
          },
          testPanel: labForm.testPanel,
          results: labForm.results,
          interpretation: labForm.interpretation,
          metadata: {
            schemaVersion: 'FHIR-R4-DiagnosticReport',
            reportDate: new Date().toISOString()
          }
        }
      };

      await registerNewRecord(payload, activeRole, currentUser.address);
      alert(`Success! Lab report ${labForm.recordId} anchored to blockchain.`);
      setLabForm({
        recordId: `REC-LAB-${Math.floor(1000 + Math.random() * 9000)}`,
        patientAddress: roles?.patient1?.address || '',
        patientName: 'Jane Doe',
        patientUhid: 'MED-PAT-882194',
        docType: 'LAB_REPORT',
        testPanel: 'Comprehensive Metabolic Panel',
        pathologist: 'Dr. Sunita Rao, MD',
        specimen: 'Serum & Whole Blood',
        interpretation: 'Parameters analyzed within diagnostic thresholds.',
        results: [
          { test: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.2', flag: 'NORMAL' },
          { test: 'Blood Urea Nitrogen', value: '14', unit: 'mg/dL', referenceRange: '7 - 20', flag: 'NORMAL' }
        ]
      });
      setActiveTab('list');
      await loadData();
    } catch (err) {
      alert("Registration failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (recordId) => {
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
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Diagnostic Laboratory Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">NABL Accreditation: {currentUser.id || 'NABL-MC-5421'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{currentUser.name}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Issues tamper-proof diagnostic pathology and imaging fingerprints. Smart contract verification ensures results cannot be manipulated during insurance claim filings or medical malpractice reviews.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('new')}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-brand-500/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Lab Report</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'list' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Issued Diagnostic Reports ({issuedReports.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'new' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Create & Anchor Report
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span>Anchored Diagnostic Test Reports</span>
          </h3>
          {issuedReports.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No laboratory reports registered yet. Click "Issue Lab Report" to anchor a new report.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {issuedReports.map((rec) => (
                <RecordCard
                  key={rec.recordId}
                  record={rec}
                  onView={handleView}
                  onVerify={handleVerify}
                  userRole={currentUser.role}
                  hasAccess={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto shadow-xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Authenticated Diagnostic Report</h3>
              <p className="text-xs text-slate-400">Generates immutable SHA-256 fingerprint for patient & insurer verification</p>
            </div>
          </div>

          <form onSubmit={handleRegisterLabReport} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Record ID</label>
                <input
                  type="text"
                  value={labForm.recordId}
                  onChange={(e) => setLabForm({ ...labForm, recordId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Test Panel Name</label>
                <input
                  type="text"
                  value={labForm.testPanel}
                  onChange={(e) => setLabForm({ ...labForm, testPanel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Patient</label>
                <select
                  value={labForm.patientAddress}
                  onChange={(e) => {
                    const addr = e.target.value;
                    const isP1 = addr === roles?.patient1?.address;
                    setLabForm({
                      ...labForm,
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
                  value={labForm.patientName}
                  onChange={(e) => setLabForm({ ...labForm, patientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reporting Pathologist</label>
                <input
                  type="text"
                  value={labForm.pathologist}
                  onChange={(e) => setLabForm({ ...labForm, pathologist: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            {/* Test Results Table */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Diagnostic Biomarkers & Test Observations</span>
              </label>
              <div className="space-y-2">
                {labForm.results.map((r, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-white font-medium self-center">{r.test}</span>
                    <span className="font-mono text-emerald-400 font-bold self-center">{r.value} {r.unit}</span>
                    <span className="text-slate-400 self-center">Ref: {r.referenceRange}</span>
                    <span className="text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        r.flag === 'HIGH' || r.flag === 'ELEVATED' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {r.flag}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pathologist Clinical Interpretation</label>
              <textarea
                rows={2}
                value={labForm.interpretation}
                onChange={(e) => setLabForm({ ...labForm, interpretation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-brand-500/20 flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Mining Transaction...' : 'Anchor Lab Fingerprint to Ledger'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
