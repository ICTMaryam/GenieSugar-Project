import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { LanguageProvider } from "@/lib/language-context";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PatientDashboard from "@/pages/patient-dashboard";
import GlucoseLog from "@/pages/glucose-log";
import FoodLog from "@/pages/food-log";
import ActivityLog from "@/pages/activity-log";
import Reports from "@/pages/reports";
import CareTeam from "@/pages/care-team";
import Profile from "@/pages/profile";
import PhysicianDashboard from "@/pages/physician-dashboard";
import DietitianDashboard from "@/pages/dietitian-dashboard";
import PatientView from "@/pages/patient-view";
import AdminDashboard from "@/pages/admin-dashboard";
import Chat from "@/pages/chat";
import AlertSettingsPage from "@/pages/alert-settings";
import FamilyContactsPage from "@/pages/family-contacts";
import PhysicianAppointments from "@/pages/physician-appointments";
import PatientAppointments from "@/pages/patient-appointments";
import PhysicianPatientRequests from "@/pages/physician-patient-requests";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";

function ProtectedRoute({ component: Component, allowedRoles }: { 
  component: () => JSX.Element; 
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "physician") return <Redirect to="/physician" />;
    if (user.role === "dietitian") return <Redirect to="/dietitian" />;
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "physician") return <Redirect to="/physician" />;
    if (user.role === "dietitian") return <Redirect to="/dietitian" />;
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Landing} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      <Route path="/forgot-password" component={() => <PublicRoute component={ForgotPassword} />} />
      <Route path="/reset-password/:token" component={() => <ResetPassword />} />
      
      <Route path="/dashboard" component={() => <ProtectedRoute component={PatientDashboard} allowedRoles={["patient"]} />} />
      <Route path="/glucose" component={() => <ProtectedRoute component={GlucoseLog} allowedRoles={["patient"]} />} />
      <Route path="/food" component={() => <ProtectedRoute component={FoodLog} allowedRoles={["patient"]} />} />
      <Route path="/activity" component={() => <ProtectedRoute component={ActivityLog} allowedRoles={["patient"]} />} />
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} allowedRoles={["patient"]} />} />
      <Route path="/care-team" component={() => <ProtectedRoute component={CareTeam} allowedRoles={["patient"]} />} />
      <Route path="/chat" component={() => <ProtectedRoute component={Chat} allowedRoles={["patient"]} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={AlertSettingsPage} allowedRoles={["patient"]} />} />
      <Route path="/family" component={() => <ProtectedRoute component={FamilyContactsPage} allowedRoles={["patient"]} />} />
      <Route path="/appointments" component={() => <ProtectedRoute component={PatientAppointments} allowedRoles={["patient"]} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      
      <Route path="/physician" component={() => <ProtectedRoute component={PhysicianDashboard} allowedRoles={["physician"]} />} />
      <Route path="/physician/patients" component={() => <ProtectedRoute component={PhysicianDashboard} allowedRoles={["physician"]} />} />
      <Route path="/physician/requests" component={() => <ProtectedRoute component={PhysicianPatientRequests} allowedRoles={["physician"]} />} />
      <Route path="/physician/appointments" component={() => <ProtectedRoute component={PhysicianAppointments} allowedRoles={["physician"]} />} />
      <Route path="/physician/chat" component={() => <ProtectedRoute component={Chat} allowedRoles={["physician"]} />} />
      
      <Route path="/dietitian" component={() => <ProtectedRoute component={DietitianDashboard} allowedRoles={["dietitian"]} />} />
      <Route path="/dietitian/patients" component={() => <ProtectedRoute component={DietitianDashboard} allowedRoles={["dietitian"]} />} />
      <Route path="/dietitian/chat" component={() => <ProtectedRoute component={Chat} allowedRoles={["dietitian"]} />} />
      
      <Route path="/provider/patient/:id" component={() => <ProtectedRoute component={PatientView} allowedRoles={["physician", "dietitian"]} />} />
      
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />} />
      <Route path="/admin/audit" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
