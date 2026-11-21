const crypto = require("crypto");

/**
 * Computes standard SHA-256 cryptographic hash of a Buffer or string
 * Returns formatted 0x-prefixed hex string for Solidity bytes32
 */
function computeSHA256(data) {
  let buffer;
  if (Buffer.isBuffer(data)) {
    buffer = data;
  } else if (typeof data === "object") {
    // Canonical JSON stringification (sorted keys) for deterministic hashing
    buffer = Buffer.from(canonicalJsonStringify(data), "utf8");
  } else {
    buffer = Buffer.from(String(data), "utf8");
  }

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return "0x" + hash;
}

/**
 * Deterministically sorts object keys for repeatable hashing of clinical payloads
 */
function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => JSON.stringify(key) + ":" + canonicalJsonStringify(obj[key])
  );
  return "{" + pairs.join(",") + "}";
}

module.exports = {
  computeSHA256,
  canonicalJsonStringify
};
