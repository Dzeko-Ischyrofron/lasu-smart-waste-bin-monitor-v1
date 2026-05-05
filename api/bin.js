// GET /api/bin - Returns current bin status
// POST /api/bin - Updates bin data (for ESP32)

// Mock data store (in production, use a database)
let binData = {
  id: "BIN-001",
  name: "Smart Waste Bin",
  location: "Main Location",
  fillLevel: 68,
  lidStatus: "closed", // "open" | "closed"
  odorLevel: "normal", // "normal" | "moderate" | "high"
  battery: 74,
  isOnline: true,
  lastUpdate: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  handDetected: false,
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Return current bin status
    return res.status(200).json({
      success: true,
      data: binData,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    // Update bin data from ESP32
    try {
      const updates = req.body || {};

      // Validate and update fields
      if (typeof updates.fillLevel === "number") {
        binData.fillLevel = Math.max(0, Math.min(100, updates.fillLevel));
      }
      if (updates.lidStatus === "open" || updates.lidStatus === "closed") {
        binData.lidStatus = updates.lidStatus;
      }
      if (["normal", "moderate", "high"].includes(updates.odorLevel)) {
        binData.odorLevel = updates.odorLevel;
      }
      if (typeof updates.battery === "number") {
        binData.battery = Math.max(0, Math.min(100, updates.battery));
      }
      if (typeof updates.isOnline === "boolean") {
        binData.isOnline = updates.isOnline;
      }
      if (typeof updates.handDetected === "boolean") {
        binData.handDetected = updates.handDetected;
      }

      // Update timestamp
      binData.lastUpdate = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return res.status(200).json({
        success: true,
        message: "Bin data updated successfully",
        data: binData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
