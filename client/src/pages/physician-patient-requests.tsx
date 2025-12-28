import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Check, X, User, Building2, Stethoscope, Loader2 } from "lucide-react";
import type { User as UserType, CareTeamRelation } from "@shared/schema";

interface PendingRequest extends CareTeamRelation {
  patient: UserType;
  hospitalName: string;
  doctorName: string;
  doctorSpecialization: string;
}

export default function PhysicianPatientRequests() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: pendingRequests = [], isLoading } = useQuery<PendingRequest[]>({
    queryKey: ["/api/care-team/pending-requests"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/care-team/requests/${requestId}/accept`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("requestAccepted"),
        description: t("patientWillBeAdded"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/care-team/pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/care-team/pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/provider/patients"] });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: "Failed to accept request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("POST", `/api/care-team/requests/${requestId}/reject`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t("requestRejected"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/care-team/pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/care-team/pending-count"] });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("patientRequests")}</h1>
          <p className="text-muted-foreground">{t("pendingRequests")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("noNewRequests")}</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.patient.profileImage || undefined} />
                      <AvatarFallback>
                        {request.patient.fullName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg" data-testid={`text-patient-name-${request.id}`}>
                        {request.patient.fullName}
                      </CardTitle>
                      <CardDescription className="truncate" data-testid={`text-patient-email-${request.id}`}>
                        {request.patient.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{t("pending")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span data-testid={`text-hospital-${request.id}`}>{request.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      <span data-testid={`text-doctor-${request.id}`}>
                        {request.doctorName} - {request.doctorSpecialization}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                      data-testid={`button-accept-${request.id}`}
                    >
                      {acceptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {t("acceptRequest")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                      data-testid={`button-reject-${request.id}`}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
