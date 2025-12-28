import { useState, useEffect } from "react";
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
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertGlucoseSchema, type InsertGlucose, type GlucoseReading } from "@shared/schema";
import { Droplet, Plus, Loader2, Trash2, Edit, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useLocation } from "wouter";

const formSchema = insertGlucoseSchema;

function GlucoseStatusBadge({ value }: { value: number }) {
  if (value < 70) {
    return <Badge variant="destructive">Low</Badge>;
  }
  if (value > 180) {
    return <Badge variant="destructive">High</Badge>;
  }
  return <Badge className="bg-success text-success-foreground">Normal</Badge>;
}

export default function GlucoseLog() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [location] = useLocation();

  // Check for Dexcom connection success from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dexcom') === 'connected') {
      toast({ title: "Success", description: "Dexcom sensor connected successfully!" });
      window.history.replaceState({}, '', '/glucose');
    }
  }, [toast]);

  // Check Dexcom connection status
  const { data: dexcomStatus, isLoading: isDexcomLoading } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/dexcom/status"],
  });

  // Connect to Dexcom
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/dexcom/auth");
      return response.json();
    },
    onSuccess: (data: { authUrl: string }) => {
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to connect to Dexcom",
        variant: "destructive" 
      });
    },
  });

  // Sync readings from Dexcom
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dexcom/sync");
      return response.json();
    },
    onSuccess: (data: { synced: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/glucose"] });
      toast({ 
        title: "Sync Complete", 
        description: `${data.synced} readings imported from Dexcom sensor` 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Sync Failed", 
        description: error.message || "Failed to sync readings",
        variant: "destructive" 
      });
    },
  });

  // Disconnect Dexcom
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/dexcom/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dexcom/status"] });
      toast({ title: "Disconnected", description: "Dexcom sensor disconnected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    },
  });

  const form = useForm<InsertGlucose>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: 100,
      timestamp: new Date().toISOString().slice(0, 16),
      note: "",
    },
  });

  const { data: readings, isLoading } = useQuery<GlucoseReading[]>({
    queryKey: ["/api/glucose"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertGlucose) => {
      const response = await apiRequest("POST", "/api/glucose", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/glucose"] });
      toast({ title: "Success", description: "Glucose reading added" });
      form.reset({
        value: 100,
        timestamp: new Date().toISOString().slice(0, 16),
        note: "",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add reading",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/glucose/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/glucose"] });
      toast({ title: "Deleted", description: "Reading removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertGlucose) => {
    addMutation.mutate(data);
  };

  return (
    <DashboardLayout 
      title="Glucose Log"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {dexcomStatus?.connected ? (
            <>
              <Button 
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-sync-sensor"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Sensor
              </Button>
              <Button 
                variant="ghost"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                data-testid="button-disconnect-sensor"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending || isDexcomLoading}
              data-testid="button-connect-sensor"
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Connect to Sensor
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-glucose">
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Glucose Reading</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Glucose Value (mg/dL)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={20}
                          max={600}
                          className="text-2xl font-mono text-center h-14"
                          data-testid="input-glucose-value"
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
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          data-testid="input-glucose-timestamp"
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
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any relevant context..."
                          className="resize-none"
                          data-testid="input-glucose-note"
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
                  data-testid="button-submit-glucose"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Reading"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-primary" />
              Recent Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : readings && readings.length > 0 ? (
              <div className="space-y-3">
                {readings.map((reading) => (
                  <div 
                    key={reading.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                    data-testid={`glucose-reading-${reading.id}`}
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold font-mono text-primary">
                        {reading.value}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {reading.value} mg/dL
                        </span>
                        <GlucoseStatusBadge value={reading.value} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reading.timestamp), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                      </p>
                      {reading.note && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {reading.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(reading.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-glucose-${reading.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Droplet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No readings yet</p>
                <p className="text-sm mt-1">Add your first glucose reading to start tracking</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first-reading"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
