const { getAccountsConfig, getContractsConfig, provider } = require("../config/blockchain");

function getRoles(req, res) {
  const accounts = getAccountsConfig();
  const contracts = getContractsConfig();

  if (!accounts) {
    return res.status(503).json({
      error: "Accounts not yet initialized. Please deploy and seed the blockchain."
    });
  }

  res.json({
    accounts,
    network: {
      rpc: "http://127.0.0.1:8545",
      chainId: 31337
    },
    contracts: contracts ? contracts.contracts : {}
  });
}

function getCurrentUser(req, res) {
  const accounts = getAccountsConfig();
  const roleHeader = req.headers["x-role"] || "patient1";
  const addressHeader = req.headers["x-user-address"];

  let selected = null;

  if (accounts) {
    if (addressHeader) {
      for (const [key, profile] of Object.entries(accounts)) {
        if (profile.address.toLowerCase() === addressHeader.toLowerCase()) {
          selected = { ...profile, key };
          break;
        }
      }
    }

    if (!selected) {
      const key = roleHeader.toLowerCase();
      if (accounts[key]) {
        selected = { ...accounts[key], key };
      } else {
        selected = { ...accounts.patient1, key: "patient1" };
      }
    }
  }

  res.json({
    currentUser: selected || {
      address: "0x0000000000000000000000000000000000000000",
      role: "UNKNOWN",
      name: "Guest"
    }
  });
}

module.exports = {
  getRoles,
  getCurrentUser
};
