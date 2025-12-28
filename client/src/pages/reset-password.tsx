import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Lock } from "lucide-react";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [resetSuccess, setResetSuccess] = useState(false);

  const { data: tokenValid, isLoading: verifyingToken, error: tokenError } = useQuery({
    queryKey: ['/api/auth/verify-reset-token', token],
    queryFn: async () => {
      const response = await fetch(`/api/auth/verify-reset-token/${token}`);
      const data = await response.json();
      if (!response.ok || !data.valid) {
        throw new Error(data.message || "Invalid or expired reset link");
      }
      return data;
    },
    retry: false,
  });

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
  };

  if (verifyingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !tokenValid) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 px-6 flex items-center justify-between gap-4 border-b border-border">
          <Link href="/login">
            <Button variant="ghost" size="sm" data-testid="link-back-login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-card-border">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl" data-testid="text-invalid-link-title">Invalid or Expired Link</CardTitle>
                <CardDescription>
                  This password reset link is no longer valid. It may have expired or already been used.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Link href="/forgot-password">
                <Button data-testid="button-request-new-link">
                  Request New Reset Link
                </Button>
              </Link>
              <div className="pt-4">
                <Link href="/login">
                  <span className="text-primary hover:underline cursor-pointer text-sm" data-testid="link-back-to-login">
                    Return to Login
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 px-6 flex items-center justify-between gap-4 border-b border-border">
          <Link href="/login">
            <Button variant="ghost" size="sm" data-testid="link-back-login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-card-border">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl" data-testid="text-reset-success-title">Password Reset Complete</CardTitle>
                <CardDescription>
                  Your password has been successfully reset. You can now sign in with your new password.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/login">
                <Button data-testid="button-sign-in">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 px-6 flex items-center justify-between gap-4 border-b border-border">
        <Link href="/login">
          <Button variant="ghost" size="sm" data-testid="link-back-login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-card-border">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <div>
              <CardTitle className="text-2xl" data-testid="text-reset-password-title">Reset Your Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="Enter new password" 
                            className="pl-10"
                            data-testid="input-password"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="Confirm new password" 
                            className="pl-10"
                            data-testid="input-confirm-password"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-submit-reset-password"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
