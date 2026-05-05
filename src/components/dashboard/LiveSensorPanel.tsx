import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Wifi, WifiOff, Radio } from "lucide-react";

interface SensorReading {
  binId: string;
  binName: string;
  ultrasonic: number; // cm distance
  fillPercent: number;
  irSensor: boolean; // hand detected
  mq135: number; // ppm
  servoAngle: number; // degrees
  battery: number;
  isOnline: boolean;
  signalStrength: number; // percentage
}

interface LiveSensorPanelProps {
  readings: SensorReading[];
}

export function LiveSensorPanel({ readings }: LiveSensorPanelProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Live Sensor Readings
        </CardTitle>
        <Badge variant="outline" className="gap-1">
          <Radio className="h-3 w-3 animate-pulse text-primary" />
          Real-time
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {readings.map((reading) => (
            <div
              key={reading.binId}
              className="p-4 rounded-lg border bg-card/50 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{reading.binName}</h4>
                  <span className="text-xs text-muted-foreground">{reading.binId}</span>
                </div>
                <div className="flex items-center gap-2">
                  {reading.isOnline ? (
                    <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                      <Wifi className="h-3 w-3" />
                      {reading.signalStrength}%
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </Badge>
                  )}
                </div>
              </div>

              {/* Sensor Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Ultrasonic */}
                <div className="space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ultrasonic</span>
                    <span>{reading.ultrasonic} cm</span>
                  </div>
                  <Progress value={100 - reading.fillPercent} className="h-2" />
                </div>

                {/* MQ-135 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>MQ-135</span>
                    <span>{reading.mq135} ppm</span>
                  </div>
                  <Progress 
                    value={Math.min(reading.mq135 / 5, 100)} 
                    className="h-2"
                  />
                </div>

                {/* IR Sensor */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IR Sensor</span>
                  <Badge variant={reading.irSensor ? "default" : "secondary"}>
                    {reading.irSensor ? "Hand Detected" : "Clear"}
                  </Badge>
                </div>

                {/* Servo */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servo</span>
                  <span className="font-mono">{reading.servoAngle}°</span>
                </div>

                {/* Battery */}
                <div className="col-span-2 space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Battery</span>
                    <span>{reading.battery}%</span>
                  </div>
                  <Progress 
                    value={reading.battery} 
                    className={`h-2 ${reading.battery < 20 ? "[&>div]:bg-destructive" : ""}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
