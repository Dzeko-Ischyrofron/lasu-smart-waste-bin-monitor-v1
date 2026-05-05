// GET /api/sensors - Returns live sensor readings
// POST /api/sensors - Updates sensor data from ESP32

// Mock sensor data
let sensorData = {
  binId: "BIN-001",
  binName: "Smart Waste Bin",
  ultrasonic: 16, // Distance in cm (lower = more full)
  fillPercent: 68,
  irSensor: false, // Hand detected
  mq135: 80, // Air quality in ppm
  servoAngle: 0, // 0 = closed, 90 = open
  battery: 74,
  isOnline: true,
  signalStrength: 85, // WiFi signal %
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
    // Add some realistic variation to mock data
    const readings = {
      ...sensorData,
      signalStrength: sensorData.isOnline ? Math.floor(Math.random() * 30) + 70 : 0,
    };

    return res.status(200).json({
      success: true,
      data: [readings], // Array for consistency with multi-bin support
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      const updates = req.body;

      // Update sensor readings from ESP32
      if (typeof updates.ultrasonic === "number") {
        sensorData.ultrasonic = updates.ultrasonic;
        // Calculate fill percent from ultrasonic (assuming 50cm bin height)
        sensorData.fillPercent = Math.round((1 - updates.ultrasonic / 50) * 100);
      }
      if (typeof updates.fillPercent === "number") {
        sensorData.fillPercent = Math.max(0, Math.min(100, updates.fillPercent));
      }
      if (typeof updates.irSensor === "boolean") {
        sensorData.irSensor = updates.irSensor;
      }
      if (typeof updates.mq135 === "number") {
        sensorData.mq135 = updates.mq135;
      }
      if (typeof updates.servoAngle === "number") {
        sensorData.servoAngle = Math.max(0, Math.min(180, updates.servoAngle));
      }
      if (typeof updates.battery === "number") {
        sensorData.battery = Math.max(0, Math.min(100, updates.battery));
      }
      if (typeof updates.signalStrength === "number") {
        sensorData.signalStrength = Math.max(0, Math.min(100, updates.signalStrength));
      }

      return res.status(200).json({
        success: true,
        message: "Sensor data updated",
        data: sensorData,
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
