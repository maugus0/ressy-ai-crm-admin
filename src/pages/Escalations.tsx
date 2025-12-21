import { useState } from "react";
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
} from "lucide-react";
import { useSSE } from "@/contexts/SSEContext";
import type { SSEEvent, SSEEventSubtype } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

type EscalationFilter = "all" | SSEEventSubtype;

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Vancouver",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Vancouver",
    }),
  };
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
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

  // Filter escalations
  const filteredEscalations =
    filter === "all" ? escalations : escalations.filter((e) => e.subtype === filter);

  // Get counts by type
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
        <main className="flex-1 p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4">
              {/* Header Row */}
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
                  {/* Filter */}
                  <Select value={filter} onValueChange={(v) => setFilter(v as EscalationFilter)}>
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

                  {/* Clear All */}
                  {escalations.length > 0 && (
                    <Button variant="outline" onClick={clearEvents} className="w-full sm:w-auto">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              {escalations.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total Alerts</p>
                    <p className="text-2xl font-bold text-destructive">{counts.all}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-xs text-muted-foreground">Human Requested</p>
                    <p className="text-2xl font-bold text-amber-600">{counts.user_requested}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                    <p className="text-xs text-muted-foreground">System Errors</p>
                    <p className="text-2xl font-bold text-red-600">
                      {counts.internal_server_error}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-xs text-muted-foreground">Spam Detected</p>
                    <p className="text-2xl font-bold text-orange-600">{counts.suspected_spam}</p>
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
                    {filter === "all" ? "No escalations" : "No matching escalations"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {filter === "all"
                      ? "Escalation alerts will appear here in real-time when they occur."
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
  const relativeTime = formatRelativeTime(escalation.timestamp);

  // Extract data from event
  const restaurantName =
    (escalation.data?.restaurant_name as string) || `Restaurant #${escalation.restaurant_id}`;
  const callerPhone = escalation.data?.caller_phone as string;
  const callId = escalation.data?.call_id as string;
  const summary = escalation.data?.summary as string;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-2.5 rounded-full ${info.color} text-white flex-shrink-0`}>
          {info.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base">{info.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{info.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 opacity-50 group-hover:opacity-100"
              onClick={onDismiss}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{restaurantName}</span>
            </div>
            {callerPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{callerPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="hidden sm:inline">
                {date} at {time}
              </span>
              <span className="sm:hidden">{relativeTime}</span>
            </div>
            {callId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate font-mono text-xs">Call: {callId.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {summary && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Badge
              variant={
                escalation.subtype === "user_requested"
                  ? "default"
                  : escalation.subtype === "internal_server_error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {escalation.subtype.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-muted-foreground">{relativeTime}</span>
            {callId && (
              <Button
                variant="link"
                size="sm"
                className="ml-auto text-xs h-auto p-0"
                onClick={() => onViewCall?.(callId)}
              >
                View Call Details
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
