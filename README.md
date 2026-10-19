# IoT-Based Smart Waste Bin Monitoring System

## Project Overview

The **IoT-Based Smart Waste Bin Monitoring System** combines an IoT-enabled waste bin with a web-based monitoring dashboard.

The system monitors important conditions of the waste bin remotely. Sensor readings from the bin can be sent to the cloud database, where they can be viewed through the web dashboard. The dashboard also provides status information, alerts, historical activities, and supported control functions.

The current physical implementation uses one smart waste bin. The dashboard includes a fleet overview so that the system can be extended to additional bins in the future.

## Main Features

- Automatic opening and closing of the bin lid
- Ultrasonic sensing for waste-level measurement
- Full-bin detection and automatic lid locking
- MQ-135 gas/odor monitoring
- Emergency odor notification when the bin should be emptied
- Battery-level monitoring
- LED status indication
- Wi-Fi/IoT communication
- Real-time web dashboard monitoring
- Historical activity and alert logging
- Waste-level and battery trend charts
- Collection scheduling with priority levels
- Responsive dashboard interface

## Hardware

The hardware side uses an ESP32/Arduino-compatible microcontroller and the following main components:

- ESP32 microcontroller
- Ultrasonic sensor(s)
- MQ-135 gas sensor
- Servo motor for the bin lid
- LED indicators
- Battery/power supply and charging circuit
- Supporting electronic components and wiring

## Software and Technologies

### Embedded System

The microcontroller program is written in **C/C++ using the Arduino development environment**. It handles sensor readings, lid operation, local status decisions, Wi-Fi communication, and communication with the cloud system.

### Web Dashboard

The dashboard is a web application using the project's frontend codebase, including:

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Supabase

### Backend/API

The project contains API/serverless functions that provide application endpoints for the dashboard and cloud communication.

### Database

**Supabase** is used as the cloud database and backend platform. It stores information required for monitoring, including bin information, sensor readings, alerts, activities, schedules, and control commands.

## System Operation

1. Sensors on the smart bin collect information such as waste level, gas/odor condition, and battery status.
2. The microcontroller processes the readings and controls the lid and indicators.
3. The bin connects to the internet through Wi-Fi.
4. Relevant readings and status information are sent to the cloud database.
5. The web dashboard retrieves the information and displays it to the user.
6. Important conditions such as high fill level, low battery, or high odor readings can generate alerts.
7. Supported dashboard commands can be communicated back to the bin.

## Dashboard Sections

### Bin Status

Displays:

- Fill level
- Lid status
- Odor level
- Battery level
- Online/connection status

### Live Sensor Information

Provides information such as:

- Ultrasonic distance
- Fill percentage
- MQ-135 reading
- Servo position
- Signal strength

### Charts and Analysis

Provides visual monitoring of:

- Waste fill-level history
- Battery trends
- Odor analysis

### Alerts

Provides warnings and critical notifications for conditions such as:

- High waste level
- Low battery
- High odor/gas reading
- Maintenance-related conditions

### Activity Logs

Records system events and activities for historical review and analysis.

### Collection Schedule

Provides collection scheduling with priority levels.

## Project Structure

```text
src/        Frontend application
api/        Backend/API endpoints
public/     Public web assets
```

Other configuration files support the application.

## Running the Dashboard

### Requirements

- Node.js
- npm

### Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The terminal will display the local address for opening the dashboard in a web browser.

### Production Build

```bash
npm run build
```

## Supabase Configuration

The dashboard uses Supabase for its cloud database and backend services.

The required Supabase configuration should be supplied through the project's appropriate environment/configuration settings rather than exposing private credentials in the source code.

The database structure is documented separately in the supplied Supabase SQL backup.

## Database Structure

The Supabase database contains tables and supporting database objects for areas such as:

- Bins
- Sensor readings
- Telemetry
- Alerts
- Activities
- Control commands
- Collection schedules
- User profiles and roles
- Bin assignments
- Bin configuration

It also contains views, functions, triggers, indexes, relationships, and row-level security policies.

## Arduino/ESP32 Program

The Arduino/ESP32 `.ino` source file is supplied separately. It is responsible for the physical operation of the smart bin and communication with the cloud system.

The dashboard source code and Arduino source code are separate parts of the same IoT system.

## Current Project Scope

The current physical implementation uses one smart waste bin. The fleet overview is included so the system can be expanded to multiple bins in the future.

The odor-management function uses gas/odor detection and an emergency notification that the bin should be emptied. The project does **not** use an automatic perfume or air-freshener spraying mechanism.

## Project Submission Files

The complete project submission should contain:

1. Arduino/ESP32 source code
2. Web dashboard and backend source code
3. Supabase database structure/SQL backup
4. This README file

## Note

This project demonstrates the integration of embedded systems, sensors, IoT communication, cloud database services, and a web-based monitoring interface for smart waste management.
