import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { 
  Stethoscope, 
  Users, 
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Droplet,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Patient {
  id: string;
  fullName: string;
  email: string;
  lastReading?: {
    value: number;
    timestamp: string;
  };
  permissions: string;
}

export default function PhysicianDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/provider/patients"],
  });

  const filteredPatients = patients?.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (value?: number) => {
    if (!value) return null;
    if (value < 70) return <Badge variant="destructive">Low</Badge>;
    if (value > 180) return <Badge variant="destructive">High</Badge>;
    return <Badge className="bg-success text-success-foreground">Normal</Badge>;
  };

  return (
    <DashboardLayout title={`Welcome, Dr. ${user?.fullName?.split(' ')[0] || 'Physician'}`}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-patient-count">
                {patients?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Patients with Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning" data-testid="text-alert-patients">
                {patients?.filter(p => p.lastReading && (p.lastReading.value < 70 || p.lastReading.value > 180)).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Role
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Doctor</div>
              <p className="text-sm text-muted-foreground">Clinical Access</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Patients
                </CardTitle>
                <CardDescription>
                  Patients who have shared their data with you
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-patients"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : filteredPatients && filteredPatients.length > 0 ? (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <div 
                    key={patient.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                    data-testid={`patient-row-${patient.id}`}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {patient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                    {patient.lastReading && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-primary" />
                          <span className="font-mono font-semibold">
                            {patient.lastReading.value}
                          </span>
                          <span className="text-sm text-muted-foreground">mg/dL</span>
                          {getStatusBadge(patient.lastReading.value)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(patient.lastReading.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {patient.permissions === "all" ? "Full" : "Glucose"}
                    </Badge>
                    <Link href={`/provider/patient/${patient.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-patient-${patient.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No patients yet</p>
                <p className="text-sm mt-1">
                  Patients will appear here when they add you to their care team
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
