const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("   MediLedger Smart Contract Deployment Started   ");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  const initialBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Initial Balance:", hre.ethers.formatEther(initialBalance), "ETH");

  // 1. Deploy AccessControlManager
  console.log("\n1. Deploying AccessControlManager...");
  const AccessControlManager = await hre.ethers.getContractFactory("AccessControlManager");
  const accessControl = await AccessControlManager.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("   AccessControlManager deployed at:", accessControlAddress);

  // 2. Deploy AuditLogger
  console.log("\n2. Deploying AuditLogger...");
  const AuditLogger = await hre.ethers.getContractFactory("AuditLogger");
  const auditLogger = await AuditLogger.deploy(accessControlAddress);
  await auditLogger.waitForDeployment();
  const auditLoggerAddress = await auditLogger.getAddress();
  console.log("   AuditLogger deployed at:", auditLoggerAddress);

  // 3. Deploy RecordRegistry
  console.log("\n3. Deploying RecordRegistry...");
  const RecordRegistry = await hre.ethers.getContractFactory("RecordRegistry");
  const recordRegistry = await RecordRegistry.deploy(accessControlAddress, auditLoggerAddress);
  await recordRegistry.waitForDeployment();
  const recordRegistryAddress = await recordRegistry.getAddress();
  console.log("   RecordRegistry deployed at:", recordRegistryAddress);

  // 4. Deploy ConsentManager
  console.log("\n4. Deploying ConsentManager...");
  const ConsentManager = await hre.ethers.getContractFactory("ConsentManager");
  const consentManager = await ConsentManager.deploy(accessControlAddress, recordRegistryAddress, auditLoggerAddress);
  await consentManager.waitForDeployment();
  const consentManagerAddress = await consentManager.getAddress();
  console.log("   ConsentManager deployed at:", consentManagerAddress);

  // 5. Authorize contracts in AuditLogger
  console.log("\n5. Authorizing contracts in AuditLogger...");
  const authTx = await auditLogger.setAuthorizedContracts(recordRegistryAddress, consentManagerAddress);
  await authTx.wait();
  console.log("   Authorization confirmed.");

  // Save deployment artifact info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AccessControlManager: accessControlAddress,
      AuditLogger: auditLoggerAddress,
      RecordRegistry: recordRegistryAddress,
      ConsentManager: consentManagerAddress
    }
  };

  const deployedPath = path.join(__dirname, "..", "deployedAddresses.json");
  fs.writeFileSync(deployedPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment addresses saved to:", deployedPath);

  // Helper to get ABI
  const getAbi = (contractName) => {
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      return artifact.abi;
    }
    return [];
  };

  const sharedConfig = {
    ...deploymentInfo,
    abis: {
      AccessControlManager: getAbi("AccessControlManager"),
      AuditLogger: getAbi("AuditLogger"),
      RecordRegistry: getAbi("RecordRegistry"),
      ConsentManager: getAbi("ConsentManager")
    }
  };

  // Export to backend config
  const backendConfigDir = path.join(__dirname, "..", "..", "backend", "src", "config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendConfigDir, "contractsConfig.json"),
    JSON.stringify(sharedConfig, null, 2)
  );

  // Export to frontend config
  const frontendConfigDir = path.join(__dirname, "..", "..", "frontend", "src");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendConfigDir, "contractsConfig.json"),
    JSON.stringify(sharedConfig, null, 2)
  );

  console.log("Shared configuration synced to backend and frontend.");
  console.log("=================================================");
  console.log("   Deployment Completed Successfully!            ");
  console.log("=================================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
