import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/auth-context";
import { 
  LayoutDashboard, 
  Droplet, 
  Utensils, 
  Activity, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Shield,
  Stethoscope,
  Salad,
  MessageCircle,
  Bell,
  Heart,
  CalendarDays,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const patientMenuItems = [
  { titleKey: "dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "glucoseLog", url: "/glucose", icon: Droplet },
  { titleKey: "foodLog", url: "/food", icon: Utensils },
  { titleKey: "activityLog", url: "/activity", icon: Activity },
  { titleKey: "reports", url: "/reports", icon: BarChart3 },
  { titleKey: "careTeam", url: "/care-team", icon: Users },
  { titleKey: "chat", url: "/chat", icon: MessageCircle },
  { titleKey: "appointments", url: "/appointments", icon: CalendarDays },
  { titleKey: "alerts", url: "/alerts", icon: Bell },
  { titleKey: "familySupport", url: "/family", icon: Heart },
  { titleKey: "profile", url: "/profile", icon: Settings },
];

const physicianMenuItems = [
  { titleKey: "dashboard", url: "/physician", icon: LayoutDashboard },
  { titleKey: "myPatients", url: "/physician/patients", icon: Users },
  { titleKey: "patientRequests", url: "/physician/requests", icon: UserPlus },
  { titleKey: "chat", url: "/physician/chat", icon: MessageCircle },
  { titleKey: "appointments", url: "/physician/appointments", icon: CalendarDays },
  { titleKey: "profile", url: "/profile", icon: Settings },
];

const dietitianMenuItems = [
  { titleKey: "dashboard", url: "/dietitian", icon: LayoutDashboard },
  { titleKey: "myPatients", url: "/dietitian/patients", icon: Users },
  { titleKey: "chat", url: "/dietitian/chat", icon: MessageCircle },
  { titleKey: "profile", url: "/profile", icon: Settings },
];

const adminMenuItems = [
  { titleKey: "dashboard", url: "/admin", icon: LayoutDashboard },
  { titleKey: "userManagement", url: "/admin/users", icon: Users },
  { titleKey: "auditLogs", url: "/admin/audit", icon: Shield },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/chat/unread-count"],
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.count || 0;
  
  const { data: appointmentData } = useQuery<{ count: number }>({
    queryKey: ["/api/appointments/unseen-count"],
    refetchInterval: 30000,
    enabled: user?.role === "patient",
  });
  const unseenAppointments = appointmentData?.count || 0;
  
  const { data: pendingRequestsData } = useQuery<{ count: number }>({
    queryKey: ["/api/care-team/pending-count"],
    refetchInterval: 30000,
    enabled: user?.role === "physician",
  });
  const pendingRequests = pendingRequestsData?.count || 0;
  
  let menuItems = patientMenuItems;
  let roleIcon = <Droplet className="h-4 w-4" />;
  let roleKey: "patient" | "physician" | "dietitian" | "admin" = "patient";
  
  if (user?.role === "physician") {
    menuItems = physicianMenuItems;
    roleIcon = <Stethoscope className="h-4 w-4" />;
    roleKey = "physician";
  } else if (user?.role === "dietitian") {
    menuItems = dietitianMenuItems;
    roleIcon = <Salad className="h-4 w-4" />;
    roleKey = "dietitian";
  } else if (user?.role === "admin") {
    menuItems = adminMenuItems;
    roleIcon = <Shield className="h-4 w-4" />;
    roleKey = "admin";
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Logo size="sm" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isChat = item.titleKey === "chat";
                const isAppointments = item.titleKey === "appointments";
                const isPatientRequests = item.titleKey === "patientRequests";
                const chatBadge = isChat && unreadCount > 0;
                const appointmentBadge = isAppointments && unseenAppointments > 0;
                const requestsBadge = isPatientRequests && pendingRequests > 0;
                const badgeCount = isChat ? unreadCount : isAppointments ? unseenAppointments : isPatientRequests ? pendingRequests : 0;
                const showBadge = chatBadge || appointmentBadge || requestsBadge;
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={`link-${item.titleKey}`}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{t(item.titleKey as any)}</span>
                        {showBadge && (
                          <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            {user?.profileImage ? (
              <AvatarImage src={user.profileImage} alt={user.fullName || "User"} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.fullName || "User"}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {roleIcon}
              <span data-testid="text-user-role">{t(roleKey)}</span>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logout")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
