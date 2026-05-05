# Smart Waste Bin API Documentation

## Base URL
After deploying to Vercel: `https://your-project.vercel.app/api`

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check & API info |
| GET | `/api/bin` | Get current bin status |
| POST | `/api/bin` | Update bin data (from ESP32) |
| GET | `/api/sensors` | Get live sensor readings |
| POST | `/api/sensors` | Update sensor data (from ESP32) |
| GET | `/api/charts` | Get all chart data |
| GET | `/api/alerts` | Get current alerts |
| POST | `/api/alerts` | Create a new alert |
| DELETE | `/api/alerts?id=xxx` | Dismiss an alert |
| GET | `/api/activities` | Get activity log |
| POST | `/api/activities` | Log a new activity |
| GET | `/api/schedule` | Get collection schedule |
| POST | `/api/schedule` | Create scheduled collection |
| PATCH | `/api/schedule` | Update schedule status |
| POST | `/api/controls` | Send control commands |

---

## Detailed Endpoints

### 1. Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Smart Waste Bin API",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "endpoints": ["...list of all endpoints..."]
}
```

---

### 2. Bin Status

#### Get Bin Status
```
GET /api/bin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "BIN-001",
    "name": "Smart Waste Bin",
    "location": "Main Location",
    "fillLevel": 68,
    "lidStatus": "closed",
    "odorLevel": "normal",
    "battery": 74,
    "isOnline": true,
    "lastUpdate": "12:40 PM",
    "handDetected": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Update Bin Status (ESP32)
```
POST /api/bin
Content-Type: application/json

{
  "fillLevel": 75,
  "lidStatus": "open",
  "odorLevel": "moderate",
  "battery": 70,
  "handDetected": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bin data updated successfully",
  "data": { "...updated bin data..." },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Sensor Readings

#### Get Sensor Data
```
GET /api/sensors
```

**Response:**
```json
{
  "success": true,
  "data": [{
    "binId": "BIN-001",
    "binName": "Smart Waste Bin",
    "ultrasonic": 16,
    "fillPercent": 68,
    "irSensor": false,
    "mq135": 80,
    "servoAngle": 0,
    "battery": 74,
    "isOnline": true,
    "signalStrength": 85
  }],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Update Sensor Data (ESP32)
```
POST /api/sensors
Content-Type: application/json

{
  "ultrasonic": 15,
  "mq135": 120,
  "irSensor": true,
  "servoAngle": 90,
  "battery": 72
}
```

**Note:** When `mq135` exceeds the odor threshold (200 ppm), the system automatically triggers an emergency odor alert on the dashboard and logs it in the activity history.

---

### 4. Chart Data
```
GET /api/charts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fillLevel": [
      { "time": "00:00", "fillLevel": 20 },
      { "time": "04:00", "fillLevel": 25 },
      "..."
    ],
    "battery": [
      { "time": "Mon", "battery": 100 },
      { "time": "Tue", "battery": 95 },
      "..."
    ],
    "odor": [
      { "hour": "6AM", "level": 50, "alerts": 0 },
      { "hour": "9AM", "level": 120, "alerts": 1 },
      "..."
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 5. Alerts

#### Get Alerts
```
GET /api/alerts
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1",
      "type": "critical",
      "category": "fill",
      "message": "Bin is 90% full - collection needed urgently",
      "binId": "BIN-001",
      "time": "5 min ago",
      "createdAt": "2024-01-15T10:25:00.000Z"
    }
  ],
  "count": 4,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Create Alert (e.g., Emergency Odor Alert from ESP32)
```
POST /api/alerts
Content-Type: application/json

{
  "type": "critical",
  "category": "odor",
  "message": "Emergency: Critical odor level detected (350 ppm) - immediate attention required",
  "binId": "BIN-001"
}
```

#### Dismiss Alert
```
DELETE /api/alerts?id=a1
```

---

### 6. Activities

#### Get Activities
```
GET /api/activities?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "type": "alert",
      "message": "Bin reached 90% capacity",
      "time": "5 minutes ago",
      "createdAt": "2024-01-15T10:25:00.000Z"
    }
  ],
  "total": 4,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Log Activity
```
POST /api/activities
Content-Type: application/json

{
  "type": "alert",
  "message": "Emergency odor alert triggered - MQ-135 reading: 350 ppm"
}
```

---

### 7. Collection Schedule

#### Get Schedule
```
GET /api/schedule
GET /api/schedule?status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "s1",
      "binId": "BIN-001",
      "binName": "Smart Waste Bin",
      "location": "Main Location",
      "scheduledTime": "Today 2:00 PM",
      "estimatedFill": 95,
      "status": "pending",
      "priority": "high",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Create Schedule
```
POST /api/schedule
Content-Type: application/json

{
  "scheduledTime": "Tomorrow 10:00 AM",
  "estimatedFill": 80,
  "priority": "medium"
}
```

#### Update Schedule
```
PATCH /api/schedule
Content-Type: application/json

{
  "id": "s1",
  "status": "completed"
}
```

---

### 8. Control Commands

```
POST /api/controls
Content-Type: application/json

{
  "command": "lock_lid",
  "binId": "BIN-001"
}
```

**Valid Commands:**
- `lock_lid` - Lock the bin lid
- `unlock_lid` - Unlock the bin lid
- `set_brightness` - Set LED brightness (include `value: 0-100`)
- `reset` - Reset the bin

**Response:**
```json
{
  "success": true,
  "message": "Lid locked successfully",
  "data": {
    "command": "lock_lid",
    "binId": "BIN-001",
    "value": null,
    "executedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Emergency Odor Alert System

When the MQ-135 gas sensor detects odor above the threshold (default: 200 ppm), the ESP32 should:

1. **Create an alert** via `POST /api/alerts` with `type: "critical"` and `category: "odor"`
2. **Log the activity** via `POST /api/activities` with the sensor reading
3. **Update bin status** via `POST /api/bin` with `odorLevel: "high"`

The dashboard will automatically display an emergency notification when odor levels are critical.

---

## ESP32 Integration Example

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* API_BASE = "https://your-project.vercel.app/api";
const int ODOR_THRESHOLD = 200; // ppm

void sendSensorData() {
  HTTPClient http;
  http.begin(String(API_BASE) + "/sensors");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["ultrasonic"] = ultrasonicDistance;
  doc["mq135"] = airQualityValue;
  doc["irSensor"] = handDetected;
  doc["servoAngle"] = currentServoAngle;
  doc["battery"] = batteryPercent;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  http.end();

  // Check if odor threshold exceeded
  if (airQualityValue > ODOR_THRESHOLD) {
    triggerOdorAlert(airQualityValue);
  }
}

void triggerOdorAlert(int ppmValue) {
  // 1. Create emergency alert
  HTTPClient http;
  http.begin(String(API_BASE) + "/alerts");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["type"] = "critical";
  doc["category"] = "odor";
  doc["message"] = "Emergency: Critical odor level detected (" + String(ppmValue) + " ppm) - immediate attention required";
  doc["binId"] = "BIN-001";
  
  String jsonString;
  serializeJson(doc, jsonString);
  http.POST(jsonString);
  http.end();

  // 2. Log activity
  HTTPClient http2;
  http2.begin(String(API_BASE) + "/activities");
  http2.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc2;
  doc2["type"] = "alert";
  doc2["message"] = "Emergency odor alert triggered - MQ-135 reading: " + String(ppmValue) + " ppm";
  
  String jsonString2;
  serializeJson(doc2, jsonString2);
  http2.POST(jsonString2);
  http2.end();

  // 3. Update bin odor status
  HTTPClient http3;
  http3.begin(String(API_BASE) + "/bin");
  http3.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<64> doc3;
  doc3["odorLevel"] = "high";
  
  String jsonString3;
  serializeJson(doc3, jsonString3);
  http3.POST(jsonString3);
  http3.end();
}
```

---

## Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically
4. Use the provided Vercel URL as your API base
