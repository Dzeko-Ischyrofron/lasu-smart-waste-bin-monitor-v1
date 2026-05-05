import { useEffect, useState } from "react";
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
import { BinSelector } from "@/components/dashboard/BinSelector";
import { BinMap } from "@/components/dashboard/BinMap";
import { HistoricalAnalytics } from "@/components/dashboard/HistoricalAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Wind, Battery, Wifi, DoorClosed, Activity, BarChart3, Settings, Calendar, Loader2 } from "lucide-react";
import { useBinData, useBinsList } from "@/hooks/useBinData";
import { format } from "date-fns";

const Index = () => {
  const { bins: allBins, loading: binsLoading } = useBinsList();
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  // Default selection to first bin once list loads
  useEffect(() => {
    if (!selectedBinId && allBins.length > 0) {
      setSelectedBinId(allBins[0].id);
    }
  }, [allBins, selectedBinId]);

  const { bin, readings, alerts, activities, schedule, loading } = useBinData(selectedBinId);

  if (binsLoading || (selectedBinId && (loading || !bin))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!bin || allBins.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center space-y-3">
          <h2 className="text-2xl font-bold">No bins registered</h2>
          <p className="text-muted-foreground">An admin needs to register a bin in Settings → Bin Management.</p>
        </main>
      </div>
    );
  }

  const sortedReadings = [...readings].reverse();
  const chartData = sortedReadings.slice(-12).map((r) => ({
    time: format(new Date(r.recorded_at), "HH:mm"),
    fillLevel: r.fill_percent ?? 0,
  }));
  if (chartData.length === 0) chartData.push({ time: "Now", fillLevel: bin.fill_level });

  const batteryData = sortedReadings.slice(-7).map((r) => ({
    time: format(new Date(r.recorded_at), "HH:mm"),
    battery: r.battery ?? bin.battery,
  }));
  if (batteryData.length === 0) batteryData.push({ time: "Now", battery: bin.battery });

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

  const mapPins = allBins.map((b) => ({
    id: b.id, name: b.name, location: b.location,
    fill_level: b.fill_level, is_online: b.is_online,
    latitude: b.latitude, longitude: b.longitude,
  }));

  const allBinsOpts = allBins.map((b) => ({ id: b.id, name: b.name, location: b.location }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-slide-up">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Smart Waste Management Dashboard</h2>
            <p className="text-muted-foreground">Monitor and control your ESP32-powered smart bins in real-time</p>
          </div>
          <BinSelector bins={allBinsOpts} value={selectedBinId ?? ""} onChange={setSelectedBinId} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FleetOverview bin={fleetBin} />
              <HistoricalAnalytics binId={bin.id} />
            </div>
            <BinMap bins={mapPins} />
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ControlPanel bins={allBins.map((b) => ({ id: b.id, name: b.name, lid_status: b.lid_status }))} />
              <LiveSensorPanel readings={sensorReadings} />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollectionSchedule schedule={scheduleFeed} bins={allBinsOpts} />
              <FleetOverview bin={fleetBin} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
