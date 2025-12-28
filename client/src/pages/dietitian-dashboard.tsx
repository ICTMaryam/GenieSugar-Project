import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { 
  Salad, 
  Users, 
  Search,
  Utensils,
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
  recentFoodLog?: {
    foodName: string;
    mealType: string;
    timestamp: string;
  };
  permissions: string;
}

export default function DietitianDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/provider/patients"],
  });

  const filteredPatients = patients?.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const patientsWithFoodAccess = patients?.filter(p => p.permissions === "all") || [];

  return (
    <DashboardLayout title={`Welcome, ${user?.fullName?.split(' ')[0] || 'Dietitian'}`}>
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
                With Food Access
              </CardTitle>
              <Utensils className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2" data-testid="text-food-access">
                {patientsWithFoodAccess.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Role
              </CardTitle>
              <Salad className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Dietitian</div>
              <p className="text-sm text-muted-foreground">Nutrition Focus</p>
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
                  View food logs and glucose data for your patients
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
                    <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center text-chart-2 font-semibold">
                      {patient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      {patient.recentFoodLog && patient.permissions === "all" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Utensils className="inline h-3 w-3 mr-1" />
                          Last: {patient.recentFoodLog.foodName} ({patient.recentFoodLog.mealType})
                        </p>
                      )}
                    </div>
                    {patient.lastReading && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-primary" />
                          <span className="font-mono font-semibold">
                            {patient.lastReading.value}
                          </span>
                          <span className="text-sm text-muted-foreground">mg/dL</span>
                        </div>
                      </div>
                    )}
                    <Badge variant={patient.permissions === "all" ? "default" : "secondary"} className="text-xs">
                      {patient.permissions === "all" ? "Full Access" : "Glucose Only"}
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
