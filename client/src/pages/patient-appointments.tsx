import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { CalendarDays, Clock, User, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import type { User as UserType, Appointment } from "@shared/schema";
import { useEffect } from "react";

interface AppointmentWithPhysician extends Appointment {
  physician: UserType;
}

export default function PatientAppointments() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<AppointmentWithPhysician[]>({
    queryKey: ["/api/appointments/patient"],
  });

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/appointments/${id}/seen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/unseen-count"] });
    },
  });

  useEffect(() => {
    if (appointments) {
      appointments.forEach(apt => {
        if (!apt.patientSeen) {
          markSeen.mutate(apt.id);
        }
      });
    }
  }, [appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      case "confirmed": return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "completed": return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  const upcomingAppointments = appointments?.filter(apt => 
    new Date(apt.appointmentDate) >= new Date() && 
    (apt.status === "pending" || apt.status === "confirmed")
  ) || [];

  const pastAppointments = appointments?.filter(apt => 
    new Date(apt.appointmentDate) < new Date() || 
    apt.status === "completed" || apt.status === "cancelled"
  ) || [];

  return (
    <DashboardLayout title={t("appointments")}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("upcomingAppointments")}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-upcoming-count">
                {upcomingAppointments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("totalReadings")}
              </CardTitle>
              <Clock className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-appointments">
                {appointments?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t("yourAppointments")}
            </CardTitle>
            <CardDescription>
              {t("noAppointmentsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noAppointments")}</p>
                <p className="text-sm mt-2">{t("noAppointmentsDesc")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map(apt => (
                  <div 
                    key={apt.id} 
                    className="p-4 rounded-lg border bg-card"
                    data-testid={`appointment-${apt.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {t("appointmentWith")} Dr. {apt.physician?.fullName}
                            </span>
                            <Badge className={getStatusColor(apt.status)}>
                              {getStatusIcon(apt.status)}
                              <span className="ml-1">{t(apt.status as any)}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">
                              {format(new Date(apt.appointmentDate), "EEEE, MMMM d, yyyy")}
                            </span>
                            {" "}{t("time")}: {format(new Date(apt.appointmentDate), "h:mm a")}
                            {" "} - {apt.duration} min
                          </div>
                        </div>
                      </div>
                    </div>

                    {apt.notes && (
                      <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium mb-1">
                          <FileText className="h-4 w-4" />
                          {t("notes")}
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{apt.notes}</p>
                      </div>
                    )}

                    {apt.requirements && (
                      <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium mb-1">
                          <AlertCircle className="h-4 w-4" />
                          {t("whatToBring")}
                        </div>
                        <p className="text-sm text-amber-800 dark:text-amber-300">{apt.requirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {pastAppointments.length > 0 && (
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Past Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastAppointments.slice(0, 5).map(apt => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30"
                    data-testid={`past-appointment-${apt.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Dr. {apt.physician?.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(apt.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {t(apt.status as any)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
