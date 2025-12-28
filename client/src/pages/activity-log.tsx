import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertActivityLogSchema, type InsertActivityLog, type ActivityLog } from "@shared/schema";
import { Activity, Plus, Loader2, Trash2, Timer, Flame, Zap } from "lucide-react";
import { format, isToday, isWithinInterval, subDays } from "date-fns";
import { z } from "zod";

const formSchema = insertActivityLogSchema.extend({
  userId: z.string().optional(),
});

const intensityColors = {
  low: "bg-success/10 text-success",
  moderate: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

const intensityBadges = {
  low: "bg-success text-success-foreground",
  moderate: "bg-warning text-warning-foreground",
  high: "bg-destructive text-destructive-foreground",
};

export default function ActivityLogPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const form = useForm<InsertActivityLog>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityType: "",
      duration: 30,
      intensity: "moderate",
      notes: "",
      timestamp: new Date().toISOString().slice(0, 16),
    },
  });

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertActivityLog) => {
      const response = await apiRequest("POST", "/api/activity", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({ title: "Success", description: "Activity logged" });
      form.reset({
        activityType: "",
        duration: 30,
        intensity: "moderate",
        notes: "",
        timestamp: new Date().toISOString().slice(0, 16),
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add activity",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/activity/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({ title: "Deleted", description: "Activity removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertActivityLog) => {
    addMutation.mutate(data);
  };

  const filteredLogs = logs?.filter(log => {
    const logDate = new Date(log.timestamp);
    if (filter === "today") return isToday(logDate);
    if (filter === "week") return isWithinInterval(logDate, { start: subDays(new Date(), 7), end: new Date() });
    return true;
  });

  return (
    <DashboardLayout 
      title="Activity Log"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-activity">
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Type</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Walking, Running, Swimming"
                          data-testid="input-activity-type"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min={1}
                            data-testid="input-activity-duration"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intensity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intensity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-intensity">
                              <SelectValue placeholder="Select intensity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-activity-timestamp"
                          {...field}
                          value={typeof field.value === 'string' ? field.value : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did it go?"
                          className="resize-none"
                          data-testid="input-activity-notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={addMutation.isPending}
                  data-testid="button-submit-activity"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Activity"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="today" data-testid="tab-today">Today</TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week">This Week</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-chart-3" />
              Activity Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const intensityColor = intensityColors[log.intensity as keyof typeof intensityColors] || "bg-muted";
                  const badgeColor = intensityBadges[log.intensity as keyof typeof intensityBadges] || "";
                  
                  return (
                    <div 
                      key={log.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                      data-testid={`activity-log-${log.id}`}
                    >
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${intensityColor}`}>
                        <Activity className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{log.activityType}</span>
                          <Badge className={badgeColor}>
                            <Zap className="h-3 w-3 mr-1" />
                            {log.intensity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {log.duration} min
                          </span>
                          <span>{format(new Date(log.timestamp), "EEEE, MMMM d 'at' h:mm a")}</span>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">{log.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(log.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-activity-${log.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No activities logged yet</p>
                <p className="text-sm mt-1">Track your exercise to see how it affects your glucose</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first-activity"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
