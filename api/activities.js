// GET /api/activities - Returns recent activity log
// POST /api/activities - Log a new activity

// Mock activities store
let activities = [
  {
    id: "1",
    type: "alert", // "alert" | "fill" | "collection" | "maintenance"
    message: "Bin reached 90% capacity",
    time: "5 minutes ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "fill",
    message: "Fill level increased to 75%",
    time: "10 minutes ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    type: "collection",
    message: "Bin was collected and emptied",
    time: "1 hour ago",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    type: "alert",
    message: "High odor level detected",
    time: "2 hours ago",
    createdAt: new Date().toISOString(),
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Optional: limit results
    const limit = parseInt(req.query?.limit, 10) || 10;

    return res.status(200).json({
      success: true,
      data: activities.slice(0, limit),
      total: activities.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const { type, message } = req.body || {};

      if (!type || !message) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: type, message",
        });
      }

      const newActivity = {
        id: `${Date.now()}`,
        type,
        message,
        time: "Just now",
        createdAt: new Date().toISOString(),
      };

      activities.unshift(newActivity);

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities = activities.slice(0, 100);
      }

      return res.status(201).json({
        success: true,
        message: "Activity logged",
        data: newActivity,
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
