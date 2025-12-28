import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Loader2, Shield, Stethoscope, Salad, Droplet, Camera, Trash2 } from "lucide-react";
import { z } from "zod";
import { useRef, useState } from "react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  diabetesType: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      diabetesType: user?.diabetesType || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await apiRequest("PATCH", "/api/users/profile", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({ title: "Success", description: "Profile updated" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update profile",
        variant: "destructive" 
      });
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/users/profile-image");
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({ title: "Success", description: "Profile image removed" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove image",
        variant: "destructive" 
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const response = await apiRequest("PATCH", "/api/users/profile", {
            profileImage: base64,
          });
          const data = await response.json();
          login(data.user);
          toast({ title: "Success", description: "Profile image updated" });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingImage(false);
      toast({
        title: "Error",
        description: "Failed to read image file",
        variant: "destructive",
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: ProfileData) => {
    updateMutation.mutate(data);
  };

  const getRoleIcon = () => {
    if (user?.role === "physician") return <Stethoscope className="h-5 w-5" />;
    if (user?.role === "dietitian") return <Salad className="h-5 w-5" />;
    if (user?.role === "admin") return <Shield className="h-5 w-5" />;
    return <Droplet className="h-5 w-5" />;
  };

  const getInitials = () => {
    if (!user?.fullName) return "U";
    const names = user.fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-2xl space-y-6">
        <Card className="border-card-border">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {user?.profileImage ? (
                    <AvatarImage src={user.profileImage} alt={user.fullName} />
                  ) : null}
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    data-testid="button-upload-image"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-profile-image"
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl" data-testid="text-profile-name">
                  {user?.fullName || "User"}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getRoleIcon()}
                  <Badge variant="secondary" className="capitalize" data-testid="text-profile-role">
                    {user?.role || "Patient"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    data-testid="button-change-photo"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {user?.profileImage ? "Change Photo" : "Add Photo"}
                      </>
                    )}
                  </Button>
                  {user?.profileImage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImageMutation.mutate()}
                      disabled={removeImageMutation.isPending}
                      data-testid="button-remove-photo"
                    >
                      {removeImageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your name"
                          data-testid="input-profile-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Email</FormLabel>
                  <Input 
                    value={user?.email || ""} 
                    disabled 
                    className="mt-2 bg-muted"
                    data-testid="input-profile-email"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {user?.role === "patient" && (
                  <FormField
                    control={form.control}
                    name="diabetesType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diabetes Type (optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-diabetes-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="type1">Type 1</SelectItem>
                            <SelectItem value="type2">Type 2</SelectItem>
                            <SelectItem value="gestational">Gestational</SelectItem>
                            <SelectItem value="prediabetes">Prediabetes</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 flex-wrap">
              <div>
                <p className="font-medium">Account Role</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user?.role || "Patient"}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {user?.role || "patient"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 flex-wrap">
              <div>
                <p className="font-medium">Account ID</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.id?.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
