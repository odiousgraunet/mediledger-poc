import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, RefreshCw, Key, Filter, CheckCircle2, AlertTriangle, Hash, Clock } from 'lucide-react';
import { fetchAuditLogs, fetchAnalytics } from '../services/api';

export default function AuditExplorer() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, metricsRes] = await Promise.all([
        fetchAuditLogs(100).catch(() => ({ logs: [] })),
        fetchAnalytics().catch(() => null)
      ]);
      setLogs(logsRes.logs || []);
      setMetrics(metricsRes);
    } catch (err) {
      console.error("Error loading audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filterAction === 'ALL'
    ? logs
    : logs.filter(l => l.action === filterAction);

  const getActionBadge = (action) => {
    switch (action) {
      case 'RECORD_REGISTERED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'RECORD_VERIFIED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RECORD_ACCESSED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'CONSENT_REQUESTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'CONSENT_GRANTED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'CONSENT_REVOKED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'SECURITY_ALERT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Immutable Ledger Explorer
              </span>
              <span className="text-xs text-slate-400 font-mono">Chain ID: 31337 (Ethereum EVM)</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Audit Trail & Smart Contract Event Stream</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Append-only audit trail guaranteeing non-repudiation and forensic verifiability. Every record registration, consent grant, document retrieval, and verification attempt is permanently logged on the smart contract.
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

        {/* Blockchain Telemetry Bar */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Total Anchored Records</span>
              <span className="text-lg font-bold font-mono text-white">{metrics.ledgerMetrics?.totalRecordsAnchored || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Total Consent Requests</span>
              <span className="text-lg font-bold font-mono text-amber-400">{metrics.ledgerMetrics?.totalConsentRequests || 0}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Immutable Audit Events</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{metrics.ledgerMetrics?.totalAuditEvents || logs.length}</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">Hashing Standard</span>
              <span className="text-sm font-semibold text-emerald-400">SHA-256 (FIPS 180-4)</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Event Stream Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Smart Contract Event Stream ({filteredLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-400">Append-only chronological audit log from AuditLogger.sol</p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter Audit Logs by Action"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="ALL">All Actions</option>
              <option value="RECORD_REGISTERED">Record Registered</option>
              <option value="CONSENT_REQUESTED">Consent Requested</option>
              <option value="CONSENT_GRANTED">Consent Granted</option>
              <option value="CONSENT_REVOKED">Consent Revoked</option>
              <option value="RECORD_ACCESSED">Record Accessed</option>
              <option value="RECORD_VERIFIED">Record Verified</option>
              <option value="SECURITY_ALERT">Security Alert</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No audit events match current filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Record</th>
                  <th className="p-3">Actor Wallet</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-medium text-slate-400">#{log.logId}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getActionBadge(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-white font-semibold">{log.recordId || 'SYSTEM'}</td>
                    <td className="p-3 font-mono text-slate-400 truncate max-w-[140px]">{log.actor}</td>
                    <td className="p-3 text-slate-300 max-w-[220px] truncate">{log.detail}</td>
                    <td className="p-3 text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp * 1000).toLocaleTimeString()}
                    </td>
                    <td className="p-3 text-right">
                      {log.status ? (
                        <span className="text-emerald-400 font-semibold text-[11px] inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold text-[11px] inline-flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>BLOCKED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
