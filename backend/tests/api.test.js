const assert = require("assert");
const app = require("../src/server");
const { computeSHA256, canonicalJsonStringify } = require("../src/utils/cryptoUtils");
const { saveDocument, getDocument, documentExists } = require("../src/config/storage");

// Mock request and response for in-memory testing without TCP network sockets
function mockRequest(app, method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const { EventEmitter } = require("events");
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = { "content-type": "application/json", ...headers };
    req.body = body;
    req.socket = { remoteAddress: "127.0.0.1" };
    req.connection = req.socket;

    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      getHeader(k) { return this.headers[k]; },
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({ statusCode: this.statusCode, data }); },
      send(data) { resolve({ statusCode: this.statusCode, data }); },
      end() { resolve({ statusCode: this.statusCode }); }
    };

    app.handle(req, res);
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("       Running MediLedger Backend Unit Tests      ");
  console.log("=================================================");

  try {
    // Test 1: SHA-256 Hashing Utility
    console.log("Test 1: Testing Cryptographic SHA-256 and Canonical JSON Utility...");
    const sampleObj1 = { b: 2, a: 1, c: { z: 26, y: 25 } };
    const sampleObj2 = { a: 1, c: { y: 25, z: 26 }, b: 2 };
    const hash1 = computeSHA256(sampleObj1);
    const hash2 = computeSHA256(sampleObj2);
    assert.strictEqual(hash1, hash2, "Canonical JSON must produce identical SHA-256 regardless of key order");
    assert.strictEqual(hash1.startsWith("0x"), true, "Solidity bytes32 format must have 0x prefix");
    assert.strictEqual(hash1.length, 66, "SHA-256 bytes32 hex length must be 66 (0x + 64 characters)");
    console.log("  [PASS] SHA-256 calculation verified successfully.");

    // Test 2: Storage Engine
    console.log("\nTest 2: Testing Off-Chain Document Storage Engine...");
    const testDocFilename = `test_doc_${Date.now()}.json`;
    const testData = { patient: "Jane Doe", diagnosis: "Test Case", bill: 1000 };
    const saved = saveDocument(testDocFilename, testData);
    assert.strictEqual(saved.filename, testDocFilename, "Filename should match");
    assert.strictEqual(documentExists(testDocFilename), true, "Document must exist in storage");
    const retrieved = getDocument(testDocFilename);
    assert.ok(retrieved, "Retrieved document buffer must not be null");
    const parsedRetrieved = JSON.parse(retrieved.toString("utf8"));
    assert.strictEqual(parsedRetrieved.patient, "Jane Doe", "Document content must match");
    console.log("  [PASS] Off-chain document storage verified successfully.");

    // Test 3: Health Check API (In-memory execution)
    console.log("\nTest 3: Testing Health Check Endpoint GET /api/health...");
    const health = await mockRequest(app, "GET", "/api/health");
    assert.strictEqual(health.statusCode, 200, "Health status should be 200");
    assert.strictEqual(health.data.status, "HEALTHY", "Health payload should be HEALTHY");
    console.log("  [PASS] Health check verified.");

    // Test 4: Roles / Auth API (In-memory execution)
    console.log("\nTest 4: Testing Roles Endpoint GET /api/auth/current...");
    const current = await mockRequest(app, "GET", "/api/auth/current", { "x-role": "hospital" });
    assert.strictEqual(current.statusCode, 200, "Current user status should be 200");
    assert.ok(current.data.currentUser, "Current user must be defined");
    console.log("  [PASS] Current user resolution verified.");

    console.log("\n=================================================");
    console.log("      ALL BACKEND UNIT TESTS PASSED (4/4)         ");
    console.log("=================================================\n");
  } catch (err) {
    console.error("Backend Test Failed:", err);
    process.exitCode = 1;
  }
}

runTests();
