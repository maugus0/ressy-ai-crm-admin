/**
 * Escalations List Page (Database)
 * Displays paginated list of all escalations from the database with filters
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
import { AlertTriangle, Filter, RefreshCw, Phone, Clock, Bell, ChevronRight } from "lucide-react";
import { getAdminEscalations } from "@/lib/api/escalations";
import {
  escalationStatusColors as statusColors,
  escalationUrgencyColors as urgencyColors,
} from "@/lib/utils/escalationStyles";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type {
  Escalation,
  EscalationStatus,
  EscalationUrgency,
  EscalationQueryParams,
} from "@/types/escalation.types";

// ============================================================================
// Component
// ============================================================================

const EscalationsList = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<EscalationQueryParams>({
    page: 1,
    limit: 20,
    sort_by: "requested_at",
    sort_order: "desc",
  });

  const fetchEscalations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAdminEscalations({ ...filters, page });
      setEscalations(response.escalations);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch escalations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as EscalationStatus),
    }));
    setPage(1);
  };

  const handleUrgencyFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      urgency: value === "all" ? undefined : (value as EscalationUrgency),
    }));
    setPage(1);
  };

  const handleRowClick = (escalation: Escalation) => {
    navigate(`/escalations/${escalation.id}`);
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));

  // Calculate stats (guard: escalations may be undefined before first fetch)
  const list = escalations ?? [];
  const stats = {
    raised: list.filter((e) => e.status === "raised").length,
    forwarded: list.filter((e) => e.status === "forwarded").length,
    failed: list.filter((e) => e.status === "failed").length,
    resolved: list.filter((e) => e.status === "resolved").length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Escalations History"
          description="View and manage all escalations from the database"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <CardTitle>All Escalations</CardTitle>
                  <Badge variant="secondary">{total} total</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Live Escalations */}
                  <Button variant="outline" size="sm" onClick={() => navigate("/escalations")}>
                    <Bell className="h-4 w-4 mr-2" />
                    Live Alerts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEscalations}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              {total > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                    <p className="text-xs text-muted-foreground mb-1">Raised</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.raised}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-xs text-muted-foreground mb-1">Forwarded</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.forwarded}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                    <p className="text-xs text-muted-foreground mb-1">Failed</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                    <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="raised">Raised</SelectItem>
                      <SelectItem value="forwarded">Forwarded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filters.urgency || "all"} onValueChange={handleUrgencyFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Urgency</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="hidden md:table-cell">Caller</TableHead>
                      <TableHead className="hidden lg:table-cell">Restaurant</TableHead>
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                          <p className="text-muted-foreground">Loading...</p>
                        </TableCell>
                      </TableRow>
                    ) : list.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No escalations found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      list.map((escalation) => (
                        <TableRow
                          key={escalation.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(escalation)}
                        >
                          <TableCell>
                            <Badge className={statusColors[escalation.status]}>
                              {escalation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={urgencyColors[escalation.urgency]}>
                              {escalation.urgency}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {escalation.reason || "No reason provided"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">
                                {escalation.caller_phone || "Unknown"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {escalation.restaurant_name || `#${escalation.restaurant_id}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(escalation.requested_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

export default EscalationsList;
