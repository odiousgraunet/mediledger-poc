import React, { useState, useEffect } from 'react';
import { Briefcase, ShieldCheck, ShieldAlert, Key, CheckCircle2, AlertOctagon, FileText, Search, RefreshCw, Zap } from 'lucide-react';
import RecordCard from '../components/RecordCard';
import RecordDetailModal from '../components/RecordDetailModal';
import VerificationModal from '../components/VerificationModal';
import {
  fetchAllRecords,
  fetchRequesterConsentRequests,
  requestRecordAccess,
  fetchRecordDetail,
  verifyRecordHash,
  simulateTamperAttempt
} from '../services/api';

export default function InsuranceDashboard({ currentUser, activeRole, roles }) {
  const [allRecords, setAllRecords] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecordData, setSelectedRecordData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [tamperSimulationResult, setTamperSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const [targetRecordId, setTargetRecordId] = useState('REC-2026-001');
  const [claimPurpose, setClaimPurpose] = useState('Cashless Claim Adjudication - Policy #STAR-8819');

  const loadData = async () => {
    if (!currentUser.address) return;
    setLoading(true);
    try {
      const [recRes, reqRes] = await Promise.all([
        fetchAllRecords(activeRole, currentUser.address).catch(() => ({ records: [] })),
        fetchRequesterConsentRequests(currentUser.address).catch(() => ({ requests: [] }))
      ]);
      setAllRecords(recRes.records || []);
      setSentRequests(reqRes.requests || []);
    } catch (err) {
      console.error("Error loading insurance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.address, activeRole]);

  const handleRequestConsent = async (recordId = null) => {
    const id = recordId || targetRecordId;
    if (!id) {
      alert("Please specify a Record ID");
      return;
    }
    setLoading(true);
    try {
      await requestRecordAccess(id, claimPurpose, activeRole, currentUser.address);
      alert(`Consent request for record ${id} submitted to patient on the blockchain.`);
      await loadData();
    } catch (err) {
      alert("Request failed: " + err.message);
    } finally {
      setLoading(false);
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

  const handleSimulateTamper = async (recordId = "REC-2026-001") => {
    setSimulating(true);
    try {
      const res = await simulateTamperAttempt(recordId);
      setTamperSimulationResult(res);
    } catch (err) {
      alert("Tamper simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Payer / Insurance Claims Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">IRDAI License: {currentUser.id || 'IRDAI-HL-103'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{currentUser.name}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Eliminates fraudulent claims and inflated billing by comparing submitted clinical documents against immutable hospital-signed SHA-256 fingerprints anchored on the blockchain.
            </p>
          </div>
          <button
            onClick={loadData}
            className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center space-x-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* Fraud Detection / Tampering Interactive Demonstration Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Interactive Anti-Fraud Demonstration (MBA Finance Core Focus)</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Experience how MediLedger prevents billing fraud. Click below to simulate a fraudulent claim where billing charges are altered by ₹150,000. The smart contract recalculates the SHA-256 digest and automatically rejects the fraudulent record.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleVerify("REC-2026-001")}
              className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Verify Authentic (Match)</span>
            </button>
            <button
              onClick={() => handleSimulateTamper("REC-2026-001")}
              disabled={simulating}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-red-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>{simulating ? 'Analyzing...' : '2. Simulate Fraud Tamper (Mismatch)'}</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Output Box */}
        {tamperSimulationResult && (
          <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-red-500/30 space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-red-400 flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4" />
                <span>FRAUD ATTEMPT DETECTED & AUTOMATICALLY REJECTED</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Decision: {tamperSimulationResult.blockchainDecision?.actionTaken}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Altered Field (Simulated Claim Injection)</span>
                <span className="text-white font-mono">{tamperSimulationResult.tamperedModifications?.fieldChanged}</span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Original: ₹{Number(tamperSimulationResult.tamperedModifications?.originalValue).toLocaleString('en-IN')} →{' '}
                  <span className="text-red-400 font-bold">Tampered: ₹{Number(tamperSimulationResult.tamperedModifications?.tamperedValue).toLocaleString('en-IN')} (+₹150,000)</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cryptographic Fingerprint Discrepancy</span>
                <div className="text-[10px] font-mono text-emerald-400 truncate">
                  Original: {tamperSimulationResult.originalOnChainHash?.slice(0, 24)}...
                </div>
                <div className="text-[10px] font-mono text-red-400 truncate">
                  Tampered: {tamperSimulationResult.tamperedHash?.slice(0, 24)}...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consent Request Engine */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span>Submit On-Chain Medical Record Consent Request</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Target Medical Record ID</label>
            <input
              type="text"
              value={targetRecordId}
              onChange={(e) => setTargetRecordId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Insurance Adjudication Purpose</label>
            <input
              type="text"
              value={claimPurpose}
              onChange={(e) => setClaimPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => handleRequestConsent()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/10"
            >
              Request Consent from Patient
            </button>
          </div>
        </div>
      </div>

      {/* Sent Consent Requests Status Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white">Submitted Claims Consent Requests ({sentRequests.length})</h4>
        {sentRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">No consent requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-3">Req ID</th>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Patient Address</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Consent Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {sentRequests.map((r) => {
                  const isApproved = r.status === 'APPROVED';
                  return (
                    <tr key={r.requestId} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-medium">{r.requestId}</td>
                      <td className="p-3 font-mono text-white font-semibold">{r.recordId}</td>
                      <td className="p-3 font-mono text-slate-400 truncate max-w-[150px]">{r.patient}</td>
                      <td className="p-3 text-slate-300 truncate max-w-[180px]">{r.purpose}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          r.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          r.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          r.status === 'REVOKED' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          'bg-slate-700 text-slate-300 border-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isApproved ? (
                          <button
                            onClick={() => handleViewRecord(r.recordId)}
                            className="px-3 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-lg font-medium inline-flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Record</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Awaiting Patient</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Network Records Verification Portfolio */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Network Records Claim Verification Desk ({allRecords.length})</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allRecords.map((rec) => {
            const hasConsent = sentRequests.some(r => r.recordId === rec.recordId && r.status === 'APPROVED');
            return (
              <RecordCard
                key={rec.recordId}
                record={rec}
                onView={handleViewRecord}
                onVerify={handleVerify}
                onRequestAccess={() => handleRequestConsent(rec.recordId)}
                userRole={currentUser.role}
                hasAccess={hasConsent}
              />
            );
          })}
        </div>
      </div>

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
