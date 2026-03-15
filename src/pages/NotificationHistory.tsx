/**
 * Notification History Page
 * Full list view with filters and pagination
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Filter, RefreshCw, Circle } from "lucide-react";
import { getAdminNotifications } from "@/lib/api/notifications";
import { getRestaurants } from "@/services/restaurants";
import { getNotificationNavigationTarget } from "@/lib/utils/notificationNavigation";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import {
  getNotificationTypeIcon,
  notificationTypeBadgeColors,
} from "@/lib/utils/notificationIcons";
import {
  getNotificationDisplayTitle,
  getNotificationDisplayMessage,
  getEscalationSubtypeLabel,
} from "@/lib/utils/notificationDisplay";
import type { Notification, NotificationType, EscalationSubtype } from "@/types/notification.types";

const PAGE_SIZE = 20;

// ============================================================================
// Component
// ============================================================================

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterReadStatus, setFilterReadStatus] = useState<"all" | "unread" | "read">("all");
  const [restaurantNames, setRestaurantNames] = useState<Record<number, string>>({});

  // Fetch restaurant names for display (API allows max limit 100)
  useEffect(() => {
    getRestaurants({ limit: 100 })
      .then((res) => {
        const map: Record<number, string> = {};
        res.items.forEach((r) => {
          map[r.id] = r.name;
        });
        setRestaurantNames(map);
      })
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        type: filterType === "all" ? undefined : filterType,
        is_read: filterReadStatus === "all" ? undefined : filterReadStatus === "read",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      const response = await getAdminNotifications(params);
      setNotifications(response.notifications);
      setTotal(response.total);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterReadStatus, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleTypeFilter = (value: string) => {
    setFilterType(value as NotificationType | "all");
    setPage(1);
  };

  const handleReadFilter = (value: string) => {
    setFilterReadStatus(value as "all" | "unread" | "read");
    setPage(1);
  };

  const handleRowClick = (notification: Notification) => {
    const { pathname, search } = getNotificationNavigationTarget(notification);
    navigate(search ? `${pathname}${search}` : pathname);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Notifications"
          description="View all notifications from all of our restaurants"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-4 p-4 sm:p-6 bg-muted/20 border-b border-border/50 rounded-t-lg">
              {/* Header row: title + badges on left, Refresh on right; stacks on small screens */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-5 w-5 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg sm:text-xl text-foreground">
                      All Notifications
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm font-medium text-muted-foreground border border-border/60"
                    >
                      {total} total
                    </Badge>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs sm:text-sm font-medium">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchNotifications}
                  disabled={isLoading}
                  className="w-full sm:w-auto sm:flex-shrink-0 border-border/80 hover:bg-muted/50"
                  aria-label="Refresh notifications"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 pt-1">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Select value={filterType} onValueChange={handleTypeFilter}>
                    <SelectTrigger className="w-full min-w-0 sm:w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="order">Orders</SelectItem>
                      <SelectItem value="reservation">Reservations</SelectItem>
                      <SelectItem value="escalation">Escalations</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterReadStatus} onValueChange={handleReadFilter}>
                  <SelectTrigger className="w-full min-w-0 sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {/* Table: horizontal scroll on small screens */}
              <div className="overflow-x-auto rounded-lg border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 border-b border-border font-medium">
                      <TableHead className="w-12 text-center align-middle">Status</TableHead>
                      <TableHead className="min-w-[220px] align-middle">Type</TableHead>
                      <TableHead className="min-w-[160px] align-middle">Title</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[200px] align-middle">
                        Message
                      </TableHead>
                      <TableHead className="min-w-[120px] hidden sm:table-cell align-middle">
                        Restaurant
                      </TableHead>
                      <TableHead className="w-[100px] min-w-[80px] whitespace-nowrap text-right align-middle">
                        Time
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Loading notifications…</p>
                        </TableCell>
                      </TableRow>
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                            <Bell className="h-6 w-6 text-muted-foreground/70" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            No notifications found
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting filters or check back later.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => {
                        const displayTitle = getNotificationDisplayTitle(notification);
                        const displayMessage = getNotificationDisplayMessage(notification) || "—";
                        return (
                          <TableRow
                            key={notification.id}
                            className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                              !notification.is_read ? "bg-primary/5 hover:bg-primary/10" : ""
                            } ${!notification.is_read ? "border-l-2 border-l-primary/40" : ""}`}
                            onClick={() => handleRowClick(notification)}
                          >
                            <TableCell className="text-center align-middle w-12">
                              {!notification.is_read && (
                                <Circle
                                  className="h-2.5 w-2.5 fill-primary text-primary inline-block"
                                  aria-hidden
                                />
                              )}
                            </TableCell>
                            <TableCell className="align-middle min-w-[220px]">
                              <div className="flex items-center gap-2">
                                <span className="flex-shrink-0">
                                  {getNotificationTypeIcon(notification.type)}
                                </span>
                                <Badge
                                  className={`capitalize whitespace-nowrap font-medium text-xs border-0 ${notificationTypeBadgeColors[notification.type] ?? ""}`}
                                >
                                  {notification.type === "escalation" && notification.subtype
                                    ? getEscalationSubtypeLabel(
                                        notification.subtype as EscalationSubtype
                                      )
                                    : notification.type}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium align-middle min-w-[160px]">
                              <div className="truncate max-w-[280px]" title={displayTitle}>
                                {displayTitle}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5 sm:hidden">
                                {notification.restaurant_id == null
                                  ? "All Restaurants"
                                  : (restaurantNames[notification.restaurant_id] ??
                                    `#${notification.restaurant_id}`)}
                              </p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell align-middle text-muted-foreground text-sm min-w-[200px] max-w-[360px]">
                              <span
                                className="line-clamp-2 block"
                                title={displayMessage !== "—" ? displayMessage : undefined}
                              >
                                {displayMessage}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm align-middle hidden sm:table-cell min-w-[120px]">
                              {notification.restaurant_id == null
                                ? "All Restaurants"
                                : (restaurantNames[notification.restaurant_id] ??
                                  `#${notification.restaurant_id}`)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap text-right align-middle w-[100px] tabular-nums">
                              {formatRelativeTime(notification.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="flex-1 min-w-0 sm:flex-initial border-border/80 hover:bg-muted/50"
                    aria-label="Previous page"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <span className="text-sm text-muted-foreground px-2 shrink-0 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                    className="flex-1 min-w-0 sm:flex-initial border-border/80 hover:bg-muted/50"
                    aria-label="Next page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default NotificationHistory;
