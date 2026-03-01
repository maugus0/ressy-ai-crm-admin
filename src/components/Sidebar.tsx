import type { LucideIcon } from "lucide-react";
import {
  Store,
  UtensilsCrossed,
  HelpCircle,
  Users,
  LogOut,
  Phone,
  PhoneCall,
  ShoppingCart,
  CalendarDays,
  AlertTriangle,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// Navigation items: Notifications first, then Callers, Calls, Escalations (highlighted), then core pages, with Kill-Switch intentionally last
type NavItem = {
  name: string;
  icon: LucideIcon;
  path: string;
  highlight?: boolean;
};
const navigationItems: NavItem[] = [
  { name: "Notifications", icon: Bell, path: "/notifications", highlight: true },
  { name: "Callers", icon: Phone, path: "/callers" },
  { name: "Calls", icon: PhoneCall, path: "/calls" },
  { name: "Escalations", icon: AlertTriangle, path: "/escalations", highlight: true },
  { name: "FAQs", icon: HelpCircle, path: "/faq" },
  { name: "Menu", icon: UtensilsCrossed, path: "/menu" },
  { name: "Orders", icon: ShoppingCart, path: "/orders" },
  { name: "Reservations", icon: CalendarDays, path: "/reservations" },
  { name: "Restaurants", icon: Store, path: "/restaurants" },
  { name: "Users", icon: Users, path: "/users" },
  {
    name: "Kill-Switch",
    icon: ShieldAlert,
    path: "/kill-switch",
    highlight: true,
  },
];

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}ressy-white.png`}
            alt="Ressy Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isHighlight = item.highlight === true;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-sm",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isHighlight &&
                        "border-l-2 border-primary/80 font-medium bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20",
                      isHighlight &&
                        isActive &&
                        "bg-primary/20 border-primary ring-2 ring-primary/30 ring-inset dark:bg-primary/25 dark:ring-primary/40",
                      isHighlight &&
                        !isActive &&
                        "hover:ring-2 hover:ring-primary/25 hover:ring-inset dark:hover:ring-primary/30"
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

        {/* Logout action */}
        <div className="px-4 pb-2">
          <button
            onClick={handleLogout}
            className={cn(
              "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border text-center bg-gradient-to-t from-sidebar/90 to-transparent">
          <p className="text-xs text-sidebar-foreground/60 tracking-wide">
            &copy; 2025 <span className="font-semibold">Ressy</span>
          </p>
        </div>
      </div>
    </>
  );
}
