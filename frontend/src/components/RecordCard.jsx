import React from 'react';
import { FileText, ShieldCheck, Clock, Key, Eye, CheckCircle2, XCircle } from 'lucide-react';

export default function RecordCard({ record, onView, onVerify, onRequestAccess, userRole, hasAccess = true }) {
  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'DISCHARGE_SUMMARY':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'LAB_REPORT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MRI_SCAN':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'CARDIOLOGY_ECHO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HISTOPATHOLOGY':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const formattedDate = record.createdAt
    ? new Date(record.createdAt * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recent';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-slate-800 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-white tracking-tight">{record.recordId}</h4>
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getDocTypeBadge(record.docType)}`}>
            {record.docType.replace('_', ' ')}
          </span>
        </div>

        {/* SHA-256 Fingerprint */}
        <div className="mt-4 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center space-x-1 font-medium">
              <Key className="w-3 h-3 text-brand-400" />
              <span>SHA-256 Fingerprint</span>
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center space-x-0.5 font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>On-Chain Verified</span>
            </span>
          </div>
          <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/50 p-1.5 rounded border border-slate-800 select-all">
            {record.documentHash}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Patient Wallet</span>
            <span className="font-mono text-slate-300">
              {record.patient ? `${record.patient.slice(0, 6)}...${record.patient.slice(-4)}` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Issuer Wallet</span>
            <span className="font-mono text-slate-300">
              {record.issuer ? `${record.issuer.slice(0, 6)}...${record.issuer.slice(-4)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {hasAccess ? (
          <button
            onClick={() => onView(record.recordId)}
            className="flex-1 py-1.5 px-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-brand-200 border border-brand-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Record</span>
          </button>
        ) : (
          <button
            onClick={() => onRequestAccess && onRequestAccess(record.recordId)}
            className="flex-1 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Request Consent</span>
          </button>
        )}

        <button
          onClick={() => onVerify(record.recordId)}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
          title="Verify cryptographic integrity against blockchain"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Verify Hash</span>
        </button>
      </div>
    </div>
  );
}
