import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle2, AlertTriangle, Key, FileText, Ban, RefreshCw, Eye } from 'lucide-react';
import RecordCard from '../components/RecordCard';
import ConsentModal from '../components/ConsentModal';
import RecordDetailModal from '../components/RecordDetailModal';
import VerificationModal from '../components/VerificationModal';
import {
  fetchPatientRecords,
  fetchPatientConsentRequests,
  grantRecordConsent,
  rejectRecordConsent,
  revokeActiveConsent,
  fetchRecordDetail,
  verifyRecordHash
} from '../services/api';

export default function PatientDashboard({ currentUser, activeRole }) {
  const [records, setRecords] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRecordData, setSelectedRecordData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const loadData = async () => {
    if (!currentUser.address) return;
    setLoading(true);
    try {
      const [recRes, reqRes] = await Promise.all([
        fetchPatientRecords(currentUser.address, activeRole, currentUser.address).catch(() => ({ records: [] })),
        fetchPatientConsentRequests(currentUser.address).catch(() => ({ requests: [] }))
      ]);
      setRecords(recRes.records || []);
      setRequests(reqRes.requests || []);
    } catch (err) {
      console.error("Error loading patient data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.address, activeRole]);

  const handleViewRecord = async (recordId) => {
    try {
      const detail = await fetchRecordDetail(recordId, activeRole, currentUser.address);
      setSelectedRecordData(detail);
    } catch (err) {
      alert("Failed to view record: " + err.message);
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

  const handleGrantConsent = async (requestId, durationInSeconds) => {
    await grantRecordConsent(requestId, durationInSeconds, activeRole, currentUser.address);
    await loadData();
  };

  const handleRejectConsent = async (requestId) => {
    await rejectRecordConsent(requestId, activeRole, currentUser.address);
    await loadData();
  };

  const handleRevokeConsent = async (requestId) => {
    if (!confirm("Are you sure you want to revoke active consent immediately on-chain?")) return;
    try {
      await revokeActiveConsent(requestId, activeRole, currentUser.address);
      await loadData();
    } catch (err) {
      alert("Failed to revoke consent: " + err.message);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeConsents = requests.filter(r => r.status === 'APPROVED');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Patient Identity Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">UHID: {currentUser.id || 'MED-PAT-882194'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Welcome, {currentUser.name}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              You possess autonomous cryptographic ownership of your healthcare records. No third party (hospital, diagnostic lab, or insurer) can access your records without your on-chain time-bound approval.
            </p>
          </div>
          <button
            onClick={loadData}
            className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center space-x-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Blockchain</span>
          </button>
        </div>
      </div>

      {/* Pending Consent Action Required Banner */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Action Required: {pendingRequests.length} Incoming Access Request(s)</span>
          </div>
          <p className="text-xs text-slate-300">
            Healthcare providers or insurance claim adjudicators have formally requested access to your medical records on the MediLedger smart contract.
          </p>
          <div className="space-y-2 mt-2">
            {pendingRequests.map((req) => (
              <div key={req.requestId} className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-white text-xs">{req.recordId}</span>
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Req #{req.requestId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium italic">"{req.purpose}"</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-md">Requester: {req.requester}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0 shadow-lg shadow-brand-500/10"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Review & Authorize</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Consents & Immediate Revocation Center */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Active Access Permissions & Instant Revocation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Third parties currently holding active, unexpired consent to access your medical records. You may revoke access at any time.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            {activeConsents.length} Active
          </span>
        </div>

        {activeConsents.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
            No active consents currently granted. Your medical data is strictly confidential.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-3">Req ID</th>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Authorized Entity</th>
                  <th className="p-3">Stated Purpose</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {activeConsents.map((c) => {
                  const isExpired = c.validUntil * 1000 < Date.now();
                  return (
                    <tr key={c.requestId} className="hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-medium">{c.requestId}</td>
                      <td className="p-3 font-mono text-white font-semibold">{c.recordId}</td>
                      <td className="p-3 font-mono text-slate-400 truncate max-w-[150px]">{c.requester}</td>
                      <td className="p-3 text-slate-300 max-w-[200px] truncate">{c.purpose}</td>
                      <td className="p-3 font-mono text-xs">
                        <span className={isExpired ? 'text-red-400' : 'text-emerald-400'}>
                          {new Date(c.validUntil * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRevokeConsent(c.requestId)}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke Now</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient's Anchored Records Portfolio */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-brand-400" />
              <span>My Anchored Medical Records ({records.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable SHA-256 cryptographic fingerprints anchored on the blockchain. Records remain securely off-chain.
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No medical records registered for this patient wallet yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {records.map((rec) => (
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

      {/* Modals */}
      {selectedRequest && (
        <ConsentModal
          request={selectedRequest}
          onGrant={handleGrantConsent}
          onReject={handleRejectConsent}
          onClose={() => setSelectedRequest(null)}
        />
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
