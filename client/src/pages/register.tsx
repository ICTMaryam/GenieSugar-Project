import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { 
  patientRegisterSchema, 
  doctorRegisterSchema, 
  dietitianRegisterSchema,
  hospitalDirectory, 
  doctorDirectory,
  type PatientRegisterData,
  type DoctorRegisterData, 
  type DietitianRegisterData 
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowLeft, User, Stethoscope, Apple, Building2, UserRound } from "lucide-react";
import { useState, useMemo } from "react";

type RoleType = "patient" | "physician" | "dietitian";

const getDefaultValues = (role: RoleType) => ({
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  role: role,
  consent: false,
  licenseNumber: "",
  hospitalClinic: "",
  selectedHospitalId: "",
  selectedDoctorId: "",
  diabetesType: "",
});

const getValidationSchema = (role: RoleType) => {
  if (role === "patient") return patientRegisterSchema;
  if (role === "physician") return doctorRegisterSchema;
  return dietitianRegisterSchema;
};

interface RegisterFormProps {
  role: RoleType;
  onRoleChange: (role: RoleType) => void;
}

function RegisterForm({ role, onRoleChange }: RegisterFormProps) {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");

  const form = useForm<PatientRegisterData | DoctorRegisterData | DietitianRegisterData>({
    resolver: zodResolver(getValidationSchema(role)),
    defaultValues: getDefaultValues(role) as any,
  });

  const filteredDoctors = useMemo(() => {
    if (!selectedHospitalId) return [];
    return doctorDirectory.filter(doc => doc.hospitalId === selectedHospitalId);
  }, [selectedHospitalId]);

  const registerMutation = useMutation({
    mutationFn: async (data: PatientRegisterData | DoctorRegisterData | DietitianRegisterData) => {
      const { confirmPassword, consent, ...registerData } = data as any;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: t("success"),
        description: t("createAccount"),
      });
      const userRole = data.user.role;
      if (userRole === "admin") {
        setLocation("/admin");
      } else if (userRole === "physician") {
        setLocation("/physician");
      } else if (userRole === "dietitian") {
        setLocation("/dietitian");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientRegisterData | DoctorRegisterData | DietitianRegisterData) => {
    registerMutation.mutate(data);
  };

  const handleHospitalChange = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    form.setValue("selectedHospitalId" as any, hospitalId);
    form.setValue("selectedDoctorId" as any, "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-6">
          <FormLabel className="block mb-3">{t("iAmA")}</FormLabel>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onRoleChange("patient")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                role === "patient" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              data-testid="button-role-patient"
            >
              <div className={`p-3 rounded-lg ${role === "patient" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t("patient")}</span>
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("physician")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                role === "physician" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              data-testid="button-role-physician"
            >
              <div className={`p-3 rounded-lg ${role === "physician" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t("physician")}</span>
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("dietitian")}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                role === "dietitian" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
              data-testid="button-role-dietitian"
            >
              <div className={`p-3 rounded-lg ${role === "dietitian" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <Apple className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{t("dietitian")}</span>
            </button>
          </div>
        </div>

        {role === "patient" && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("selectYourDoctor")}
              </h3>
              
              <FormField
                control={form.control}
                name="selectedHospitalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">{t("hospital")} *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleHospitalChange(value);
                      }} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-hospital">
                          <SelectValue placeholder={t("selectHospital")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hospitalDirectory.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedDoctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">{t("doctor")} *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                      disabled={!selectedHospitalId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder={selectedHospitalId ? t("selectDoctor") : t("selectHospitalFirst")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            <div className="flex items-center gap-2">
                              <UserRound className="h-4 w-4" />
                              <div>
                                <div>{doctor.name}</div>
                                <div className="text-xs text-muted-foreground">{doctor.specialization}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diabetesType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">{t("diabetesType")} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-diabetes-type">
                          <SelectValue placeholder={t("selectDiabetesType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="type1">{t("type1Diabetes")}</SelectItem>
                        <SelectItem value="type2">{t("type2Diabetes")}</SelectItem>
                        <SelectItem value="gestational">{t("gestationalDiabetes")}</SelectItem>
                        <SelectItem value="prediabetes">{t("prediabetes")}</SelectItem>
                        <SelectItem value="other">{t("otherDiabetesType")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {role === "physician" && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 space-y-4">
              <h3 className="font-semibold">{t("doctorVerification")}</h3>
              
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">{t("medicalLicenseNumber")} *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="BH-MD-12345" 
                        data-testid="input-license"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hospitalClinic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">{t("hospitalClinic")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-hospital-clinic">
                          <SelectValue placeholder={t("selectHospital")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hospitalDirectory.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.name}>
                            {hospital.name} - {hospital.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder="John Doe" 
                  data-testid="input-fullname"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="you@example.com" 
                  data-testid="input-email"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="At least 8 characters" 
                  data-testid="input-password"
                  {...field} 
                />
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
              <FormLabel>{t("confirmPassword")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Confirm your password" 
                  data-testid="input-confirm-password"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-consent"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  {t("termsConsent")}
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={registerMutation.isPending}
          data-testid="button-submit-register"
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("loading")}
            </>
          ) : (
            t("createAccount")
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function Register() {
  const { t, dir } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<RoleType>("patient");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <header className="h-16 px-6 flex items-center justify-between gap-4 border-b border-border">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-card-border">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <div>
              <CardTitle className="text-2xl" data-testid="text-register-title">{t("createAccount")}</CardTitle>
              <CardDescription>{t("heroDescription")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RegisterForm 
              key={selectedRole} 
              role={selectedRole} 
              onRoleChange={setSelectedRole} 
            />

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t("alreadyHaveAccount")} </span>
              <Link href="/login">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-login-from-register">
                  {t("signIn")}
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
