import React from 'react';
import { X, ShieldCheck, FileText, User, Building, Calendar, DollarSign, Activity, Pill, Download } from 'lucide-react';

export default function RecordDetailModal({ recordData, onClose }) {
  if (!recordData) return null;

  const { record, documentContent, accessReason } = recordData;
  const content = documentContent || {};

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${record.recordId}_authenticated.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{record.recordId}</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {record.docType}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Access: {accessReason}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Off-Chain Clinical Document securely authenticated by MediLedger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Cryptographic Seal Banner */}
          <div className="bg-slate-950 border border-brand-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-brand-400 font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>On-Chain Cryptographic Anchor (SHA-256)</span>
              </div>
              <div className="font-mono text-xs text-slate-300 mt-1 break-all select-all">
                {record.documentHash}
              </div>
            </div>
            <button
              onClick={downloadJson}
              className="ml-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Patient & Facility Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Patient Profile</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-white font-medium">{content.patient?.name || 'Jane Doe'}</p>
                <p className="text-xs text-slate-400">UHID: <span className="font-mono text-slate-300">{content.patient?.uhid || 'MED-PAT-882194'}</span></p>
                <p className="text-xs text-slate-400">Demographics: {content.patient?.age || 34} yrs • {content.patient?.gender || 'Female'} {content.patient?.bloodGroup && `• ${content.patient.bloodGroup}`}</p>
              </div>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>Healthcare Facility / Provider</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-white font-medium">{content.facility?.name || content.laboratory?.name || content.imagingCenter?.name || 'Apollo Super Specialty Hospital'}</p>
                <p className="text-xs text-slate-400">Consultant: {content.facility?.treatingConsultant || content.laboratory?.pathologist || content.imagingCenter?.radiologist || 'Dr. Aris Thorne, MD'}</p>
                <p className="text-xs text-slate-400">Accreditation: {content.facility?.registrationNo || content.laboratory?.nablAccreditationNo || 'NABL-MC-5421'}</p>
              </div>
            </div>
          </div>

          {/* Clinical Findings / Diagnostic Section */}
          {content.clinicalDetails && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-red-400" />
                <span>Clinical Diagnosis & Summary</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Primary Diagnosis: </span>
                  <span className="text-slate-200">{content.clinicalDetails.primaryDiagnosis}</span>
                </div>
                {content.clinicalDetails.courseInHospital && (
                  <div>
                    <span className="text-slate-400 font-medium">Course in Hospital: </span>
                    <span className="text-slate-300">{content.clinicalDetails.courseInHospital}</span>
                  </div>
                )}
                {content.clinicalDetails.investigationsSummary && (
                  <div>
                    <span className="text-slate-400 font-medium">Investigations: </span>
                    <span className="text-slate-300">{content.clinicalDetails.investigationsSummary}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lab Test Results Panel */}
          {content.results && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Diagnostic Test Panel: {content.testPanel}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2">Test Name</th>
                      <th className="p-2">Observed Value</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Biological Reference</th>
                      <th className="p-2">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {content.results.map((res, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-2 font-medium">{res.test}</td>
                        <td className="p-2 font-mono font-bold text-white">{res.value}</td>
                        <td className="p-2 text-slate-400">{res.unit}</td>
                        <td className="p-2 text-slate-400">{res.referenceRange}</td>
                        <td className="p-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            res.flag === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {res.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medications Section */}
          {content.clinicalDetails?.dischargeMedications && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <Pill className="w-3.5 h-3.5 text-amber-400" />
                <span>Discharge Medications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {content.clinicalDetails.dischargeMedications.map((med, i) => (
                  <div key={i} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <p className="font-semibold text-white">{med.medication}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{med.dosage}</p>
                    <p className="text-slate-500 text-[10px]">{med.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing & Claim Information */}
          {content.billingSummary && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Insurance Claim & Billing Audit</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Pre-Auth Claim ID: <span className="font-mono text-slate-200">{content.billingSummary.preAuthClaimId}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ₹{Number(content.billingSummary.totalAmountINR).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400">Admitted Hospital Charges</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
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
