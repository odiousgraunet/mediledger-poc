const fs = require("fs");
const path = require("path");
const { computeSHA256 } = require("../utils/cryptoUtils");

const STORAGE_DIR = path.resolve(__dirname, "..", "..", "storage", "documents");
const SYNTHETIC_DIR = path.resolve(__dirname, "..", "..", "..", "data", "synthetic");

// Ensure storage directories exist
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Copy initial synthetic records to storage if not already there
if (fs.existsSync(SYNTHETIC_DIR)) {
  const files = fs.readdirSync(SYNTHETIC_DIR);
  for (const file of files) {
    const src = path.join(SYNTHETIC_DIR, file);
    const dest = path.join(STORAGE_DIR, file);
    if (!fs.existsSync(dest) && fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

/**
 * Saves document content off-chain to storage
 * Computes and returns file SHA-256 fingerprint alongside filename
 */
function saveDocument(filename, data) {
  let contentBuffer;
  if (Buffer.isBuffer(data)) {
    contentBuffer = data;
  } else if (typeof data === "object") {
    contentBuffer = Buffer.from(JSON.stringify(data, null, 2), "utf8");
  } else {
    contentBuffer = Buffer.from(String(data), "utf8");
  }

  const filePath = path.join(STORAGE_DIR, filename);
  fs.writeFileSync(filePath, contentBuffer);

  const hash = computeSHA256(contentBuffer);
  return {
    filename,
    filePath,
    fileSize: contentBuffer.length,
    hash
  };
}

/**
 * Retrieves document from storage
 */
function getDocument(filename) {
  const filePath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    // Check fallback in synthetic folder
    const fallbackPath = path.join(SYNTHETIC_DIR, filename);
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath);
    }
    return null;
  }
  return fs.readFileSync(filePath);
}

/**
 * Checks if document exists in storage
 */
function documentExists(filename) {
  const filePath = path.join(STORAGE_DIR, filename);
  if (fs.existsSync(filePath)) return true;
  const fallbackPath = path.join(SYNTHETIC_DIR, filename);
  return fs.existsSync(fallbackPath);
}

module.exports = {
  saveDocument,
  getDocument,
  documentExists,
  STORAGE_DIR
};
