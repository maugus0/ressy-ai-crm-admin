import { Users, UserPlus, Award, CreditCard, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationItems = [
  { name: "Clients", icon: Users, path: "/" },
  { name: "Onboard", icon: UserPlus, path: "/onboard" },
  { name: "Tiers", icon: Award, path: "/tiers" },
  { name: "Billing Rules", icon: CreditCard, path: "/billing" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
          <img
            src="/ressy-white.png"
            alt="Ressy Logo"
            className="h-8 w-auto"
          />
        </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/70">© 2025 Ressy</p>
        </div>
      </div>
    </>
  );
}