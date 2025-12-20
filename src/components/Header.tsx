import { useState } from "react";
import {
  Menu,
  LogOut,
  Bell,
  AlertTriangle,
  ShoppingBag,
  CalendarDays,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import type { SSEEvent } from "@/types/api.types";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  description?: string;
}

// Format relative time
const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Get icon for event type
const getEventIcon = (event: SSEEvent) => {
  switch (event.event_type) {
    case "escalation":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "order":
      return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    case "reservation":
      return <CalendarDays className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

// Get event title
const getEventTitle = (event: SSEEvent) => {
  const titles: Record<string, string> = {
    user_requested: "Human Assistance Requested",
    internal_server_error: "System Error",
    suspected_spam: "Spam Detected",
    new_order: "New Order",
    order_updated: "Order Updated",
    order_cancelled: "Order Cancelled",
    new_reservation: "New Reservation",
    reservation_updated: "Reservation Updated",
    reservation_cancelled: "Reservation Cancelled",
  };
  return titles[event.subtype] || event.subtype;
};

// Get event description
const getEventDescription = (event: SSEEvent) => {
  const restaurantName =
    (event.data?.restaurant_name as string) || `Restaurant #${event.restaurant_id}`;
  return restaurantName;
};

export function Header({ onMenuClick, title = "Dashboard", description }: HeaderProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { events, unreadCount, isConnected, markAsRead, dismissEvent, clearEvents } = useSSE();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationsOpen = (open: boolean) => {
    setIsNotificationsOpen(open);
    if (open) {
      markAsRead();
    }
  };

  const handleViewEscalations = () => {
    setIsNotificationsOpen(false);
    navigate("/escalations");
  };

  // Show all events (not just recent 10)
  const hasEscalations = events.some((e) => e.event_type === "escalation");

  return (
    <div className="bg-background border-b border-border p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-accent rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground hidden sm:block mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground"
            title={isConnected ? "Live updates connected" : "Live updates disconnected"}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className="hidden lg:inline">{isConnected ? "Live" : "Offline"}</span>
          </div>

          {/* Notifications Bell */}
          <Popover open={isNotificationsOpen} onOpenChange={handleNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {events.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {events.length}
                    </Badge>
                  )}
                </div>
                {events.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearEvents}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Events List */}
              {events.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="divide-y">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`px-4 py-3 hover:bg-muted/50 transition-colors ${
                          event.event_type === "escalation" ? "bg-destructive/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getEventIcon(event)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">{getEventTitle(event)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 flex-shrink-0 opacity-50 hover:opacity-100"
                                onClick={() => dismissEvent(event.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {getEventDescription(event)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">Events will appear here in real-time</p>
                </div>
              )}

              {/* Footer - Always show View Escalations link */}
              <div className="px-4 py-3 border-t bg-muted/30">
                <Button
                  variant={hasEscalations ? "default" : "outline"}
                  size="sm"
                  className="w-full text-sm"
                  onClick={handleViewEscalations}
                >
                  <AlertTriangle
                    className={`h-4 w-4 mr-2 ${hasEscalations ? "" : "text-muted-foreground"}`}
                  />
                  {hasEscalations
                    ? `View Escalations (${events.filter((e) => e.event_type === "escalation").length})`
                    : "View Escalations"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {user && (
            <span className="text-sm text-muted-foreground hidden md:block">{user.email}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
