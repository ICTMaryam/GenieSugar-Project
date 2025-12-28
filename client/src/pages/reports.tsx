import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Calendar,
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
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import type { GlucoseReading } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const { data: glucoseData, isLoading } = useQuery<GlucoseReading[]>({
    queryKey: ["/api/glucose"],
  });

  const now = new Date();
  let startDate: Date;
  
  if (period === "daily") {
    startDate = subDays(now, 1);
  } else if (period === "weekly") {
    startDate = subDays(now, 7);
  } else {
    startDate = subMonths(now, 1);
  }

  const filteredReadings = glucoseData?.filter(reading => 
    isWithinInterval(new Date(reading.timestamp), { start: startDate, end: now })
  ) || [];

  const values = filteredReadings.map(r => r.value);
  const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const inRangePercent = values.length > 0 ? Math.round((inRange / values.length) * 100) : 0;

  const chartData = filteredReadings
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      time: format(new Date(reading.timestamp), period === "daily" ? "HH:mm" : "MMM d"),
      value: reading.value,
    }));

  const dailyAverages = (() => {
    if (!glucoseData || glucoseData.length === 0) return [];
    
    const days = eachDayOfInterval({ start: startDate, end: now });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayReadings = glucoseData.filter(r => 
        isWithinInterval(new Date(r.timestamp), { start: dayStart, end: dayEnd })
      );
      const avg = dayReadings.length > 0 
        ? Math.round(dayReadings.reduce((sum, r) => sum + r.value, 0) / dayReadings.length)
        : null;
      return {
        day: format(day, "MMM d"),
        average: avg,
        count: dayReadings.length,
      };
    }).filter(d => d.average !== null);
  })();

  const exportCSV = () => {
    if (!filteredReadings.length) {
      toast({ title: "No data", description: "No readings to export" });
      return;
    }

    const headers = ["Date", "Time", "Value (mg/dL)", "Note"];
    const rows = filteredReadings.map(r => [
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
    a.download = `glucose-report-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "Report downloaded as CSV" });
  };

  return (
    <DashboardLayout 
      title="Reports"
      actions={
        <Button onClick={exportCSV} variant="outline" data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="daily" data-testid="tab-daily">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="weekly" data-testid="tab-weekly">Last 7 Days</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" data-testid="text-avg">
                  {average || "-"}
                </span>
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Minimum
              </CardTitle>
              <ArrowDown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" data-testid="text-min">
                  {min || "-"}
                </span>
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maximum
              </CardTitle>
              <ArrowUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" data-testid="text-max">
                  {max || "-"}
                </span>
                <span className="text-sm text-muted-foreground">mg/dL</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Time in Range
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono" data-testid="text-in-range">
                  {inRangePercent}
                </span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">70-180 mg/dL</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Glucose Trend</CardTitle>
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
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      domain={[40, 250]} 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <ReferenceLine y={180} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: "High", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                    <ReferenceLine y={70} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: "Low", fill: "hsl(var(--warning))", fontSize: 10 }} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data for this period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {period !== "daily" && dailyAverages.length > 0 && (
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Daily Averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAverages}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      domain={[0, 250]} 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} mg/dL`,
                        name === "average" ? "Average" : name
                      ]}
                    />
                    <Bar 
                      dataKey="average" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Reading Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Readings</p>
                <p className="text-2xl font-bold font-mono">{filteredReadings.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <p className="text-sm text-muted-foreground">High Readings (&gt;180)</p>
                <p className="text-2xl font-bold font-mono text-destructive">
                  {values.filter(v => v > 180).length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-sm text-muted-foreground">Low Readings (&lt;70)</p>
                <p className="text-2xl font-bold font-mono text-warning">
                  {values.filter(v => v < 70).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
