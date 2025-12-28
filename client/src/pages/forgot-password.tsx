import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "If an account exists with this email, you will receive a password reset link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  if (emailSent) {
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
                <CardTitle className="text-2xl" data-testid="text-email-sent-title">Check Your Email</CardTitle>
                <CardDescription>
                  We've sent a password reset link to your email address. The link will expire in 1 hour.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setEmailSent(false)}
                data-testid="button-try-again"
              >
                Try Again
              </Button>
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
              <CardTitle className="text-2xl" data-testid="text-forgot-password-title">Forgot Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10"
                            data-testid="input-email"
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
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-submit-forgot-password"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Remember your password? </span>
              <Link href="/login">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-login-from-forgot">
                  Sign in
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
