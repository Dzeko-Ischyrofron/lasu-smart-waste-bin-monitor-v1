// GET /api/health - Health check endpoint

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "healthy",
      service: "Smart Waste Bin API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      endpoints: [
        "GET  /api/health     - This health check",
        "GET  /api/bin        - Get bin status",
        "POST /api/bin        - Update bin data (ESP32)",
        "GET  /api/sensors    - Get sensor readings",
        "POST /api/sensors    - Update sensor data (ESP32)",
        "GET  /api/charts     - Get chart data",
        "GET  /api/alerts     - Get alerts",
        "POST /api/alerts     - Create alert",
        "DELETE /api/alerts   - Dismiss alert (?id=xxx)",
        "GET  /api/activities - Get activity log",
        "POST /api/activities - Log activity",
        "GET  /api/schedule   - Get collection schedule",
        "POST /api/schedule   - Create scheduled collection",
        "PATCH /api/schedule  - Update schedule",
        "POST /api/controls   - Send control commands",
      ],
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
