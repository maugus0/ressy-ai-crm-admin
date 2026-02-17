/**
 * Escalation Detail Page
 * Shows full escalation details with status update capability
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  Phone,
  Clock,
  Building2,
  RefreshCw,
  ExternalLink,
  PhoneForwarded,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getAdminEscalation, updateAdminEscalationStatus } from "@/lib/api/escalations";
import { formatLocalDateTimeParts } from "@/lib/utils/timezone";
import type { Escalation, EscalationStatus, EscalationUrgency } from "@/types/escalation.types";

// ============================================================================
// Constants
// ============================================================================

const statusColors: Record<EscalationStatus, string> = {
  raised: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  forwarded: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

const urgencyColors: Record<EscalationUrgency, string> = {
  standard: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const statusIcons: Record<EscalationStatus, React.ReactNode> = {
  raised: <AlertCircle className="h-5 w-5 text-yellow-600" />,
  forwarded: <PhoneForwarded className="h-5 w-5 text-blue-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
  resolved: <CheckCircle2 className="h-5 w-5 text-green-600" />,
};

// ============================================================================
// Component
// ============================================================================

const EscalationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escalationId = id ? parseInt(id, 10) : null;
  const isValidId = escalationId != null && !Number.isNaN(escalationId) && escalationId > 0;

  // Redirect to list if id is invalid (e.g. "history" or empty)
  useEffect(() => {
    if (id !== undefined && !isValidId) {
      navigate("/escalations", { replace: true });
    }
  }, [id, isValidId, navigate]);

  const fetchEscalation = useCallback(async () => {
    if (!isValidId || !escalationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminEscalation(escalationId);
      setEscalation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch escalation");
      console.error("Failed to fetch escalation:", err);
    } finally {
      setIsLoading(false);
    }
  }, [escalationId, isValidId]);

  useEffect(() => {
    fetchEscalation();
  }, [fetchEscalation]);

  const handleStatusChange = async (status: EscalationStatus) => {
    if (!escalation) return;

    setIsUpdating(true);
    try {
      const updated = await updateAdminEscalationStatus(escalation.id, status);
      setEscalation(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewCall = () => {
    if (escalation?.call_id) {
      navigate(`/calls?call_id=${escalation.call_id}`);
    }
  };

  // Format dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const { date, time } = formatLocalDateTimeParts(dateStr);
    return `${date} at ${time}`;
  };

  // Invalid id: redirecting (don't flash "not found")
  if (id !== undefined && !isValidId) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col w-full lg:w-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} title="Escalation Details" />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Error state (e.g. 404 - notification may have linked to a call_id instead of escalation id)
  if (error || !escalation) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col w-full lg:w-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} title="Escalation Details" />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 px-6">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-2">
                  {error || "Escalation not found"}
                </p>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                  The link may refer to a call rather than an escalation. Try viewing all
                  escalations or open the call from the Calls page.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button variant="default" onClick={() => navigate("/escalations")}>
                    View All Escalations
                  </Button>
                  <Button variant="secondary" onClick={() => navigate("/calls")}>
                    <Phone className="h-4 w-4 mr-2" />
                    View Calls
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title={`Escalation #${escalation.id}`}
          description="View and manage escalation details"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Escalations
          </Button>

          {/* Main Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {statusIcons[escalation.status]}
                    Escalation #{escalation.id}
                  </CardTitle>
                  <CardDescription>Created {formatDate(escalation.created_at)}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[escalation.status]}>{escalation.status}</Badge>
                  <Badge className={urgencyColors[escalation.urgency]}>{escalation.urgency}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Update */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Update Status:</span>
                <Select
                  value={escalation.status}
                  onValueChange={(value) => handleStatusChange(value as EscalationStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raised">Raised</SelectItem>
                    <SelectItem value="forwarded">Forwarded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdating && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Caller Phone
                    </div>
                    <p className="font-medium text-lg">{escalation.caller_phone || "Unknown"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Restaurant
                    </div>
                    <p className="font-medium">
                      {escalation.restaurant_name || `Restaurant #${escalation.restaurant_id}`}
                    </p>
                  </div>

                  {escalation.escalation_phone_number && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PhoneForwarded className="h-4 w-4" />
                        Escalation Phone
                      </div>
                      <p className="font-medium">{escalation.escalation_phone_number}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Requested At
                    </div>
                    <p className="font-medium">{formatDate(escalation.requested_at)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Urgency
                    </div>
                    <Badge className={`${urgencyColors[escalation.urgency]} capitalize`}>
                      {escalation.urgency}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      Forwarded
                    </div>
                    <p className="font-medium">{escalation.forwarded ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reason */}
              <div className="space-y-2">
                <h4 className="font-medium">Escalation Reason</h4>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    {escalation.reason || "No reason provided"}
                  </p>
                </div>
              </div>

              {/* Call Information */}
              {(escalation.twilio_call_sid ?? escalation.call_sid ?? escalation.call_id) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Call Information</h4>
                    <div className="grid gap-3 text-sm">
                      {(escalation.twilio_call_sid ?? escalation.call_sid) && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Twilio Call SID:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                            {escalation.twilio_call_sid ?? escalation.call_sid}
                          </code>
                        </div>
                      )}
                      {escalation.call_id && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg">
                          <span className="text-muted-foreground">Call ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{escalation.call_id}</span>
                            <Button variant="outline" size="sm" onClick={handleViewCall}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Call
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Timestamps */}
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(escalation.created_at)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{" "}
                  {formatDate(escalation.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EscalationDetail;
