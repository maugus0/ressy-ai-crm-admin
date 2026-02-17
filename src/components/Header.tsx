import { useState, useEffect, useCallback, useRef } from "react";
import {
  Menu,
  LogOut,
  Bell,
  AlertTriangle,
  X,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Users,
  RefreshCw,
  Building2,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import { getRestaurants } from "@/services/restaurants";
import { getNotificationNavigationTarget } from "@/lib/utils/notificationNavigation";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { getSSEEventIcon, getNotificationTypeIcon } from "@/lib/utils/notificationIcons";
import type { SSEEvent, Restaurant } from "@/types/api.types";
import type { Notification } from "@/types/notification.types";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  description?: string;
}

// Get event title
const getEventTitle = (event: SSEEvent) => {
  const titles: Record<string, string> = {
    user_requested: "Human Assistance Requested",
    internal_server_error: "System Error",
    suspected_spam: "Spam Detected",
    sms_redirect_failed: "SMS Redirect Failed",
    new_order: "New Order",
    order_updated: "Order Updated",
    order_cancelled: "Order Cancelled",
    new_reservation: "New Reservation",
    reservation_updated: "Reservation Updated",
    reservation_cancelled: "Reservation Cancelled",
  };
  // Use backend-provided title when available (e.g. sms_redirect_failed)
  if (
    event.data?.title &&
    typeof event.data.title === "string" &&
    event.event_type === "escalation"
  ) {
    return event.data.title;
  }
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
  const {
    events,
    unreadCount,
    readEventIds,
    isConnected,
    soundsEnabled,
    connectionStats,
    isLoadingStats,
    toggleSounds,
    markEventAsRead,
    dismissEvent,
    clearEvents,
    stopEventSound,
    refreshStats,
    persistentNotifications,
    persistentUnreadCount,
    fetchPersistentNotifications,
    isPersistentLoading,
  } = useSSE();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const restaurantsFetchedRef = useRef(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("*");

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch restaurants for name lookup
  const fetchRestaurants = useCallback(async () => {
    if (restaurantsFetchedRef.current) return; // Already fetched
    try {
      setIsLoadingRestaurants(true);
      const data = await getRestaurants({ limit: 100 }); // Fetch all restaurants
      setRestaurants(data.items);
      restaurantsFetchedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, []);

  // Get restaurant name by ID
  const getRestaurantName = useCallback(
    (restaurantId: string) => {
      const restaurant = restaurants.find((r) => r.id === parseInt(restaurantId));
      return restaurant?.name || `Restaurant #${restaurantId}`;
    },
    [restaurants]
  );

  // Fetch restaurants when connections panel opens
  useEffect(() => {
    if (isConnectionsOpen && isAdmin) {
      fetchRestaurants();
    }
  }, [isConnectionsOpen, isAdmin, fetchRestaurants]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationsOpen = (open: boolean) => {
    setIsNotificationsOpen(open);
    if (open) {
      fetchPersistentNotifications();
    }
  };

  // Combined unread count: live SSE + persistent
  const totalUnreadCount = unreadCount + persistentUnreadCount;
  const hasAnyNotifications = events.length > 0 || (persistentNotifications?.length ?? 0) > 0;

  const handleViewEscalations = () => {
    setIsNotificationsOpen(false);
    navigate("/escalations");
  };

  // Navigate to the appropriate page based on event type
  const handleNotificationClick = (event: SSEEvent) => {
    setIsNotificationsOpen(false);
    // Stop the sound for this notification (but keep it in the panel)
    stopEventSound(event.id);
    // Mark the event as read
    markEventAsRead(event.id);
    // Navigate to the appropriate page based on event type
    switch (event.event_type) {
      case "escalation":
        navigate("/escalations");
        break;
      case "order":
        navigate("/orders");
        break;
      case "reservation":
        navigate("/reservations");
        break;
      default:
        // No navigation for unknown event types
        break;
    }
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
          {/* Connection Status Indicator (Always visible) */}
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

          {/* SSE Connections Panel (Admin Only) */}
          {isAdmin && (
            <Popover open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground"
                  title="Active Connections"
                >
                  <Users className="w-5 h-5" />
                  {connectionStats && connectionStats.total_connections > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center"
                    >
                      {connectionStats.total_connections}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] max-w-[400px] p-0"
                align={isMobile ? "center" : "end"}
                sideOffset={8}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Active Connections</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshStats();
                    }}
                    disabled={isLoadingStats}
                    title="Refresh stats"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {/* Stats Content */}
                <div className="p-3 sm:p-4 space-y-4">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Your Connection
                    </span>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs sm:text-sm font-medium text-green-600">
                            Connected
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-xs sm:text-sm font-medium text-destructive">
                            Disconnected
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {connectionStats ? (
                    <>
                      {/* Connection Stats Grid - 3 columns */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-lg sm:text-2xl font-bold text-foreground">
                            {connectionStats.total_connections}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                          <p className="text-lg sm:text-2xl font-bold text-blue-600">
                            {connectionStats.admin_connections}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Admins</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                          <p className="text-lg sm:text-2xl font-bold text-green-600">
                            {connectionStats.total_connections - connectionStats.admin_connections}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Clients</p>
                        </div>
                      </div>

                      {/* Restaurants with Connections */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Restaurants Connected
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {connectionStats.restaurants_with_connections}
                          </Badge>
                        </div>

                        {Object.keys(connectionStats.connections_per_restaurant).length > 0 ? (
                          <ScrollArea className="max-h-[120px] sm:max-h-[150px]">
                            <div className="space-y-1.5 sm:space-y-2">
                              {Object.entries(connectionStats.connections_per_restaurant).map(
                                ([restaurantId, count]) => (
                                  <div
                                    key={restaurantId}
                                    className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                      <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                      <span className="text-xs sm:text-sm truncate">
                                        {isLoadingRestaurants
                                          ? `Loading...`
                                          : getRestaurantName(restaurantId)}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                                      {count} {count === 1 ? "user" : "users"}
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No restaurant clients connected
                          </p>
                        )}
                      </div>
                    </>
                  ) : isLoadingStats ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading stats...</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Wifi className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No connection data available</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

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
                {totalUnreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center"
                  >
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] max-w-[400px] p-0"
              align="end"
              sideOffset={8}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {hasAnyNotifications && (
                    <Badge variant="secondary" className="text-xs">
                      {events.length + (persistentNotifications?.length ?? 0)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSounds();
                    }}
                    title={
                      soundsEnabled ? "Mute notification sounds" : "Enable notification sounds"
                    }
                  >
                    {soundsEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  {events.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearEvents();
                      }}
                    >
                      <span className="hidden sm:inline">Clear all</span>
                      <span className="sm:hidden">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Events + Persistent Notifications List */}
              {hasAnyNotifications || isPersistentLoading ? (
                <ScrollArea className="h-[calc(100vh-250px)] max-h-[400px] sm:h-[400px]">
                  <div className="divide-y">
                    {/* Live SSE events first */}
                    {events.map((event) => {
                      const isRead = event.id ? readEventIds.has(event.id) : false;
                      return (
                        <div
                          key={`sse-${event.id}`}
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                            event.event_type === "escalation" ? "bg-destructive/5" : ""
                          } ${isRead ? "opacity-75" : ""}`}
                          onClick={() => handleNotificationClick(event)}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-0.5 flex-shrink-0">{getSSEEventIcon(event)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium break-words">
                                    {getEventTitle(event)}
                                  </p>
                                  {isRead ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-3.5 w-3.5 text-primary flex-shrink-0 fill-primary" />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 flex-shrink-0 opacity-50 hover:opacity-100 mt-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissEvent(event.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground break-words mt-0.5">
                                {getEventDescription(event)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Persistent (past) notifications */}
                    {isPersistentLoading && (persistentNotifications?.length ?? 0) === 0 ? (
                      <div className="px-3 sm:px-4 py-4 text-center text-muted-foreground text-sm">
                        Loading notifications…
                      </div>
                    ) : (
                      (persistentNotifications ?? []).map((notification) => (
                        <div
                          key={`persistent-${notification.id}`}
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                            notification.type === "escalation" ? "bg-destructive/5" : ""
                          } ${notification.is_read ? "opacity-75" : ""}`}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            const { pathname, search } =
                              getNotificationNavigationTarget(notification);
                            navigate(search ? `${pathname}${search}` : pathname);
                          }}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getNotificationTypeIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium break-words">
                                  {notification.title}
                                </p>
                                {notification.is_read ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-primary flex-shrink-0 fill-primary" />
                                )}
                              </div>
                              {notification.message && (
                                <p className="text-xs text-muted-foreground break-words mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-3 sm:px-4 py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">Events and past notifications will appear here</p>
                </div>
              )}

              {/* Footer - View Escalations and Notifications links (same styling; Escalations highlighted) */}
              <div className="px-3 sm:px-4 py-3 border-t bg-muted/30 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm border-2 border-primary text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewEscalations();
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {hasEscalations
                      ? `View Escalations (${events.filter((e) => e.event_type === "escalation").length})`
                      : "View Escalations"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm border-2 border-foreground/80 bg-muted/30 hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotificationsOpen(false);
                    navigate("/notifications");
                  }}
                >
                  <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">View All Notifications</span>
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
