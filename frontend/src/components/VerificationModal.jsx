import React from 'react';
import { X, ShieldCheck, ShieldAlert, Key, CheckCircle2, AlertOctagon, ExternalLink, Hash } from 'lucide-react';

export default function VerificationModal({ result, onClose }) {
  if (!result) return null;

  const data = result.verificationResult || result;
  const isMatch = data.isAuthentic || data.hashMatch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-xl ${
              isMatch ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {isMatch ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cryptographic Record Verification</h3>
              <p className="text-xs text-slate-400">Target Record: <span className="font-mono text-slate-200">{data.recordId}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs">
          {/* Result Banner */}
          <div className={`p-4 rounded-xl border flex items-center space-x-3 ${
            isMatch
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {isMatch ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertOctagon className="w-6 h-6 shrink-0" />}
            <div>
              <h4 className="font-bold text-sm">
                {isMatch ? '100% CRYPTOGRAPHIC INTEGRITY CONFIRMED' : 'FRAUD ALERT: RECORD TAMPERING DETECTED'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {isMatch
                  ? 'The calculated SHA-256 digest of the off-chain clinical document exactly matches the immutable anchor on the Ethereum smart contract.'
                  : 'The calculated SHA-256 digest differs from the immutable smart contract anchor. Unauthorized post-issuance alteration or fraudulent billing modification detected!'}
              </p>
            </div>
          </div>

          {/* Hash Comparison Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="font-semibold uppercase tracking-wider flex items-center space-x-1">
                  <Hash className="w-3.5 h-3.5 text-brand-400" />
                  <span>Smart Contract Immutable Fingerprint:</span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px]">On-Chain Origin</span>
              </div>
              <div className="p-2 bg-slate-900 rounded font-mono text-xs text-slate-200 break-all border border-slate-800 select-all">
                {data.onChainHash || data.originalOnChainHash || 'N/A'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="font-semibold uppercase tracking-wider flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  <span>Calculated SHA-256 Digest (Tested Payload):</span>
                </span>
                <span className="text-blue-400 font-mono text-[10px]">Computed Off-Chain</span>
              </div>
              <div className={`p-2 bg-slate-900 rounded font-mono text-xs break-all border select-all ${
                isMatch ? 'text-emerald-300 border-emerald-500/30' : 'text-red-300 border-red-500/30'
              }`}>
                {data.computedHash || data.tamperedHash || 'N/A'}
              </div>
            </div>
          </div>

          {/* Verification Audit Details */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <div>
              <span className="text-slate-500 block">Verification Transaction</span>
              <span className="font-mono text-slate-300 truncate block">
                {data.transactionHash || data.blockchainDecision?.auditTransactionHash || 'Local EVM Tx Receipt'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Verification Timestamp</span>
              <span className="text-slate-300 block">{data.verifiedAt || new Date().toISOString()}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
