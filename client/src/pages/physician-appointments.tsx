import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { CalendarDays, Clock, Plus, User, FileText, AlertCircle, Check, X, Bell } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import type { User as UserType, Appointment } from "@shared/schema";

interface Patient {
  id: string;
  fullName: string;
  email: string;
  permissions: string;
}

interface AppointmentWithPatient extends Appointment {
  patient: UserType;
}

export default function PhysicianAppointments() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [requirements, setRequirements] = useState("");
  const [reminderDays, setReminderDays] = useState("2");

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["/api/appointments/physician"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/provider/patients"],
  });

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/physician"] });
      setIsBookingOpen(false);
      resetForm();
      toast({ title: t("appointmentBooked"), description: t("appointmentBookedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/physician"] });
      toast({ title: t("appointmentUpdated") });
    },
  });

  const resetForm = () => {
    setSelectedPatient("");
    setAppointmentTime("09:00");
    setDuration("30");
    setNotes("");
    setRequirements("");
    setReminderDays("2");
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedPatient) {
      toast({ title: t("error"), description: t("selectPatientAndDate"), variant: "destructive" });
      return;
    }

    const [hours, minutes] = appointmentTime.split(":");
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createAppointment.mutate({
      patientId: selectedPatient,
      appointmentDate: appointmentDateTime.toISOString(),
      duration: parseInt(duration),
      notes: notes || undefined,
      requirements: requirements || undefined,
      reminderDays: parseInt(reminderDays),
    });
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments?.filter(apt => 
      isSameDay(new Date(apt.appointmentDate), date)
    ) || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      case "confirmed": return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "completed": return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-700 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const todayAppointments = getAppointmentsForDate(new Date());
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];
  const upcomingAppointments = appointments?.filter(apt => 
    new Date(apt.appointmentDate) > new Date() && 
    (apt.status === "pending" || apt.status === "confirmed")
  ).slice(0, 5) || [];

  return (
    <DashboardLayout title={t("appointments")}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("todayAppointments")}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-today-appointments">
                {todayAppointments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("upcomingAppointments")}
              </CardTitle>
              <Clock className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-upcoming-appointments">
                {upcomingAppointments.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("totalPatients")}
              </CardTitle>
              <User className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-patients">
                {patients?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-card-border">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {t("calendar")}
                  </CardTitle>
                  <CardDescription>{t("selectDateToView")}</CardDescription>
                </div>
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-book-appointment">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("bookAppointment")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>{t("bookNewAppointment")}</DialogTitle>
                      <DialogDescription>
                        {t("selectPatientAndDate")}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t("selectPatient")}</Label>
                        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                          <SelectTrigger data-testid="select-patient">
                            <SelectValue placeholder={t("choosePatient")} />
                          </SelectTrigger>
                          <SelectContent>
                            {patients?.map(patient => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("appointmentDate")}</Label>
                        <div className="border rounded-md p-2">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            data-testid="calendar-booking"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("time")}</Label>
                          <Input
                            type="time"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                            data-testid="input-appointment-time"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("durationMinutes")}</Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger data-testid="select-duration">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                              <SelectItem value="45">45</SelectItem>
                              <SelectItem value="60">60</SelectItem>
                              <SelectItem value="90">90</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t("notesForPatient")}
                        </Label>
                        <Textarea
                          placeholder={t("notesPlaceholder")}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          data-testid="input-notes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t("requirements")}
                        </Label>
                        <Textarea
                          placeholder={t("requirementsPlaceholder")}
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          data-testid="input-requirements"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          {t("reminderDaysBefore")}
                        </Label>
                        <Select value={reminderDays} onValueChange={setReminderDays}>
                          <SelectTrigger data-testid="select-reminder">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{t("noReminder")}</SelectItem>
                            <SelectItem value="1">1 {t("day")}</SelectItem>
                            <SelectItem value="2">2 {t("days")}</SelectItem>
                            <SelectItem value="3">3 {t("days")}</SelectItem>
                            <SelectItem value="7">7 {t("days")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button 
                        onClick={handleBookAppointment} 
                        disabled={createAppointment.isPending}
                        data-testid="button-confirm-booking"
                      >
                        {createAppointment.isPending ? t("booking") : t("confirmBooking")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasAppointments: (date) => getAppointmentsForDate(date).length > 0,
                }}
                modifiersClassNames={{
                  hasAppointments: "bg-primary/20 font-bold",
                }}
                data-testid="calendar-main"
              />
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : t("selectDate")}
              </CardTitle>
              <CardDescription>
                {selectedDateAppointments.length} {t("appointmentsOnThisDay")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noAppointmentsOnThisDay")}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateAppointments.map(apt => (
                    <div 
                      key={apt.id} 
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{apt.patient?.fullName}</span>
                            <Badge className={getStatusColor(apt.status)}>
                              {t(apt.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(new Date(apt.appointmentDate), "h:mm a")} - {apt.duration} min
                          </div>
                          {apt.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">{apt.notes}</p>
                          )}
                        </div>
                        {(apt.status === "pending" || apt.status === "confirmed") && (
                          <div className="flex gap-1">
                            {apt.status === "pending" && (
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => updateAppointment.mutate({ id: apt.id, status: "confirmed" })}
                                data-testid={`button-confirm-${apt.id}`}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => updateAppointment.mutate({ id: apt.id, status: "cancelled" })}
                              data-testid={`button-cancel-${apt.id}`}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>{t("upcomingAppointments")}</CardTitle>
            <CardDescription>{t("yourNextScheduledAppointments")}</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("noUpcomingAppointments")}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map(apt => (
                  <div 
                    key={apt.id} 
                    className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                    data-testid={`upcoming-${apt.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{apt.patient?.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(apt.status)}>
                      {t(apt.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
