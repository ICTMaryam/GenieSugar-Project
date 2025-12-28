import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  ArrowLeft, 
  Droplet, 
  Utensils, 
  Activity,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
} from "recharts";
import { format, subDays, isWithinInterval } from "date-fns";
import type { GlucoseReading, FoodLog, ActivityLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PatientData {
  patient: {
    id: string;
    fullName: string;
    email: string;
    diabetesType?: string;
  };
  permissions: string;
  glucoseReadings: GlucoseReading[];
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
}

function GlucoseStatusBadge({ value }: { value: number }) {
  if (value < 70) return <Badge variant="destructive">Low</Badge>;
  if (value > 180) return <Badge variant="destructive">High</Badge>;
  return <Badge className="bg-success text-success-foreground">Normal</Badge>;
}

export default function PatientView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<PatientData>({
    queryKey: ["/api/provider/patient", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-4">
          <div className="h-32 animate-pulse bg-muted rounded-lg" />
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Patient Not Found">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load patient data</p>
          <Link href="/physician">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { patient, permissions, glucoseReadings, foodLogs, activityLogs } = data;
  
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentReadings = glucoseReadings.filter(r => 
    isWithinInterval(new Date(r.timestamp), { start: sevenDaysAgo, end: new Date() })
  );

  const values = recentReadings.map(r => r.value);
  const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  const chartData = recentReadings
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      time: format(new Date(reading.timestamp), "MMM d"),
      value: reading.value,
    }));

  const exportCSV = () => {
    if (!glucoseReadings.length) {
      toast({ title: "No data", description: "No readings to export" });
      return;
    }

    const headers = ["Date", "Time", "Value (mg/dL)", "Note"];
    const rows = glucoseReadings.map(r => [
      format(new Date(r.timestamp), "yyyy-MM-dd"),
      format(new Date(r.timestamp), "HH:mm"),
      r.value.toString(),
      r.note || "",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patient.fullName.replace(/\s+/g, '-')}-glucose-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Patient report downloaded" });
  };

  return (
    <DashboardLayout 
      title={patient.fullName}
      actions={
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportCSV} variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/physician">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-card-border">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {patient.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-xl">{patient.fullName}</CardTitle>
                <CardDescription>{patient.email}</CardDescription>
                {patient.diabetesType && (
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {patient.diabetesType}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                7-Day Average
              </CardTitle>
              <Droplet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono">{average || "-"}</span>
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Readings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{glucoseReadings.length}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Access Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={permissions === "all" ? "bg-primary" : ""}>
                {permissions === "all" ? "Full Access" : "Glucose Only"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Glucose Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs fill-muted-foreground" />
                    <YAxis domain={[40, 250]} className="text-xs fill-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <ReferenceLine y={180} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                    <ReferenceLine y={70} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No glucose data available
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="glucose">
          <TabsList>
            <TabsTrigger value="glucose">Glucose</TabsTrigger>
            {permissions === "all" && (
              <>
                <TabsTrigger value="food">Food</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="glucose" className="mt-4">
            <Card className="border-card-border">
              <CardContent className="pt-6">
                {glucoseReadings.length > 0 ? (
                  <div className="space-y-2">
                    {glucoseReadings.slice(0, 20).map(reading => (
                      <div key={reading.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Droplet className="h-4 w-4 text-primary" />
                          <span className="font-mono font-semibold">{reading.value} mg/dL</span>
                          <GlucoseStatusBadge value={reading.value} />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(reading.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No readings</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {permissions === "all" && (
            <>
              <TabsContent value="food" className="mt-4">
                <Card className="border-card-border">
                  <CardContent className="pt-6">
                    {foodLogs.length > 0 ? (
                      <div className="space-y-2">
                        {foodLogs.slice(0, 20).map(log => (
                          <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Utensils className="h-4 w-4 text-chart-2" />
                              <span className="font-medium">{log.foodName}</span>
                              <Badge variant="secondary" className="capitalize">{log.mealType}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM d, h:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No food logs</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card className="border-card-border">
                  <CardContent className="pt-6">
                    {activityLogs.length > 0 ? (
                      <div className="space-y-2">
                        {activityLogs.slice(0, 20).map(log => (
                          <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Activity className="h-4 w-4 text-chart-3" />
                              <span className="font-medium">{log.activityType}</span>
                              <Badge variant="secondary">{log.duration} min</Badge>
                              <Badge variant="outline" className="capitalize">{log.intensity}</Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.timestamp), "MMM d, h:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No activity logs</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
