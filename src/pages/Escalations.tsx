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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  Clock,
  Building2,
  ChevronRight,
  Trash2,
  Filter,
  X,
  AlertCircle,
  Bug,
  ShieldAlert,
  Info,
  RefreshCw,
} from "lucide-react";
import { useSSE } from "@/contexts/SSEContext";
import { getAdminEscalations } from "@/lib/api/escalations";
import { formatLocalDateTimeParts } from "@/lib/utils/timezone";
import {
  escalationStatusColors as statusColors,
  escalationUrgencyColors as urgencyColors,
} from "@/lib/utils/escalationStyles";
import { formatRelativeTime, formatRelativeTimeLong } from "@/lib/utils/formatRelativeTime";
import type { SSEEvent, SSEEventSubtype } from "@/types/api.types";
import type {
  Escalation,
  EscalationStatus,
  EscalationUrgency,
  EscalationQueryParams,
} from "@/types/escalation.types";

// ============================================================================
// Types
// ============================================================================

type EscalationFilter = "all" | SSEEventSubtype;

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (timestamp: string) => {
  return formatLocalDateTimeParts(timestamp);
};

const getEscalationInfo = (subtype: SSEEventSubtype) => {
  const info: Record<
    string,
    { title: string; description: string; icon: React.ReactNode; color: string }
  > = {
    user_requested: {
      title: "Human Assistance Requested",
      description: "Customer asked to speak with a human representative",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-amber-500",
    },
    internal_server_error: {
      title: "System Error",
      description: "An internal error occurred during the call",
      icon: <Bug className="h-5 w-5" />,
      color: "bg-red-500",
    },
    suspected_spam: {
      title: "Spam Detected",
      description: "Call was flagged as potential spam or abuse",
      icon: <ShieldAlert className="h-5 w-5" />,
      color: "bg-orange-500",
    },
  };
  return (
    info[subtype] || {
      title: subtype,
      description: "Unknown escalation type",
      icon: <AlertCircle className="h-5 w-5" />,
      color: "bg-gray-500",
    }
  );
};

// ============================================================================
// Component
// ============================================================================

const Escalations = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<EscalationFilter>("all");
  const { escalations, dismissEvent, clearEvents } = useSSE();

  // History tab state (database escalations)
  const [historyEscalations, setHistoryEscalations] = useState<Escalation[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilters, setHistoryFilters] = useState<EscalationQueryParams>({
    page: 1,
    limit: 20,
    sort_by: "requested_at",
    sort_order: "desc",
  });

  const fetchHistoryEscalations = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await getAdminEscalations({ ...historyFilters, page: historyPage });
      setHistoryEscalations(response.escalations);
      setHistoryTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch escalations:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilters, historyPage]);

  useEffect(() => {
    fetchHistoryEscalations();
  }, [fetchHistoryEscalations]);

  const historyList = historyEscalations ?? [];
  const historyTotalPages = Math.ceil(historyTotal / (historyFilters.limit || 20));
  const historyStats = {
    raised: historyList.filter((e) => e.status === "raised").length,
    forwarded: historyList.filter((e) => e.status === "forwarded").length,
    failed: historyList.filter((e) => e.status === "failed").length,
    resolved: historyList.filter((e) => e.status === "resolved").length,
  };

  // Filter escalations (live)
  const filteredEscalations =
    filter === "all" ? escalations : escalations.filter((e) => e.subtype === filter);

  // Get counts by type (live)
  const counts = {
    all: escalations.length,
    user_requested: escalations.filter((e) => e.subtype === "user_requested").length,
    internal_server_error: escalations.filter((e) => e.subtype === "internal_server_error").length,
    suspected_spam: escalations.filter((e) => e.subtype === "suspected_spam").length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Escalations"
          description="Critical alerts requiring attention"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="live">
                Live Alerts
                {escalations.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {escalations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">
                History
                <Badge variant="secondary" className="ml-2 text-xs">
                  {historyTotal}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-0">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      <CardTitle>Escalation Alerts</CardTitle>
                      {escalations.length > 0 && (
                        <Badge variant="destructive" className="hidden sm:inline-flex">
                          {escalations.length} active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                      <Select
                        value={filter}
                        onValueChange={(v) => setFilter(v as EscalationFilter)}
                      >
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Escalations ({counts.all})</SelectItem>
                          <SelectItem value="user_requested">
                            Human Requested ({counts.user_requested})
                          </SelectItem>
                          <SelectItem value="internal_server_error">
                            System Errors ({counts.internal_server_error})
                          </SelectItem>
                          <SelectItem value="suspected_spam">
                            Spam Detected ({counts.suspected_spam})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {escalations.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={clearEvents}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                  {escalations.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Total Alerts</p>
                        <p className="text-xl sm:text-2xl font-bold text-destructive">
                          {counts.all}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Human Requested</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-600">
                          {counts.user_requested}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                        <p className="text-xs text-muted-foreground mb-1">System Errors</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          {counts.internal_server_error}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Spam Detected</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                          {counts.suspected_spam}
                        </p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {filteredEscalations.length > 0 ? (
                    <div className="space-y-3">
                      {filteredEscalations.map((escalation) => (
                        <EscalationCard
                          key={escalation.id}
                          escalation={escalation}
                          onDismiss={() => dismissEvent(escalation.id)}
                          onViewCall={(callId) => navigate(`/calls?call_id=${callId}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold mb-2">
                        {filter === "all" ? "No live escalations" : "No matching escalations"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        {filter === "all"
                          ? "Live alerts will appear here in real-time. Switch to the History tab to see past escalations."
                          : "Try changing the filter to see other escalation types."}
                      </p>
                      {filter !== "all" && (
                        <Button variant="outline" onClick={() => setFilter("all")}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      <CardTitle>All Escalations</CardTitle>
                      <Badge variant="secondary">{historyTotal} total</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchHistoryEscalations}
                      disabled={historyLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${historyLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>
                  {historyTotal > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Raised</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                          {historyStats.raised}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Forwarded</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {historyStats.forwarded}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Failed</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">
                          {historyStats.failed}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {historyStats.resolved}
                        </p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={historyFilters.status || "all"}
                        onValueChange={(v) => {
                          setHistoryFilters((prev) => ({
                            ...prev,
                            status: v === "all" ? undefined : (v as EscalationStatus),
                          }));
                          setHistoryPage(1);
                        }}
                      >
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
                    <Select
                      value={historyFilters.urgency || "all"}
                      onValueChange={(v) => {
                        setHistoryFilters((prev) => ({
                          ...prev,
                          urgency: v === "all" ? undefined : (v as EscalationUrgency),
                        }));
                        setHistoryPage(1);
                      }}
                    >
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
                        {historyLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                              <p className="text-muted-foreground">Loading...</p>
                            </TableCell>
                          </TableRow>
                        ) : historyList.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No escalations found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          historyList.map((escalation) => (
                            <TableRow
                              key={escalation.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/escalations/${escalation.id}`)}
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
                  {historyTotalPages > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1 || historyLoading}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm">
                        Page {historyPage} of {historyTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                        disabled={historyPage === historyTotalPages || historyLoading}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// Escalation Card Component
// ============================================================================

interface EscalationCardProps {
  escalation: SSEEvent;
  onDismiss: () => void;
  onViewCall?: (callId: string) => void;
}

const EscalationCard = ({ escalation, onDismiss, onViewCall }: EscalationCardProps) => {
  const info = getEscalationInfo(escalation.subtype);
  const { date, time } = formatDateTime(escalation.timestamp);
  const relativeTime = formatRelativeTimeLong(escalation.timestamp);

  // Extract all data from event
  const restaurantName =
    (escalation.data?.restaurant_name as string) || `Restaurant #${escalation.restaurant_id}`;
  const callerPhone = escalation.data?.caller_phone as string;
  const callId = escalation.data?.call_id as string;
  const reason = escalation.data?.reason as string;
  const urgency = escalation.data?.urgency as string;
  const errorMessage = escalation.data?.error_message as string;
  const errorCode = escalation.data?.error_code as string;
  const spamScore = escalation.data?.spam_score as number;
  const indicators = escalation.data?.indicators as string[];

  // Get urgency badge color
  const getUrgencyColor = (urgency?: string) => {
    if (!urgency) return "bg-gray-500";
    const u = urgency.toLowerCase();
    if (u === "urgent" || u === "critical") return "bg-red-600";
    if (u === "high") return "bg-orange-500";
    if (u === "medium") return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={`p-2 sm:p-2.5 rounded-full ${info.color} text-white flex-shrink-0`}>
          {info.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base">{info.title}</h3>
                {urgency && (
                  <Badge className={`${getUrgencyColor(urgency)} text-white text-xs px-2 py-0.5`}>
                    {urgency.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{info.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 opacity-50 group-hover:opacity-100"
              onClick={onDismiss}
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Reason - Prominently displayed */}
          {reason && (
            <div className="mt-3 p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Reason
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{restaurantName}</span>
            </div>
            {callerPhone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{callerPhone}</span>
              </div>
            )}
            {callId && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="truncate font-mono text-xs">Call: {callId}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="hidden sm:inline">
                {date} at {time}
              </span>
              <span className="sm:hidden">{relativeTime}</span>
            </div>
          </div>

          {/* Error Details (if available) */}
          {(errorMessage || errorCode) && (
            <div className="mt-3 p-2.5 sm:p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start gap-2">
                <Bug className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  {errorCode && (
                    <p className="text-xs font-mono text-red-700 dark:text-red-300">
                      Code: {errorCode}
                    </p>
                  )}
                  {errorMessage && (
                    <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">
                      {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spam Details (if available) */}
          {(spamScore !== undefined || (indicators && indicators.length > 0)) && (
            <div className="mt-3 p-2.5 sm:p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  {spamScore !== undefined && (
                    <div>
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-0.5">
                        Spam Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-orange-200 dark:bg-orange-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-600 dark:bg-orange-500 rounded-full"
                            style={{ width: `${Math.min(spamScore * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                          {Math.min(spamScore * 100, 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {indicators && indicators.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">
                        Indicators
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {indicators.map((indicator, idx) => {
                          // Convert snake_case to Title Case
                          const formattedIndicator = indicator
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase());
                          return (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                            >
                              {formattedIndicator}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <Badge
              variant={
                escalation.subtype === "user_requested"
                  ? "default"
                  : escalation.subtype === "internal_server_error"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {escalation.subtype.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">{relativeTime}</span>
            {callId && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-xs h-7 sm:h-8"
                onClick={() => onViewCall?.(callId)}
              >
                <span className="sm:hidden">View Call</span>
                <span className="hidden sm:inline">View Call Details</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Escalations;
