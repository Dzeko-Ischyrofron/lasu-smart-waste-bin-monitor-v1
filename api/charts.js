// GET /api/charts - Returns all chart data for analytics

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Fill level over 24 hours
    const fillLevelData = [
      { time: "00:00", fillLevel: 20 },
      { time: "04:00", fillLevel: 25 },
      { time: "08:00", fillLevel: 45 },
      { time: "12:00", fillLevel: 60 },
      { time: "16:00", fillLevel: 72 },
      { time: "20:00", fillLevel: 85 },
      { time: "Now", fillLevel: 75 },
    ];

    // Battery trends over the week
    const batteryData = [
      { time: "Mon", battery: 100 },
      { time: "Tue", battery: 95 },
      { time: "Wed", battery: 88 },
      { time: "Thu", battery: 82 },
      { time: "Fri", battery: 78 },
      { time: "Sat", battery: 74 },
    ];

    // Odor analysis throughout the day
    const odorData = [
      { hour: "6AM", level: 50, alerts: 0 },
      { hour: "9AM", level: 120, alerts: 1 },
      { hour: "12PM", level: 200, alerts: 2 },
      { hour: "3PM", level: 180, alerts: 1 },
      { hour: "6PM", level: 280, alerts: 3 },
      { hour: "9PM", level: 150, alerts: 1 },
    ];

    return res.status(200).json({
      success: true,
      data: {
        fillLevel: fillLevelData,
        battery: batteryData,
        odor: odorData,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
