import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Mail, Phone, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { z } from "zod";
import type { AlertSettings } from "@shared/schema";

const alertSettingsSchema = z.object({
  highThreshold: z.coerce.number().min(100).max(600),
  lowThreshold: z.coerce.number().min(20).max(100),
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
});

type AlertSettingsForm = z.infer<typeof alertSettingsSchema>;

export default function AlertSettingsPage() {
  const { t, dir } = useLanguage();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AlertSettings>({
    queryKey: ["/api/alerts/settings"],
  });

  const form = useForm<AlertSettingsForm>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      highThreshold: 180,
      lowThreshold: 70,
      emailAlerts: true,
      smsAlerts: false,
    },
    values: settings ? {
      highThreshold: settings.highThreshold || 180,
      lowThreshold: settings.lowThreshold || 70,
      emailAlerts: settings.emailAlerts ?? true,
      smsAlerts: settings.smsAlerts ?? false,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AlertSettingsForm) => {
      const response = await apiRequest("PUT", "/api/alerts/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/settings"] });
      toast({
        title: t("success"),
        description: "Alert settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AlertSettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout title={t("alertSettings")}>
        <div className="max-w-2xl mx-auto space-y-6" dir={dir}>
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("alertSettings")}>
    <div className="max-w-2xl mx-auto space-y-6" dir={dir}>
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold" data-testid="text-alert-settings-title">{t("alertSettings")}</h1>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t("alerts")}
          </CardTitle>
          <CardDescription>
            Set glucose thresholds and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="highThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-destructive" />
                        {t("highThreshold")} (mg/dL)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={600}
                          data-testid="input-high-threshold"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Alert when glucose exceeds this value</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-chart-4" />
                        {t("lowThreshold")} (mg/dL)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={20}
                          max={100}
                          data-testid="input-low-threshold"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Alert when glucose falls below this value</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium">{t("notifications")}</h3>
                
                <FormField
                  control={form.control}
                  name="emailAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t("enableEmailAlerts")}
                        </FormLabel>
                        <FormDescription>
                          Receive email notifications for glucose alerts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-email-alerts"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smsAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t("enableSMSAlerts")}
                        </FormLabel>
                        <FormDescription>
                          Receive SMS notifications for glucose alerts (coming soon)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled
                          data-testid="switch-sms-alerts"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                data-testid="button-save-alert-settings"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
