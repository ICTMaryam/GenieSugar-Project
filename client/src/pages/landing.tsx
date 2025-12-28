import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/language-context";
import { 
  Activity, 
  BarChart3, 
  Users, 
  Shield, 
  Utensils, 
  HeartPulse 
} from "lucide-react";

export default function Landing() {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2 flex-wrap">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">
                {t("login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">
                {t("register")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="flex justify-center mb-8">
              <Logo size="xl" showText={false} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {t("heroTitle")}
              <span className="text-primary block">{t("heroTitleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t("heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8" data-testid="button-get-started">
                  {t("startTracking")}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8" data-testid="button-login-hero">
                  {t("signIn")}
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-xl mx-auto">
              <p className="text-sm text-muted-foreground">
                <Shield className="inline h-4 w-4 mr-1" />
                {t("educationalNote")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-card">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {t("features")}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t("heroDescription")}
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <HeartPulse className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("glucoseTracking")}</h3>
                  <p className="text-muted-foreground">
                    {t("glucoseTrackingDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                    <Utensils className="h-6 w-6 text-chart-2" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("foodLogging")}</h3>
                  <p className="text-muted-foreground">
                    {t("foodLoggingDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                    <Activity className="h-6 w-6 text-chart-3" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("activityTracking")}</h3>
                  <p className="text-muted-foreground">
                    {t("activityTrackingDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-chart-4" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("reports")}</h3>
                  <p className="text-muted-foreground">
                    {t("glucoseChart")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-chart-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("careTeam")}</h3>
                  <p className="text-muted-foreground">
                    {t("careTeamDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("familySupport")}</h3>
                  <p className="text-muted-foreground">
                    {t("familyNotificationNote")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("startTracking")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("heroDescription")}
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8" data-testid="button-cta-bottom">
                {t("register")}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Student ID: 202200033 | {t("educationalNote")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
