import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  FileText,
  Search,
  Filter,
  X,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  XCircle,
  RefreshCw,
  Bot,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getRestaurants } from "@/services/restaurants";
import {
  getCalls,
  getCallDetails,
  getCallAnalytics,
  deleteCall,
  deleteTranscript,
} from "@/services/calls";
import type {
  Restaurant,
  CallListItem,
  CallDetails,
  CallAnalytics,
  CallParams,
} from "@/types/api.types";

// ============================================================================
// Helper Functions
// ============================================================================

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default" as const;
    case "missed":
      return "destructive" as const;
    case "in-progress":
    case "in_progress":
      return "secondary" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const getDayName = (dayOfWeek: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || `Day ${dayOfWeek}`;
};

const formatCost = (cost: number | null): string => {
  if (cost === null || cost === undefined) return "-";
  return `$${cost.toFixed(4)}`;
};

// ============================================================================
// Component
// ============================================================================

const Calls = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("*");

  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Calls state
  const [calls, setCalls] = useState<CallListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [callerPhoneSearch, setCallerPhoneSearch] = useState("");
  const [debouncedCallerPhone, setDebouncedCallerPhone] = useState("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [durationMax, setDurationMax] = useState<string>("");
  const [sortBy, setSortBy] = useState<CallParams["sort_by"]>("created_at");
  const [sortOrder, setSortOrder] = useState<CallParams["sort_order"]>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dialog state
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteCallDialogOpen, setIsDeleteCallDialogOpen] = useState(false);
  const [isDeleteTranscriptDialogOpen, setIsDeleteTranscriptDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallDetails | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants({ limit: 100 });
      setRestaurants(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    try {
      setIsLoadingCalls(true);
      setError(null);

      const params: CallParams = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (selectedRestaurantId) params.restaurant_id = selectedRestaurantId;
      if (statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      if (debouncedCallerPhone) params.caller_phone = debouncedCallerPhone;
      if (durationMin) params.duration_min = parseInt(durationMin);
      if (durationMax) params.duration_max = parseInt(durationMax);

      const data = await getCalls(params);
      setCalls(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls");
      setCalls([]);
      setTotal(0);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    selectedRestaurantId,
    statusFilter,
    startDate,
    endDate,
    debouncedCallerPhone,
    durationMin,
    durationMax,
  ]);

  const fetchAnalytics = useCallback(async () => {
    // Analytics requires date range
    if (!startDate || !endDate) {
      // Set default date range to last 30 days if not provided
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const defaultStart = thirtyDaysAgo.toISOString().split("T")[0];
      const defaultEnd = now.toISOString().split("T")[0];

      try {
        setIsLoadingAnalytics(true);
        const data = await getCallAnalytics({
          restaurant_id: selectedRestaurantId || undefined,
          date_from: defaultStart,
          date_to: defaultEnd,
        });
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setAnalytics(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
      return;
    }

    try {
      setIsLoadingAnalytics(true);
      const data = await getCallAnalytics({
        restaurant_id: selectedRestaurantId || undefined,
        date_from: startDate,
        date_to: endDate,
      });
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setAnalytics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [selectedRestaurantId, startDate, endDate]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Debounce caller phone search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedCallerPhone(callerPhoneSearch);
      setPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [callerPhoneSearch]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedRestaurantId, statusFilter, startDate, endDate, durationMin, durationMax]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleClearFilters = () => {
    setSelectedRestaurantId("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCallerPhoneSearch("");
    setDebouncedCallerPhone("");
    setDurationMin("");
    setDurationMax("");
    setPage(1);
    setError(null);
  };

  const handleViewDetails = async (callId: string) => {
    try {
      setIsLoadingDetails(true);
      setIsDetailsDialogOpen(true);
      const details = await getCallDetails(callId);
      setSelectedCall(details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load call details");
      setIsDetailsDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteCall = async () => {
    if (!selectedCallId) return;

    try {
      setIsDeleting(true);
      await deleteCall(selectedCallId);
      toast.success("Call deleted successfully");
      setIsDeleteCallDialogOpen(false);
      setSelectedCallId(null);
      fetchCalls();
      fetchAnalytics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete call");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTranscript = async () => {
    if (!selectedCallId) return;

    try {
      setIsDeleting(true);
      await deleteTranscript(selectedCallId);
      toast.success("Transcript deleted successfully");
      setIsDeleteTranscriptDialogOpen(false);
      setSelectedCallId(null);
      // Refresh call details if dialog is open
      if (selectedCall && selectedCall.call_id === selectedCallId) {
        const details = await getCallDetails(selectedCallId);
        setSelectedCall(details);
      }
      fetchCalls();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete transcript");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteCallDialog = (callId: string) => {
    setSelectedCallId(callId);
    setIsDeleteCallDialogOpen(true);
  };

  const openDeleteTranscriptDialog = (callId: string) => {
    setSelectedCallId(callId);
    setIsDeleteTranscriptDialogOpen(true);
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters =
    selectedRestaurantId ||
    statusFilter !== "all" ||
    startDate ||
    endDate ||
    callerPhoneSearch ||
    durationMin ||
    durationMax;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Calls"
          description="View call history, transcripts, and analytics"
        />
        <main className="flex-1 p-6 space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Calls
                </CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{analytics?.total_calls ?? 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Duration
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatDuration(analytics?.average_call_duration ?? 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">
                    {((analytics?.conversion_rates?.rate ?? 0) * 100).toFixed(1)}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.conversion_rates?.orders ?? 0} orders,{" "}
                  {analytics?.conversion_rates?.reservations ?? 0} reservations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Status Breakdown
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analytics?.status_breakdown &&
                      Object.entries(analytics.status_breakdown).map(([status, count]) => (
                        <Badge key={status} variant={getStatusColor(status)} className="text-xs">
                          {status}: {count}
                        </Badge>
                      ))}
                    {(!analytics?.status_breakdown ||
                      Object.keys(analytics.status_breakdown).length === 0) && (
                      <span className="text-sm text-muted-foreground">No data</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Call Distribution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
                <CardDescription>Calls by time of day</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : analytics?.time_of_day_distribution &&
                  analytics.time_of_day_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.time_of_day_distribution
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.hour_bucket} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-20">
                            {item.hour_bucket.toString().padStart(2, "0")}:00
                          </span>
                          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${
                                  (item.count /
                                    Math.max(
                                      ...analytics.time_of_day_distribution.map((d) => d.count)
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">
                            {item.count}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Busiest Days</CardTitle>
                <CardDescription>Calls by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : analytics?.calls_by_day_of_week && analytics.calls_by_day_of_week.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.calls_by_day_of_week
                      .sort((a, b) => b.count - a.count)
                      .map((item) => (
                        <div key={item.day_of_week} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-24">
                            {getDayName(item.day_of_week)}
                          </span>
                          <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${
                                  (item.count /
                                    Math.max(
                                      ...analytics.calls_by_day_of_week.map((d) => d.count)
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">
                            {item.count}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Call History Table */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  <CardTitle>Call History</CardTitle>
                  {total > 0 && <Badge variant="secondary">{total} total</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Restaurant selector */}
                  {isAdmin && (
                    <Select
                      value={selectedRestaurantId}
                      onValueChange={(value) =>
                        setSelectedRestaurantId(value === "all" ? "" : value)
                      }
                      disabled={isLoadingRestaurants}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Restaurants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Restaurants</SelectItem>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      fetchCalls();
                      fetchAnalytics();
                    }}
                    disabled={isLoadingCalls}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingCalls ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {/* Search and Filter Row */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by caller phone..."
                    className="pl-9"
                    value={callerPhoneSearch}
                    onChange={(e) => setCallerPhoneSearch(e.target.value)}
                  />
                  {callerPhoneSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setCallerPhoneSearch("")}
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as CallParams["sort_by"])}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="started_at">Started</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Order */}
                  <Select
                    value={sortOrder}
                    onValueChange={(v) => setSortOrder(v as CallParams["sort_order"])}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest</SelectItem>
                      <SelectItem value="asc">Oldest</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* More Filters Toggle */}
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Clear all filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min Duration (sec)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max Duration (sec)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={durationMax}
                      onChange={(e) => setDurationMax(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {error && (
                <div className="flex items-center gap-3 p-4 mb-4 text-sm bg-destructive/10 border border-destructive/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => setError(null)}
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isLoadingCalls ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Restaurant</TableHead>
                            <TableHead className="font-semibold">Caller</TableHead>
                            <TableHead className="font-semibold text-center">Duration</TableHead>
                            <TableHead className="font-semibold text-center">Status</TableHead>
                            <TableHead className="font-semibold hidden md:table-cell">
                              Started At
                            </TableHead>
                            <TableHead className="font-semibold text-center hidden sm:table-cell">
                              Transcript
                            </TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calls.map((call) => {
                            const { date, time } = formatDateTime(call.started_at);
                            return (
                              <TableRow
                                key={call.call_id}
                                className="group hover:bg-muted/30 transition-colors"
                              >
                                <TableCell className="font-mono text-sm">{call.call_id}</TableCell>
                                <TableCell>
                                  <div className="max-w-[200px]">
                                    <p className="font-medium truncate">{call.restaurant_name}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-mono text-sm">{call.caller_phone}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span>{formatDuration(call.duration_seconds)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={getStatusColor(call.status)}
                                    className="capitalize"
                                  >
                                    {call.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm">{date}</span>
                                    <span className="text-xs text-muted-foreground">{time}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center hidden sm:table-cell">
                                  {call.has_transcript ? (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Yes
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950"
                                          onClick={() => handleViewDetails(call.call_id)}
                                        >
                                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>View Details</TooltipContent>
                                    </Tooltip>

                                    {call.has_transcript && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-orange-50 dark:hover:bg-orange-950"
                                            onClick={() => openDeleteTranscriptDialog(call.call_id)}
                                          >
                                            <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete Transcript</TooltipContent>
                                      </Tooltip>
                                    )}

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 hover:bg-destructive/10"
                                          onClick={() => openDeleteCallDialog(call.call_id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete Call</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Showing {calls.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
                        {Math.min(page * limit, total)} of {total} calls
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1 || isLoadingCalls}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={page >= totalPages || isLoadingCalls}
                          aria-label="Next page"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isLoadingCalls && !error && calls.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Phone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold mb-2">No calls found</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "Voice call records will appear here once customers start calling."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Call Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Details
            </DialogTitle>
            <DialogDescription>
              {selectedCall ? `Call #${selectedCall.call_id}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedCall ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Call Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Restaurant</Label>
                  <p className="font-medium">{selectedCall.restaurant_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Caller Phone</Label>
                  <p className="font-medium font-mono">{selectedCall.caller_phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Direction</Label>
                  <div className="flex items-center gap-1">
                    {selectedCall.call_direction === "inbound" ? (
                      <PhoneIncoming className="h-4 w-4 text-green-600" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="capitalize">{selectedCall.call_direction}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-0.5">
                    <Badge variant={getStatusColor(selectedCall.status)} className="capitalize">
                      {selectedCall.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Duration</Label>
                  <p className="font-medium">{formatDuration(selectedCall.duration_seconds)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Started At</Label>
                  <p className="font-medium text-sm">
                    {formatDateTime(selectedCall.started_at).date}{" "}
                    {formatDateTime(selectedCall.started_at).time}
                  </p>
                </div>
              </div>

              {/* Costs */}
              {(selectedCall.twilio_cost ||
                selectedCall.deepgram_cost ||
                selectedCall.ressy_cost) && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Call Costs</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Twilio:</span>
                      <span className="ml-2 font-mono">{formatCost(selectedCall.twilio_cost)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deepgram:</span>
                      <span className="ml-2 font-mono">
                        {formatCost(selectedCall.deepgram_cost)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ressy:</span>
                      <span className="ml-2 font-mono">{formatCost(selectedCall.ressy_cost)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 font-mono font-medium">
                      {formatCost(
                        (selectedCall.twilio_cost || 0) +
                          (selectedCall.deepgram_cost || 0) +
                          (selectedCall.ressy_cost || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Linked Resources */}
              {(selectedCall.order_id || selectedCall.reservation_id) && (
                <div className="flex flex-wrap gap-3">
                  {selectedCall.order_id && (
                    <Badge variant="outline" className="text-sm">
                      Order: #{selectedCall.order_id}
                    </Badge>
                  )}
                  {selectedCall.reservation_id && (
                    <Badge variant="outline" className="text-sm">
                      Reservation: #{selectedCall.reservation_id}
                    </Badge>
                  )}
                </div>
              )}

              {/* Summary */}
              {selectedCall.summary && (
                <div>
                  <Label className="text-muted-foreground text-xs">Summary</Label>
                  <p className="text-sm mt-1">{selectedCall.summary}</p>
                </div>
              )}

              {/* Transcript */}
              {selectedCall.has_transcript && selectedCall.transcript && (
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Transcript</Label>
                      <Badge variant="secondary" className="text-xs">
                        {selectedCall.transcript.length} messages
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        openDeleteTranscriptDialog(selectedCall.call_id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px] p-4">
                    <div className="space-y-4">
                      {selectedCall.transcript.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${
                            entry.role === "assistant" ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              entry.role === "assistant"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {entry.role === "assistant" ? (
                              <Bot className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`flex-1 max-w-[80%] ${
                              entry.role === "assistant" ? "" : "text-right"
                            }`}
                          >
                            <div
                              className={`inline-block rounded-lg px-4 py-2 text-sm ${
                                entry.role === "assistant"
                                  ? "bg-muted text-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{entry.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {selectedCall.has_transcript && !selectedCall.transcript && (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Transcript data not available</p>
                </div>
              )}

              {!selectedCall.has_transcript && (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transcript for this call</p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedCall && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openDeleteCallDialog(selectedCall.call_id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Call
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Call Dialog */}
      <AlertDialog open={isDeleteCallDialogOpen} onOpenChange={setIsDeleteCallDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call record? This will also delete the transcript
              if one exists. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Call"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Transcript Dialog */}
      <AlertDialog
        open={isDeleteTranscriptDialogOpen}
        onOpenChange={setIsDeleteTranscriptDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transcript</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the transcript for this call? The call record will be
              preserved, but the transcript data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTranscript}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Transcript"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calls;
