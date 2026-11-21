const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHeaders(activeRole, activeAddress) {
  const headers = { "Content-Type": "application/json" };
  if (activeRole) headers["x-role"] = activeRole;
  if (activeAddress) headers["x-user-address"] = activeAddress;
  return headers;
}

export async function fetchRoles() {
  const res = await fetch(`${API_BASE}/auth/roles`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function fetchAllRecords(role, address) {
  const res = await fetch(`${API_BASE}/records/all`, {
    headers: getHeaders(role, address)
  });
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
}

export async function fetchPatientRecords(patientAddress, role, address) {
  const res = await fetch(`${API_BASE}/records/patient/${patientAddress}`, {
    headers: getHeaders(role, address)
  });
  if (!res.ok) throw new Error("Failed to fetch patient records");
  return res.json();
}

export async function fetchIssuerRecords(issuerAddress, role, address) {
  const res = await fetch(`${API_BASE}/records/issuer/${issuerAddress}`, {
    headers: getHeaders(role, address)
  });
  if (!res.ok) throw new Error("Failed to fetch issuer records");
  return res.json();
}

export async function fetchRecordDetail(recordId, role, address) {
  const res = await fetch(`${API_BASE}/records/${recordId}`, {
    headers: getHeaders(role, address)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to retrieve record");
  }
  return data;
}

export async function registerNewRecord(recordData, role, address) {
  const res = await fetch(`${API_BASE}/records/register`, {
    method: "POST",
    headers: getHeaders(role, address),
    body: JSON.stringify(recordData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to register record");
  return data;
}

export async function revokeMedicalRecord(recordId, role, address) {
  const res = await fetch(`${API_BASE}/records/${recordId}/revoke`, {
    method: "POST",
    headers: getHeaders(role, address)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to revoke record");
  return data;
}

export async function requestRecordAccess(recordId, purpose, role, address) {
  const res = await fetch(`${API_BASE}/consent/request`, {
    method: "POST",
    headers: getHeaders(role, address),
    body: JSON.stringify({ recordId, purpose })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to request access");
  return data;
}

export async function grantRecordConsent(requestId, durationInSeconds, role, address) {
  const res = await fetch(`${API_BASE}/consent/${requestId}/grant`, {
    method: "POST",
    headers: getHeaders(role, address),
    body: JSON.stringify({ durationInSeconds })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to grant consent");
  return data;
}

export async function rejectRecordConsent(requestId, role, address) {
  const res = await fetch(`${API_BASE}/consent/${requestId}/reject`, {
    method: "POST",
    headers: getHeaders(role, address)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to reject consent");
  return data;
}

export async function revokeActiveConsent(requestId, role, address) {
  const res = await fetch(`${API_BASE}/consent/${requestId}/revoke`, {
    method: "POST",
    headers: getHeaders(role, address)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Failed to revoke consent");
  return data;
}

export async function fetchPatientConsentRequests(patientAddress) {
  const res = await fetch(`${API_BASE}/consent/patient/${patientAddress}`);
  if (!res.ok) throw new Error("Failed to fetch patient consent requests");
  return res.json();
}

export async function fetchRequesterConsentRequests(requesterAddress) {
  const res = await fetch(`${API_BASE}/consent/requester/${requesterAddress}`);
  if (!res.ok) throw new Error("Failed to fetch requester consent requests");
  return res.json();
}

export async function verifyRecordHash(recordId, customContent = null, role, address) {
  const res = await fetch(`${API_BASE}/verify/record`, {
    method: "POST",
    headers: getHeaders(role, address),
    body: JSON.stringify({ recordId, customContent })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Verification failed");
  return data;
}

export async function simulateTamperAttempt(recordId) {
  const res = await fetch(`${API_BASE}/verify/simulate-tamper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.details || data.error || "Simulation failed");
  return data;
}

export async function fetchAuditLogs(limit = 50) {
  const res = await fetch(`${API_BASE}/audit/logs?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
