import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Plus, Loader2, UserMinus, Stethoscope, Salad, Shield } from "lucide-react";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  permissions: z.enum(["glucose", "all"]),
});

type InviteData = z.infer<typeof inviteSchema>;

interface CareTeamMember {
  id: string;
  providerId: string;
  patientId: string;
  permissions: string;
  provider: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export default function CareTeam() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      permissions: "glucose",
    },
  });

  const { data: careTeam, isLoading } = useQuery<CareTeamMember[]>({
    queryKey: ["/api/care-team"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InviteData) => {
      const response = await apiRequest("POST", "/api/care-team", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-team"] });
      toast({ title: "Success", description: "Care team member added" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add team member",
        variant: "destructive" 
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/care-team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/care-team"] });
      toast({ title: "Removed", description: "Care team member removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
    },
  });

  const onSubmit = (data: InviteData) => {
    addMutation.mutate(data);
  };

  const getRoleIcon = (role: string) => {
    if (role === "physician") return <Stethoscope className="h-4 w-4" />;
    if (role === "dietitian") return <Salad className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  return (
    <DashboardLayout 
      title="Care Team"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-member">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Care Team Member</DialogTitle>
              <DialogDescription>
                Invite a physician or dietitian to view your health data.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="doctor@example.com"
                          data-testid="input-provider-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Access</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-permissions">
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="glucose">Glucose Only</SelectItem>
                          <SelectItem value="all">All Data (Glucose + Food + Activity)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={addMutation.isPending}
                  data-testid="button-submit-invite"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add to Care Team"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data Sharing
            </CardTitle>
            <CardDescription>
              Control who can view your health information. You can revoke access at any time.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-chart-2" />
              Your Care Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : careTeam && careTeam.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {careTeam.map((member) => (
                  <Card 
                    key={member.id} 
                    className="border-card-border"
                    data-testid={`care-team-member-${member.id}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                            {member.provider.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.provider.fullName}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {getRoleIcon(member.provider.role)}
                              <span className="capitalize">{member.provider.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant={member.permissions === "all" ? "default" : "secondary"}>
                          {member.permissions === "all" ? "Full Access" : "Glucose Only"}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive"
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Care Team Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {member.provider.fullName} from your care team? 
                                They will no longer be able to view your health data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMutation.mutate(member.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No care team members yet</p>
                <p className="text-sm mt-1">Add physicians or dietitians to share your health data</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first-member"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Care Team Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
