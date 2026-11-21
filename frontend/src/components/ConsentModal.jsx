import React, { useState } from 'react';
import { X, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ConsentModal({ request, onGrant, onReject, onClose }) {
  const [duration, setDuration] = useState(86400); // Default 24 hours
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleGrant = async () => {
    setLoading(true);
    try {
      await onGrant(request.requestId, duration);
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(request.requestId);
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Patient Consent Authorization</h3>
              <p className="text-xs text-slate-400">Request #{request.requestId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Medical Record:</span>
              <span className="font-mono text-white font-semibold">{request.recordId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Requesting Entity:</span>
              <span className="font-mono text-slate-300 truncate max-w-[200px]">{request.requester}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-1 font-medium">Stated Purpose of Access:</span>
              <p className="text-slate-200 bg-slate-900/60 p-2 rounded border border-slate-800 italic">
                "{request.purpose}"
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Select Access Expiration Window:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDuration(3600)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  duration === 3600
                    ? 'bg-brand-500/20 border-brand-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">1 Hour</div>
                <div className="text-[10px] text-slate-400">Emergency / Quick</div>
              </button>

              <button
                type="button"
                onClick={() => setDuration(86400)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  duration === 86400
                    ? 'bg-brand-500/20 border-brand-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">24 Hours</div>
                <div className="text-[10px] text-slate-400">Standard OPD / Lab</div>
              </button>

              <button
                type="button"
                onClick={() => setDuration(604800)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  duration === 604800
                    ? 'bg-brand-500/20 border-brand-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">7 Days</div>
                <div className="text-[10px] text-slate-400">Claim Adjudication</div>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Under MediLedger's patient-controlled architecture, you retain full rights to execute an immediate smart contract revocation at any time before the expiration period lapses.
            </span>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-medium transition-colors"
          >
            Reject Request
          </button>
          <button
            onClick={handleGrant}
            disabled={loading}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-brand-500/20"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Grant Patient Consent</span>
          </button>
        </div>
      </div>
    </div>
  );
}
