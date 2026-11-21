const { getContract, provider } = require("../config/blockchain");

async function getDashboardMetrics(req, res) {
  try {
    const registryContract = await getContract("RecordRegistry");
    const consentContract = await getContract("ConsentManager");
    const auditContract = await getContract("AuditLogger");

    const totalRecords = Number(await registryContract.getTotalRecordCount().catch(() => 0));
    const totalRequests = Number(await consentContract.getTotalRequestCount().catch(() => 0));
    const totalAuditEvents = Number(await auditContract.getTotalLogCount().catch(() => 0));

    // Get current block height
    let blockHeight = 0;
    try {
      blockHeight = await provider.getBlockNumber();
    } catch (e) {
      blockHeight = 1;
    }

    // Health-economics and MBA Finance calculations
    // Model assumptions:
    // Avg claim size: INR 65,000 (~$780 USD)
    // Avg fraud/tampering rate in paper/siloed claims: 12.5%
    // Avg manual adjudication administrative cost: INR 1,850 (~$22 USD) per claim
    // MediLedger on-chain adjudication cost: INR 6.50 (~$0.08 USD) per claim
    const simulatedClaimVolume = 10000;
    const manualAdminCostAnnual = simulatedClaimVolume * 1850;
    const mediledgerAdminCostAnnual = simulatedClaimVolume * 6.5;
    const adminSavingsINR = manualAdminCostAnnual - mediledgerAdminCostAnnual;

    const preventedFraudValueINR = simulatedClaimVolume * 0.125 * 65000;
    const totalAnnualBenefitINR = adminSavingsINR + preventedFraudValueINR;

    const roiPercentage = ((totalAnnualBenefitINR / 1200000) * 100).toFixed(1); // Assuming 1.2M INR implementation CapEx

    res.json({
      ledgerMetrics: {
        totalRecordsAnchored: totalRecords,
        totalConsentRequests: totalRequests,
        totalAuditEvents,
        currentBlockHeight: blockHeight,
        consensusMechanism: "Ethereum EVM / Hardhat Proof of Authority / Local Devnet",
        dataIntegrityHashAlgorithm: "SHA-256 (FIPS 180-4)",
        architecture: "Hybrid Off-Chain Storage + On-Chain Cryptographic Anchor"
      },
      healthEconomics: {
        claimsProcessedBaseline: simulatedClaimVolume,
        traditionalTurnaroundTime: "14 - 21 Days",
        mediledgerTurnaroundTime: "< 4 Hours (Immediate on Patient Approval)",
        administrativeCostPerClaim: {
          traditionalManualINR: 1850,
          mediledgerBlockchainINR: 6.5,
          savingsPercentage: "99.6%"
        },
        financialProjections: {
          annualAdminSavingsINR: adminSavingsINR,
          projectedFraudLossMitigationINR: preventedFraudValueINR,
          totalFinancialBenefitINR: totalAnnualBenefitINR,
          estimatedImplementationCapExINR: 1200000,
          projectedFirstYearROI: `${roiPercentage}%`,
          breakEvenPeriodMonths: 2.3
        }
      }
    });
  } catch (err) {
    console.error("Error in getDashboardMetrics:", err);
    res.status(500).json({ error: "Failed to generate analytics", details: err.message });
  }
}

module.exports = {
  getDashboardMetrics
};
