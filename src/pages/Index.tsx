import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { BinStatusCard } from "@/components/dashboard/BinStatusCard";
import { FillLevelChart } from "@/components/dashboard/FillLevelChart";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { BatteryTrendsChart } from "@/components/dashboard/BatteryTrendsChart";
import { OdorAnalysisChart } from "@/components/dashboard/OdorAnalysisChart";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { LiveSensorPanel } from "@/components/dashboard/LiveSensorPanel";
import { CollectionSchedule } from "@/components/dashboard/CollectionSchedule";
import { FleetOverview } from "@/components/dashboard/FleetOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Wind, Battery, Wifi, DoorClosed, Activity, BarChart3, Settings, Calendar, Loader2 } from "lucide-react";
import { useBinData } from "@/hooks/useBinData";
import { format } from "date-fns";

const Index = () => {
  const { bin, readings, alerts, activities, schedule, loading } = useBinData("BIN-001");

  if (loading || !bin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Build chart data from sensor readings (oldest -> newest)
  const sortedReadings = [...readings].reverse();
  const chartData = sortedReadings.slice(-7).map((r) => ({
    time: format(new Date(r.recorded_at), "HH:mm"),
    fillLevel: r.fill_percent ?? 0,
  }));
  if (chartData.length === 0) {
    chartData.push({ time: "Now", fillLevel: bin.fill_level });
  }

  // Battery trend (last 7 readings)
  const batteryData = sortedReadings.slice(-7).map((r) => ({
    time: format(new Date(r.recorded_at), "EEE"),
    battery: r.battery ?? bin.battery,
  }));
  if (batteryData.length === 0) batteryData.push({ time: "Now", battery: bin.battery });

  // Odor data (last 6 readings)
  const odorData = sortedReadings.slice(-6).map((r, i, arr) => ({
    hour: i === arr.length - 1 ? "Now" : format(new Date(r.recorded_at), "HH:mm"),
    level: r.mq135_ppm ?? 0,
    alerts: (r.mq135_ppm ?? 0) > 300 ? 1 : 0,
  }));
  if (odorData.length === 0) odorData.push({ hour: "Now", level: 0, alerts: 0 });

  const latest = sortedReadings[sortedReadings.length - 1];
  const sensorReadings = [{
    binId: bin.id,
    binName: bin.name,
    ultrasonic: Number(latest?.ultrasonic_cm ?? (100 - bin.fill_level) * 0.5),
    fillPercent: bin.fill_level,
    irSensor: bin.hand_detected,
    mq135: latest?.mq135_ppm ?? 0,
    servoAngle: bin.lid_status === "open" ? 90 : 0,
    battery: bin.battery,
    isOnline: bin.is_online,
    signalStrength: latest?.signal_strength ?? (bin.is_online ? 80 : 0),
  }];

  const fleetBin = {
    id: bin.id,
    name: bin.name,
    location: bin.location,
    fillLevel: bin.fill_level,
    battery: bin.battery,
    isOnline: bin.is_online,
    status: (bin.fill_level >= 80 ? "critical" : bin.fill_level >= 60 ? "warning" : "normal") as "normal" | "warning" | "critical",
  };

  const binStatus = {
    id: bin.id,
    name: bin.name,
    location: bin.location,
    fillLevel: bin.fill_level,
    lidStatus: bin.lid_status,
    odorLevel: bin.odor_level,
    battery: bin.battery,
    isOnline: bin.is_online,
    lastUpdate: format(new Date(bin.last_update), "HH:mm"),
    handDetected: bin.hand_detected,
  };

  const activityFeed = activities.map((a) => ({
    id: a.id,
    type: a.type as "alert" | "fill" | "collection",
    message: a.message,
    time: format(new Date(a.created_at), "PP HH:mm"),
  }));

  const alertsFeed = alerts.map((a) => ({
    id: a.id,
    type: a.type,
    category: a.category,
    message: a.message,
    binId: a.bin_id ?? bin.id,
    time: format(new Date(a.created_at), "PP HH:mm"),
  }));

  const scheduleFeed = schedule.map((s) => ({
    id: s.id,
    binId: s.bin_id,
    binName: bin.name,
    location: bin.location,
    scheduledTime: format(new Date(s.scheduled_time), "PP HH:mm"),
    estimatedFill: s.estimated_fill ?? 0,
    status: (s.status === "cancelled" ? "overdue" : s.status) as "completed" | "in-progress" | "overdue" | "pending",
    priority: s.priority,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div className="animate-slide-up">
          <h2 className="text-2xl font-bold tracking-tight">Smart Waste Management Dashboard</h2>
          <p className="text-muted-foreground">Monitor and control your ESP32-powered smart bin in real-time</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Fill Level" value={bin.fill_level} unit="%" icon={Trash2}
            status={bin.fill_level >= 70 ? "warning" : "success"} />
          <StatCard title="Lid Status" value={bin.lid_status === "open" ? "Open" : "Closed"} icon={DoorClosed}
            status={bin.lid_status === "open" ? "warning" : "success"} />
          <StatCard title="Odor Level"
            value={bin.odor_level === "high" ? "CRITICAL" : bin.odor_level === "moderate" ? "Elevated" : "Normal"}
            icon={Wind}
            status={bin.odor_level === "high" ? "danger" : bin.odor_level !== "normal" ? "warning" : "success"} />
          <StatCard title="Battery" value={bin.battery} unit="%" icon={Battery}
            status={bin.battery < 30 ? "danger" : "success"} />
          <StatCard title="Connection" value={bin.is_online ? "Online" : "Offline"} icon={Wifi}
            status={bin.is_online ? "success" : "warning"} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2"><Activity className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Analytics</span></TabsTrigger>
            <TabsTrigger value="controls" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Controls</span></TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2"><Calendar className="h-4 w-4" /><span className="hidden sm:inline">Schedule</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><FillLevelChart data={chartData} title="Fill Level Trend" /></div>
              <div className="lg:col-span-1"><RecentActivityCard activities={activityFeed} /></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsPanel alerts={alertsFeed} />
              <LiveSensorPanel readings={sensorReadings} />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Bin Status</h3>
              <div className="max-w-md"><BinStatusCard {...binStatus} /></div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BatteryTrendsChart data={batteryData} />
              <OdorAnalysisChart data={odorData} />
            </div>
            <FleetOverview bin={fleetBin} />
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ControlPanel bins={[{ id: bin.id, name: bin.name, lid_status: bin.lid_status }]} />
              <LiveSensorPanel readings={sensorReadings} />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollectionSchedule schedule={scheduleFeed} bins={[{ id: bin.id, name: bin.name }]} />
              <FleetOverview bin={fleetBin} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
