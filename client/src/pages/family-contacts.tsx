import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Plus, Trash2, Loader2, Phone, Mail, Heart } from "lucide-react";
import { z } from "zod";
import type { FamilyContact } from "@shared/schema";

const familyContactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
});

type FamilyContactForm = z.infer<typeof familyContactSchema>;

export default function FamilyContactsPage() {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useQuery<FamilyContact[]>({
    queryKey: ["/api/family-contacts"],
  });

  const form = useForm<FamilyContactForm>({
    resolver: zodResolver(familyContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      relationship: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: FamilyContactForm) => {
      const response = await apiRequest("POST", "/api/family-contacts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-contacts"] });
      toast({
        title: t("success"),
        description: "Family contact added successfully",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/family-contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family-contacts"] });
      toast({
        title: t("success"),
        description: "Contact removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FamilyContactForm) => {
    addMutation.mutate(data);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRelationshipLabel = (rel: string) => {
    const labels: Record<string, string> = {
      parent: t("parent"),
      spouse: t("spouse"),
      sibling: t("sibling"),
      child: t("child"),
      other: t("other"),
    };
    return labels[rel] || rel;
  };

  return (
    <DashboardLayout title={t("familySupport")}>
    <div className="max-w-4xl mx-auto space-y-6" dir={dir}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-family-contacts-title">{t("familyContacts")}</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-family-contact">
              <Plus className="h-4 w-4 mr-2" />
              {t("addFamilyContact")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addFamilyContact")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" data-testid="input-family-name" {...field} />
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
                      <FormLabel>{t("familyEmail")}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="family@example.com" data-testid="input-family-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("familyPhone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+973 1234 5678" data-testid="input-family-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("relationship")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-relationship">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">{t("parent")}</SelectItem>
                          <SelectItem value="spouse">{t("spouse")}</SelectItem>
                          <SelectItem value="sibling">{t("sibling")}</SelectItem>
                          <SelectItem value="child">{t("child")}</SelectItem>
                          <SelectItem value="other">{t("other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={addMutation.isPending} data-testid="button-submit-family-contact">
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("add")
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-card-border bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-destructive" />
            {t("familyNotificationNote")}
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id} className="border-card-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`text-contact-name-${contact.id}`}>{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{getRelationshipLabel(contact.relationship)}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {contact.email}
                        </p>
                        {contact.phone && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(contact.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-contact-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-card-border border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No Family Contacts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add family members who should be notified in case of emergencies
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-contact">
              <Plus className="h-4 w-4 mr-2" />
              {t("addFamilyContact")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
}
