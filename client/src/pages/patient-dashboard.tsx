import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { 
  Droplet, 
  Utensils, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Plus,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { GlucoseReading, FoodLog, ActivityLog } from "@shared/schema";
import { format, subDays, isWithinInterval } from "date-fns";

function GlucoseStatusBadge({ value }: { value: number }) {
  if (value < 70) {
    return <Badge variant="destructive" className="text-xs">Low</Badge>;
  }
  if (value > 180) {
    return <Badge variant="destructive" className="text-xs">High</Badge>;
  }
  return <Badge className="bg-success text-success-foreground text-xs">Normal</Badge>;
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: glucoseData, isLoading: glucoseLoading } = useQuery<GlucoseReading[]>({
    queryKey: ["/api/glucose"],
  });

  const { data: foodData, isLoading: foodLoading } = useQuery<FoodLog[]>({
    queryKey: ["/api/food"],
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const latestGlucose = glucoseData?.[0];
  const sevenDaysAgo = subDays(new Date(), 7);
  
  const last7DaysReadings = glucoseData?.filter(reading => 
    isWithinInterval(new Date(reading.timestamp), { start: sevenDaysAgo, end: new Date() })
  ) || [];
  
  const averageGlucose = last7DaysReadings.length > 0
    ? Math.round(last7DaysReadings.reduce((sum, r) => sum + r.value, 0) / last7DaysReadings.length)
    : null;

  const highCount = last7DaysReadings.filter(r => r.value > 180).length;
  const lowCount = last7DaysReadings.filter(r => r.value < 70).length;
  const alertCount = highCount + lowCount;

  const chartData = last7DaysReadings
    .slice()
    .reverse()
    .map(reading => ({
      time: format(new Date(reading.timestamp), "MMM d HH:mm"),
      value: reading.value,
    }));

  const recentLogs = [
    ...(glucoseData?.slice(0, 3).map(g => ({ 
      type: "glucose" as const, 
      data: g, 
      time: new Date(g.timestamp) 
    })) || []),
    ...(foodData?.slice(0, 3).map(f => ({ 
      type: "food" as const, 
      data: f, 
      time: new Date(f.timestamp) 
    })) || []),
    ...(activityData?.slice(0, 3).map(a => ({ 
      type: "activity" as const, 
      data: a, 
      time: new Date(a.timestamp) 
    })) || []),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5);

  const isLoading = glucoseLoading || foodLoading || activityLoading;

  return (
    <DashboardLayout 
      title={`Welcome, ${user?.fullName?.split(' ')[0] || 'Patient'}`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <Link href="/glucose">
            <Button size="sm" data-testid="button-add-glucose">
              <Plus className="h-4 w-4 mr-1" />
              Glucose
            </Button>
          </Link>
          <Link href="/food">
            <Button size="sm" variant="outline" data-testid="button-add-food">
              <Plus className="h-4 w-4 mr-1" />
              Food
            </Button>
          </Link>
          <Link href="/activity">
            <Button size="sm" variant="outline" data-testid="button-add-activity">
              <Plus className="h-4 w-4 mr-1" />
              Activity
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest Reading
              </CardTitle>
              <Droplet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : latestGlucose ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono" data-testid="text-latest-glucose">
                      {latestGlucose.value}
                    </span>
                    <span className="text-sm text-muted-foreground">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <GlucoseStatusBadge value={latestGlucose.value} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(latestGlucose.timestamp), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No readings yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                7-Day Average
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : averageGlucose ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono" data-testid="text-avg-glucose">
                      {averageGlucose}
                    </span>
                    <span className="text-sm text-muted-foreground">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {averageGlucose < 100 ? (
                      <TrendingDown className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-warning" />
                    )}
                    <span>{last7DaysReadings.length} readings this week</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Not enough data</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alerts (7 Days)
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-16 animate-pulse bg-muted rounded" />
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono" data-testid="text-alert-count">
                      {alertCount}
                    </span>
                    <span className="text-sm text-muted-foreground">alerts</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-destructive">{highCount} high</span>
                    <span className="text-warning">{lowCount} low</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>7-Day Glucose Trend</CardTitle>
            <Link href="/reports">
              <Button variant="ghost" size="sm" data-testid="link-full-reports">
                View Reports
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 animate-pulse bg-muted rounded" />
            ) : chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="time" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[40, 250]} 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <ReferenceLine y={180} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                    <ReferenceLine y={70} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Droplet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No glucose data for the last 7 days</p>
                  <Link href="/glucose">
                    <Button className="mt-4" data-testid="button-add-first-glucose">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Reading
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {log.type === "glucose" && (
                        <>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Droplet className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              Glucose: <span className="font-mono">{(log.data as GlucoseReading).value}</span> mg/dL
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(log.time, "MMM d, h:mm a")}
                            </p>
                          </div>
                          <GlucoseStatusBadge value={(log.data as GlucoseReading).value} />
                        </>
                      )}
                      {log.type === "food" && (
                        <>
                          <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                            <Utensils className="h-4 w-4 text-chart-2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {(log.data as FoodLog).foodName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(log.data as FoodLog).mealType} - {format(log.time, "MMM d, h:mm a")}
                            </p>
                          </div>
                        </>
                      )}
                      {log.type === "activity" && (
                        <>
                          <div className="h-8 w-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-chart-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {(log.data as ActivityLog).activityType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(log.data as ActivityLog).duration} min - {format(log.time, "MMM d, h:mm a")}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {(log.data as ActivityLog).intensity}
                          </Badge>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm mt-1">Start logging to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Link href="/glucose">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-4"
                    data-testid="button-quick-glucose"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <Droplet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Log Glucose Reading</p>
                      <p className="text-xs text-muted-foreground">Record your blood sugar level</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/food">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-4"
                    data-testid="button-quick-food"
                  >
                    <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center mr-3">
                      <Utensils className="h-5 w-5 text-chart-2" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Log Meal</p>
                      <p className="text-xs text-muted-foreground">Track what you eat</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/activity">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-4"
                    data-testid="button-quick-activity"
                  >
                    <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center mr-3">
                      <Activity className="h-5 w-5 text-chart-3" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Log Activity</p>
                      <p className="text-xs text-muted-foreground">Record your exercise</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-4"
                    data-testid="button-quick-reports"
                  >
                    <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center mr-3">
                      <BarChart3 className="h-5 w-5 text-chart-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Reports</p>
                      <p className="text-xs text-muted-foreground">Analyze your trends</p>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
