// GET /api/alerts - Returns current alerts
// POST /api/alerts - Add a new alert (from ESP32 or system)
// DELETE /api/alerts/:id - Dismiss an alert

// Mock alerts store
let alerts = [
  {
    id: "a1",
    type: "critical", // "critical" | "warning" | "info"
    category: "fill", // "fill" | "battery" | "odor" | "lid" | "connectivity"
    message: "Bin is 90% full - collection needed urgently",
    binId: "BIN-001",
    time: "5 min ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a2",
    type: "warning",
    category: "battery",
    message: "Battery at 25% - consider recharging soon",
    binId: "BIN-001",
    time: "15 min ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a3",
    type: "warning",
    category: "odor",
    message: "Moderate odor levels detected",
    binId: "BIN-001",
    time: "20 min ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "a4",
    type: "info",
    category: "lid",
    message: "Lid opened for extended period",
    binId: "BIN-001",
    time: "1 hour ago",
    createdAt: new Date().toISOString(),
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const { type, category, message, binId } = req.body;

      // Validate required fields
      if (!type || !category || !message) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: type, category, message",
        });
      }

      const newAlert = {
        id: `a${Date.now()}`,
        type,
        category,
        message,
        binId: binId || "BIN-001",
        time: "Just now",
        createdAt: new Date().toISOString(),
      };

      alerts.unshift(newAlert); // Add to beginning

      return res.status(201).json({
        success: true,
        message: "Alert created",
        data: newAlert,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Alert ID required",
      });
    }

    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Alert not found",
      });
    }

    alerts.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: "Alert dismissed",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
