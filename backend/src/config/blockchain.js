const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

let contractsConfig = null;
let accountsConfig = null;

function loadConfigs() {
  const contractsPath = path.join(__dirname, "contractsConfig.json");
  if (fs.existsSync(contractsPath)) {
    contractsConfig = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
  }

  const accountsPath = path.join(__dirname, "accountsConfig.json");
  if (fs.existsSync(accountsPath)) {
    accountsConfig = JSON.parse(fs.readFileSync(accountsPath, "utf8"));
  }
}

loadConfigs();

/**
 * Returns signers from the local Hardhat node
 */
async function getSigners() {
  try {
    const accounts = await provider.listAccounts();
    return accounts;
  } catch (err) {
    console.warn("Could not query RPC provider accounts:", err.message);
    return [];
  }
}

/**
 * Returns contract instance connected with a given signer or default provider
 */
async function getContract(contractName, signerOrRole = null) {
  loadConfigs();
  if (!contractsConfig || !contractsConfig.contracts[contractName]) {
    throw new Error(`Contract configuration for ${contractName} not found. Ensure deployment has run.`);
  }

  const address = contractsConfig.contracts[contractName];
  const abi = contractsConfig.abis[contractName];

  if (!signerOrRole) {
    return new ethers.Contract(address, abi, provider);
  }

  if (typeof signerOrRole === "string") {
    // Role string (e.g., 'hospital', 'lab', 'insurance', 'patient', 'admin')
    const roleKey = signerOrRole.toLowerCase();
    const signers = await provider.listAccounts();

    let signerIndex = 0;
    if (roleKey === "hospital") signerIndex = 1;
    else if (roleKey === "lab") signerIndex = 2;
    else if (roleKey === "insurance") signerIndex = 3;
    else if (roleKey === "patient" || roleKey === "patient1") signerIndex = 4;
    else if (roleKey === "patient2") signerIndex = 5;

    const signer = await provider.getSigner(signerIndex);
    return new ethers.Contract(address, abi, signer);
  }

  // Already a Signer instance
  return new ethers.Contract(address, abi, signerOrRole);
}

/**
 * Gets signer corresponding to a role name or address
 */
async function getSignerForRole(roleOrAddress) {
  const signers = await provider.listAccounts();
  if (!roleOrAddress) return await provider.getSigner(0);

  const lower = roleOrAddress.toLowerCase();
  if (lower === "hospital") return await provider.getSigner(1);
  if (lower === "lab") return await provider.getSigner(2);
  if (lower === "insurance") return await provider.getSigner(3);
  if (lower === "patient" || lower === "patient1") return await provider.getSigner(4);
  if (lower === "patient2") return await provider.getSigner(5);
  if (lower === "admin") return await provider.getSigner(0);

  // Search by address
  for (let i = 0; i < signers.length; i++) {
    if (signers[i].address.toLowerCase() === lower) {
      return await provider.getSigner(i);
    }
  }

  return await provider.getSigner(0);
}

module.exports = {
  provider,
  getContract,
  getSigners,
  getSignerForRole,
  loadConfigs,
  getContractsConfig: () => contractsConfig,
  getAccountsConfig: () => accountsConfig
};
