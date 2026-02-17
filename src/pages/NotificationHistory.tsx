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
import type { Notification, NotificationType } from "@/types/notification.types";

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <CardTitle>All Notifications</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {total} total
                </Badge>
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
              </div>
              <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={handleTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="order">Orders</SelectItem>
                      <SelectItem value="reservation">Reservations</SelectItem>
                      <SelectItem value="escalation">Escalations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterReadStatus} onValueChange={handleReadFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Message</TableHead>
                      <TableHead className="w-[100px]">Restaurant</TableHead>
                      <TableHead className="w-[120px]">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                          <p className="text-muted-foreground">Loading...</p>
                        </TableCell>
                      </TableRow>
                    ) : notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow
                          key={notification.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(notification)}
                        >
                          <TableCell>
                            {!notification.is_read && (
                              <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getNotificationTypeIcon(notification.type)}
                              <Badge
                                className={`capitalize ${notificationTypeBadgeColors[notification.type] ?? ""}`}
                              >
                                {notification.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {notification.title}
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[300px] truncate text-muted-foreground">
                            {notification.message || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {restaurantNames[notification.restaurant_id] ??
                              `#${notification.restaurant_id}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatRelativeTime(notification.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
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
