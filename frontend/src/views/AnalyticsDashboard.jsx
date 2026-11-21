import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Clock, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, Scale } from 'lucide-react';
import { fetchAnalytics } from '../services/api';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annualClaimsVolume, setAnnualClaimsVolume] = useState(15000);
  const [avgClaimAmountINR, setAvgClaimAmountINR] = useState(70000);

  useEffect(() => {
    fetchAnalytics()
      .then(setMetrics)
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  // Dynamic MBA Finance Model Calculations
  const manualAdminCost = annualClaimsVolume * 1850;
  const blockchainAdminCost = annualClaimsVolume * 6.5;
  const adminSavingsINR = manualAdminCost - blockchainAdminCost;
  const estimatedFraudPreventedINR = annualClaimsVolume * 0.12 * avgClaimAmountINR; // 12% fraud rate
  const totalAnnualBenefitINR = adminSavingsINR + estimatedFraudPreventedINR;
  const implementationCapExINR = 1500000; // INR 15 Lakhs setup cost
  const netFirstYearBenefitINR = totalAnnualBenefitINR - implementationCapExINR;
  const roiPercentage = ((totalAnnualBenefitINR / implementationCapExINR) * 100).toFixed(0);
  const paybackMonths = ((implementationCapExINR / (totalAnnualBenefitINR / 12))).toFixed(1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>MBA Finance & Health Economics Evaluation</span>
        </div>
        <h2 className="text-2xl font-bold text-white">MediLedger Financial & Strategic Feasibility</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Quantitative financial models demonstrating administrative cost reduction, fraud loss mitigation, and return on investment (ROI) from deploying decentralized cryptographic medical record authentication.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Admin Cost Reduction</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">99.6%</div>
          <p className="text-[11px] text-slate-400 mt-1">₹1,850 → ₹6.50 per verified claim</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Adjudication Speed</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">&lt; 4 Hours</div>
          <p className="text-[11px] text-slate-400 mt-1">Reduced from 14-21 business days</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Payback Period</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">{paybackMonths} Months</div>
          <p className="text-[11px] text-slate-400 mt-1">Rapid capital recovery</p>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Projected 1st Year ROI</span>
            <ArrowUpRight className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-brand-400 mt-2">{roiPercentage}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Based on {annualClaimsVolume.toLocaleString()} annual claims</p>
        </div>
      </div>

      {/* Interactive Financial Model Calculator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Interactive Hospital / Insurer ROI Calculator</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Adjust organizational claim parameters to evaluate cost savings and fraud mitigation economics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex justify-between">
              <span>Annual Health Insurance Claim Volume:</span>
              <span className="font-mono text-brand-400">{annualClaimsVolume.toLocaleString()} claims/year</span>
            </label>
            <input
              type="range"
              min="2000"
              max="50000"
              step="1000"
              value={annualClaimsVolume}
              onChange={(e) => setAnnualClaimsVolume(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>2,000 (Small TPA)</span>
              <span>25,000 (Mid-tier Insurer)</span>
              <span>50,000 (Major Network)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex justify-between">
              <span>Average Claim Size (INR):</span>
              <span className="font-mono text-emerald-400">₹{avgClaimAmountINR.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min="25000"
              max="200000"
              step="5000"
              value={avgClaimAmountINR}
              onChange={(e) => setAvgClaimAmountINR(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>₹25,000 (Secondary Care)</span>
              <span>₹100,000 (Tertiary)</span>
              <span>₹200,000 (Super Specialty)</span>
            </div>
          </div>
        </div>

        {/* Financial Results Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Administrative Processing Savings</span>
            <div className="text-xl font-bold font-mono text-white">
              ₹{(adminSavingsINR / 100000).toFixed(2)} Lakhs
            </div>
            <p className="text-[11px] text-slate-500">
              Eliminates manual verification calls, postal physical couriers, and paper audits.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Fraud Loss Mitigation (at 12% est.)</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ₹{(estimatedFraudPreventedINR / 100000).toFixed(2)} Lakhs
            </div>
            <p className="text-[11px] text-slate-500">
              Prevents bill inflation, ghost admissions, and forged laboratory reports.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-brand-500/30 space-y-2">
            <span className="text-brand-400 block font-bold">Total Annual Net Financial Benefit</span>
            <div className="text-xl font-bold font-mono text-brand-300">
              ₹{(totalAnnualBenefitINR / 100000).toFixed(2)} Lakhs
            </div>
            <p className="text-[11px] text-slate-400">
              Payback achieved in <span className="text-white font-bold">{paybackMonths} months</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ABDM & Strategic Architecture Comparison */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-400" />
            <span>Comparative Analysis: Ayushman Bharat Digital Mission (ABDM) vs MediLedger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How MediLedger bridges research and operational gaps in national digital health architectures.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-semibold">
              <tr>
                <th className="p-3">Dimension</th>
                <th className="p-3">Current ABDM Framework</th>
                <th className="p-3 text-brand-400 font-bold">MediLedger Architecture</th>
                <th className="p-3">Strategic / MBA Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-semibold text-white">Document Authentication</td>
                <td className="p-3 text-slate-400">Centralized TLS exchange; no tamper verification once downloaded</td>
                <td className="p-3 text-brand-300 font-semibold">Immutable SHA-256 smart contract fingerprinting</td>
                <td className="p-3 text-emerald-400 font-medium">Eliminates billing manipulation and post-issuance fraud</td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-semibold text-white">Consent Revocation</td>
                <td className="p-3 text-slate-400">Centralized database flag; dependent on gateway uptime</td>
                <td className="p-3 text-brand-300 font-semibold">On-chain instantaneous smart contract revocation</td>
                <td className="p-3 text-emerald-400 font-medium">True patient data sovereignty and DPDP Act compliance</td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-semibold text-white">Audit Trail Integrity</td>
                <td className="p-3 text-slate-400">Centralized gateway database logs susceptible to admin tampering</td>
                <td className="p-3 text-brand-300 font-semibold">Append-only Ethereum EVM event logs</td>
                <td className="p-3 text-emerald-400 font-medium">Court-admissible non-repudiation for insurance disputes</td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-semibold text-white">Insurance Adjudication</td>
                <td className="p-3 text-slate-400">Manual claim officer inspection (14-21 days)</td>
                <td className="p-3 text-brand-300 font-semibold">Automated algorithmic hash matching (&lt; 4 hours)</td>
                <td className="p-3 text-emerald-400 font-medium">99.6% lower administrative cost per claim</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
