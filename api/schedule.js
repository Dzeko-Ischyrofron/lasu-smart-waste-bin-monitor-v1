// GET /api/schedule - Returns collection schedule
// POST /api/schedule - Create a new scheduled collection
// PATCH /api/schedule - Update schedule status

// Mock schedule data
let schedule = [
  {
    id: "s1",
    binId: "BIN-001",
    binName: "Smart Waste Bin",
    location: "Main Location",
    scheduledTime: "Today 2:00 PM",
    estimatedFill: 95,
    status: "pending", // "pending" | "in-progress" | "completed" | "cancelled"
    priority: "high", // "high" | "medium" | "low"
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    binId: "BIN-001",
    binName: "Smart Waste Bin",
    location: "Main Location",
    scheduledTime: "Tomorrow 9:00 AM",
    estimatedFill: 75,
    status: "pending",
    priority: "medium",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    binId: "BIN-001",
    binName: "Smart Waste Bin",
    location: "Main Location",
    scheduledTime: "Yesterday 3:00 PM",
    estimatedFill: 50,
    status: "completed",
    priority: "low",
    createdAt: new Date().toISOString(),
  },
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Optional filtering by status
    const { status } = req.query;
    let filteredSchedule = schedule;

    if (status) {
      filteredSchedule = schedule.filter((s) => s.status === status);
    }

    return res.status(200).json({
      success: true,
      data: filteredSchedule,
      total: filteredSchedule.length,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const { binId, binName, location, scheduledTime, estimatedFill, priority } = req.body;

      if (!scheduledTime) {
        return res.status(400).json({
          success: false,
          error: "scheduledTime is required",
        });
      }

      const newSchedule = {
        id: `s${Date.now()}`,
        binId: binId || "BIN-001",
        binName: binName || "Smart Waste Bin",
        location: location || "Main Location",
        scheduledTime,
        estimatedFill: estimatedFill || 0,
        status: "pending",
        priority: priority || "medium",
        createdAt: new Date().toISOString(),
      };

      schedule.unshift(newSchedule);

      return res.status(201).json({
        success: true,
        message: "Collection scheduled",
        data: newSchedule,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, status, priority } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Schedule ID is required",
        });
      }

      const index = schedule.findIndex((s) => s.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          error: "Schedule not found",
        });
      }

      if (status) schedule[index].status = status;
      if (priority) schedule[index].priority = priority;

      return res.status(200).json({
        success: true,
        message: "Schedule updated",
        data: schedule[index],
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
