const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

console.log("===============================================================================");
console.log("                 MEDILEDGER 1-CLICK ALL-IN-ONE SYSTEM LAUNCHER                 ");
console.log("===============================================================================");
console.log("Starting Ethereum EVM Blockchain, Smart Contracts, Backend API & Frontend...\n");

const rootDir = path.resolve(__dirname, "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function runService(name, command, args, cwd) {
  console.log(`[${name}] Starting...`);
  const proc = spawn(command, args, {
    cwd: path.resolve(rootDir, cwd),
    stdio: "inherit",
    shell: true
  });

  proc.on("error", (err) => {
    console.error(`[${name}] Failed to start:`, err.message);
  });

  return proc;
}

// 1. Start Hardhat Node
const nodeProc = runService("1. BLOCKCHAIN EVM", npmCmd, ["run", "node"], "blockchain");

// Wait 4 seconds for Hardhat node to spin up, then deploy and start backend & frontend
setTimeout(() => {
  console.log("\n[2. SMART CONTRACTS] Deploying and seeding initial clinical ledger data...");
  const deployProc = spawn(npmCmd, ["run", "deploy"], { cwd: path.resolve(rootDir, "blockchain"), stdio: "inherit", shell: true });

  deployProc.on("close", () => {
    const seedProc = spawn(npmCmd, ["run", "seed"], { cwd: path.resolve(rootDir, "blockchain"), stdio: "inherit", shell: true });

    seedProc.on("close", () => {
      console.log("\n[3. BACKEND API] Starting Express REST Gateway on port 5000...");
      runService("3. BACKEND API", npmCmd, ["start"], "backend");

      console.log("\n[4. FRONTEND APP] Starting Vite React UI on port 3000...");
      runService("4. FRONTEND APP", npmCmd, ["run", "dev"], "frontend");

      console.log("\n===============================================================================");
      console.log("             ALL MEDILEDGER SERVICES ARE LIVE & RUNNING!                      ");
      console.log("   Open your browser at: http://localhost:3000                                 ");
      console.log("===============================================================================\n");

      // Open browser automatically
      setTimeout(() => {
        const startCmd = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
        spawn(startCmd, ["http://localhost:3000"], { shell: true });
      }, 2000);
    });
  });
}, 4000);

process.on("SIGINT", () => {
  console.log("\nShutting down all MediLedger services...");
  process.exit();
});
