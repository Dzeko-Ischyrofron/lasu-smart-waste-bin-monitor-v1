// POST /api/controls - Send control commands to ESP32

// This endpoint receives commands from the UI and would
// relay them to the ESP32 (future implementation)

export default function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { command, binId, value } = req.body || {};

      // Validate command
      const validCommands = ["lock_lid", "unlock_lid", "set_brightness", "reset"];

      if (!command || !validCommands.includes(command)) {
        return res.status(400).json({
          success: false,
          error: `Invalid command. Valid commands: ${validCommands.join(", ")}`,
        });
      }

      // Log the command (in production, send to ESP32 via MQTT/WebSocket)
      console.log(`Command received: ${command} for bin ${binId || "BIN-001"}`);

      // Simulate command execution
      const response = {
        success: true,
        message: `Command '${command}' executed successfully`,
        data: {
          command,
          binId: binId || "BIN-001",
          value: value || null,
          executedAt: new Date().toISOString(),
        },
      };

      // Command-specific responses
      switch (command) {
        case "lock_lid":
          response.message = "Lid locked successfully";
          break;
        case "unlock_lid":
          response.message = "Lid unlocked successfully";
          break;
        case "set_brightness":
          response.message = `LED brightness set to ${value || 50}%`;
          response.data.value = value || 50;
          break;
        case "reset":
          response.message = "Bin reset command sent";
          break;
      }

      return res.status(200).json(response);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
