import { Link, useLocation } from "wouter";
import { Home, BookOpen, BarChart3, User, Coins } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Lessons", url: "/lessons", icon: BookOpen },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

type AppSidebarProps = {
  credits?: number;
};

export function AppSidebar({ credits = 0 }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-lg">Learn-AI</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between p-3 rounded-md bg-sidebar-accent">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Credits</span>
          </div>
          <Badge variant="secondary" data-testid="sidebar-credits">
            {credits}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
