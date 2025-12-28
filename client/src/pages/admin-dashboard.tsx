import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  Search,
  Droplet,
  Stethoscope,
  Salad,
  Lock,
  Unlock,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import type { User, AuditLog } from "@shared/schema";

interface AdminUser extends User {
  isLocked?: boolean;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ userId, lock }: { userId: string; lock: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/lock`, { lock });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    if (role === "physician") return <Stethoscope className="h-4 w-4" />;
    if (role === "dietitian") return <Salad className="h-4 w-4" />;
    if (role === "admin") return <Shield className="h-4 w-4" />;
    return <Droplet className="h-4 w-4" />;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "physician") return "bg-chart-2/10 text-chart-2";
    if (role === "dietitian") return "bg-success/10 text-success";
    if (role === "admin") return "bg-chart-4/10 text-chart-4";
    return "bg-primary/10 text-primary";
  };

  const userCounts = {
    total: users?.length || 0,
    patients: users?.filter(u => u.role === "patient").length || 0,
    physicians: users?.filter(u => u.role === "physician").length || 0,
    dietitians: users?.filter(u => u.role === "dietitian").length || 0,
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-total-users">
                {userCounts.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Patients
              </CardTitle>
              <Droplet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{userCounts.patients}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Doctors
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{userCounts.physicians}</div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dietitians
              </CardTitle>
              <Salad className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{userCounts.dietitians}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card className="border-card-border">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>View and manage all users</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-users"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32" data-testid="select-role-filter">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="physician">Doctor</SelectItem>
                        <SelectItem value="dietitian">Dietitian</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                    ))}
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <span className="mr-1">{getRoleIcon(user.role)}</span>
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                        {user.isLocked && (
                          <Badge variant="destructive">Locked</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleLockMutation.mutate({ 
                            userId: user.id, 
                            lock: !user.isLocked 
                          })}
                          disabled={toggleLockMutation.isPending || user.role === "admin"}
                          data-testid={`button-toggle-lock-${user.id}`}
                        >
                          {user.isLocked ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <CardDescription>System activity and security events</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-12 animate-pulse bg-muted rounded-lg" />
                    ))}
                  </div>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{log.action}</p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.timestamp && format(new Date(log.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
