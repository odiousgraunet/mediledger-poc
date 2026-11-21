const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", "..", ".env") });

const authRoutes = require("./routes/auth");
const recordRoutes = require("./routes/records");
const consentRoutes = require("./routes/consent");
const verifyRoutes = require("./routes/verify");
const auditRoutes = require("./routes/audit");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    service: "MediLedger Core API Gateway",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/consent", consentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred"
  });
});

// Export app for test suite, or listen if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log("=================================================");
    console.log(` MediLedger API Server running on port ${PORT} `);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
    console.log("=================================================");
  });
}

module.exports = app;
