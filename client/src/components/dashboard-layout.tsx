import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/language-context";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const { dir } = useLanguage();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full" dir={dir}>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Separator orientation="vertical" className="h-4" />
              {title && (
                <h1 className="text-lg font-semibold" data-testid="text-page-title">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/download-code'}
                data-testid="button-download-code"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Code
              </Button>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
