import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Info,
  Loader2,
  Phone,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRestaurants,
  RestaurantKillSwitchError,
  updateAllRestaurantsKillSwitch,
  updateRestaurantKillSwitch,
} from "@/services/restaurants";
import { useSSE } from "@/contexts/SSEContext";
import type { Restaurant } from "@/types/api.types";

const KILL_SWITCH_BLOCKER_MESSAGES: Record<string, string> = {
  forward_escalations_disabled: "Escalation forwarding is currently disabled.",
  escalation_phone_number_missing: "Escalation phone number is not configured.",
};

const getBlockerLabel = (blocker: string) => {
  return KILL_SWITCH_BLOCKER_MESSAGES[blocker] ?? blocker.replace(/_/g, " ");
};

const KillSwitch = () => {
  const { events } = useSSE();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [bulkTarget, setBulkTarget] = useState<boolean | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [pendingRestaurant, setPendingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantTarget, setRestaurantTarget] = useState<boolean | null>(null);
  const [updatingRestaurantId, setUpdatingRestaurantId] = useState<number | null>(null);
  const [enableConfirmText, setEnableConfirmText] = useState("");
  const lastToggleEventIdRef = useRef<string | null>(null);
  const lastBulkEventIdRef = useRef<string | null>(null);

  const fetchRestaurants = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      setError(null);
      const allItems: Restaurant[] = [];
      let page = 1;
      let pages = 1;

      while (page <= pages) {
        const response = await getRestaurants({ page, limit: 100 });
        allItems.push(...response.items);
        pages = response.pagination.pages || 1;
        page += 1;
      }

      setRestaurants(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const latestToggleEvent = events.find(
      (event) => event.event_type === "system" && event.subtype === "kill_switch_toggled"
    );

    if (!latestToggleEvent || latestToggleEvent.id === lastToggleEventIdRef.current) return;
    lastToggleEventIdRef.current = latestToggleEvent.id;

    const restaurantId = Number(latestToggleEvent.data?.restaurant_id);
    const enabled = Boolean(latestToggleEvent.data?.enabled);

    if (Number.isNaN(restaurantId)) return;

    setRestaurants((prev) =>
      prev.map((restaurant) =>
        restaurant.id === restaurantId
          ? { ...restaurant, kill_switch_enabled: enabled }
          : restaurant
      )
    );
  }, [events]);

  useEffect(() => {
    const latestBulkEvent = events.find(
      (event) => event.event_type === "system" && event.subtype === "kill_switch_bulk_updated"
    );
    if (!latestBulkEvent || latestBulkEvent.id === lastBulkEventIdRef.current) return;
    lastBulkEventIdRef.current = latestBulkEvent.id;
    void fetchRestaurants(true);
  }, [events, fetchRestaurants]);

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return restaurants;

    return restaurants.filter((restaurant) => {
      return (
        restaurant.name.toLowerCase().includes(normalizedSearch) ||
        String(restaurant.id).includes(normalizedSearch)
      );
    });
  }, [restaurants, search]);

  const stats = useMemo(() => {
    const total = restaurants.length;
    const enabled = restaurants.filter((restaurant) => restaurant.kill_switch_enabled).length;
    const ready = restaurants.filter((restaurant) => restaurant.kill_switch_can_redirect).length;
    const blocked = restaurants.filter((restaurant) => !restaurant.kill_switch_can_redirect).length;

    return { total, enabled, disabled: total - enabled, ready, blocked };
  }, [restaurants]);

  const openRestaurantConfirmation = (restaurant: Restaurant, enabled: boolean) => {
    setPendingRestaurant(restaurant);
    setRestaurantTarget(enabled);
    setEnableConfirmText("");
  };

  const handleRestaurantToggle = async () => {
    if (!pendingRestaurant || restaurantTarget === null) return;

    try {
      setUpdatingRestaurantId(pendingRestaurant.id);
      const updated = await updateRestaurantKillSwitch(pendingRestaurant.id, {
        enabled: restaurantTarget,
      });
      setRestaurants((prev) =>
        prev.map((restaurant) => (restaurant.id === updated.id ? updated : restaurant))
      );
      toast.success(
        restaurantTarget
          ? `Kill switch enabled for ${pendingRestaurant.name}`
          : `Kill switch disabled for ${pendingRestaurant.name}`
      );
    } catch (err) {
      if (err instanceof RestaurantKillSwitchError) {
        const blockerMessage =
          err.killSwitchBlockers.length > 0
            ? ` ${err.killSwitchBlockers.map(getBlockerLabel).join(" ")}`
            : "";
        toast.error(`${err.message}${blockerMessage}`.trim());
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update kill switch");
      }
    } finally {
      setUpdatingRestaurantId(null);
      setPendingRestaurant(null);
      setRestaurantTarget(null);
      setEnableConfirmText("");
    }
  };

  const handleBulkToggle = async () => {
    if (bulkTarget === null) return;

    try {
      setIsBulkUpdating(true);
      const response = await updateAllRestaurantsKillSwitch({ enabled: bulkTarget });
      await fetchRestaurants(true);

      if (response.skipped_count > 0) {
        toast.warning(
          `Updated ${response.updated_count} restaurants. Skipped ${response.skipped_count} due to forwarding blockers.`
        );
      } else {
        toast.success(
          bulkTarget
            ? `Kill switch enabled for ${response.updated_count} restaurants`
            : `Kill switch disabled for ${response.updated_count} restaurants`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk kill switch update failed");
    } finally {
      setIsBulkUpdating(false);
      setBulkTarget(null);
      setEnableConfirmText("");
    }
  };

  const anyEnabled = stats.enabled > 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Kill Switch"
          description="Emergency call routing override"
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4">
          {/* Status Banner */}
          {anyEnabled && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
              </span>
              <p className="text-sm font-medium text-primary">
                Kill switch is active on {stats.enabled} restaurant{stats.enabled !== 1 ? "s" : ""}{" "}
                — calls are being routed to staff
              </p>
            </div>
          )}

          {/* Control Panel */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    Global Controls
                  </CardTitle>
                  <CardDescription>
                    Override AI call handling and route inbound calls directly to restaurant staff.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchRestaurants(true)}
                  disabled={
                    isLoading || isRefreshing || isBulkUpdating || updatingRestaurantId !== null
                  }
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                <TooltipProvider delayDuration={300}>
                  {(
                    [
                      {
                        label: "Total",
                        value: stats.total,
                        color: "text-foreground",
                        tip: "Total restaurants in the system",
                      },
                      {
                        label: "Active",
                        value: stats.enabled,
                        color: "text-primary",
                        tip: "Kill switch is ON — calls routed to staff",
                      },
                      {
                        label: "Inactive",
                        value: stats.disabled,
                        color: "text-foreground",
                        tip: "Kill switch is OFF — AI handling calls",
                      },
                      {
                        label: "Ready",
                        value: stats.ready,
                        color: "text-emerald-600 dark:text-emerald-400",
                        tip: "Forwarding configured and can be enabled",
                      },
                      {
                        label: "Blocked",
                        value: stats.blocked,
                        color: "text-amber-600 dark:text-amber-400",
                        tip: "Missing forwarding config — cannot enable",
                      },
                    ] as const
                  ).map((stat) => (
                    <Tooltip key={stat.label}>
                      <TooltipTrigger asChild>
                        <div className="rounded-lg border bg-background p-3 sm:p-4 text-center sm:text-left cursor-default transition-colors hover:bg-muted/40">
                          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium">
                            {stat.label}
                          </p>
                          <p className={`text-xl sm:text-2xl font-bold tabular-nums ${stat.color}`}>
                            {stat.value}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{stat.tip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="default"
                  className="w-full sm:w-auto"
                  onClick={() => setBulkTarget(true)}
                  disabled={
                    isLoading ||
                    isRefreshing ||
                    isBulkUpdating ||
                    updatingRestaurantId !== null ||
                    stats.total === 0
                  }
                >
                  {isBulkUpdating && bulkTarget === true ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setBulkTarget(false)}
                  disabled={
                    isLoading ||
                    isRefreshing ||
                    isBulkUpdating ||
                    updatingRestaurantId !== null ||
                    stats.total === 0
                  }
                >
                  {isBulkUpdating && bulkTarget === false ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldOff className="h-4 w-4 mr-2" />
                  )}
                  Disable All
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Restaurant List */}
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">Per-Restaurant Controls</CardTitle>
                  <CardDescription>
                    Toggle kill switch individually with readiness checks.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="tabular-nums">
                  {filteredRestaurants.length} restaurant
                  {filteredRestaurants.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className={`pl-9 ${search ? "pr-9" : ""}`}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Could not load restaurants</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                  <p className="text-sm">Loading restaurants...</p>
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-muted/60 mb-4">
                    <ShieldAlert className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium">
                    {search ? "No restaurants match your search" : "No restaurants found"}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block border rounded-lg overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="font-semibold">Restaurant</TableHead>
                          <TableHead className="font-semibold">Escalation Phone</TableHead>
                          <TableHead className="font-semibold">Forwarding</TableHead>
                          <TableHead className="font-semibold">Readiness</TableHead>
                          <TableHead className="font-semibold">Blockers</TableHead>
                          <TableHead className="font-semibold text-right">Override</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRestaurants.map((restaurant) => {
                          const isUpdating = updatingRestaurantId === restaurant.id;
                          const canEnable = restaurant.kill_switch_can_redirect;
                          const isEnabled = restaurant.kill_switch_enabled;

                          return (
                            <TableRow
                              key={restaurant.id}
                              className={isEnabled ? "bg-primary/[0.03]" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  {isEnabled && (
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                    </span>
                                  )}
                                  <div>
                                    <p className="font-medium">{restaurant.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      #{restaurant.id}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs font-mono">
                                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                  {restaurant.escalation_phone_number || (
                                    <span className="text-muted-foreground italic">
                                      Not configured
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={restaurant.forward_escalations ? "default" : "secondary"}
                                  className="text-[11px]"
                                >
                                  {restaurant.forward_escalations ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {restaurant.kill_switch_can_redirect ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                                  >
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Ready
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Blocked
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {restaurant.kill_switch_blockers.length > 0 ? (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 cursor-default">
                                          <Info className="h-3 w-3 shrink-0" />
                                          <span>
                                            {restaurant.kill_switch_blockers.length} issue
                                            {restaurant.kill_switch_blockers.length !== 1
                                              ? "s"
                                              : ""}
                                          </span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="bottom"
                                        align="start"
                                        className="max-w-xs"
                                      >
                                        <div className="space-y-1">
                                          {restaurant.kill_switch_blockers.map((blocker) => (
                                            <p key={blocker} className="text-xs">
                                              {getBlockerLabel(blocker)}
                                            </p>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  {isUpdating && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                  )}
                                  <span
                                    className={`text-xs font-medium ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                                  >
                                    {isEnabled ? "ON" : "OFF"}
                                  </span>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) =>
                                      openRestaurantConfirmation(restaurant, checked)
                                    }
                                    disabled={
                                      isUpdating ||
                                      isRefreshing ||
                                      isLoading ||
                                      isBulkUpdating ||
                                      (!isEnabled && !canEnable)
                                    }
                                    className="data-[state=unchecked]:bg-muted-foreground/25"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {filteredRestaurants.map((restaurant) => {
                      const isUpdating = updatingRestaurantId === restaurant.id;
                      const canEnable = restaurant.kill_switch_can_redirect;
                      const isEnabled = restaurant.kill_switch_enabled;

                      return (
                        <Card
                          key={restaurant.id}
                          className={`transition-colors ${isEnabled ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {isEnabled && (
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{restaurant.name}</p>
                                  <p className="text-xs text-muted-foreground">#{restaurant.id}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isUpdating && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                )}
                                <span
                                  className={`text-xs font-medium ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  {isEnabled ? "ON" : "OFF"}
                                </span>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    openRestaurantConfirmation(restaurant, checked)
                                  }
                                  disabled={
                                    isUpdating ||
                                    isRefreshing ||
                                    isLoading ||
                                    isBulkUpdating ||
                                    (!isEnabled && !canEnable)
                                  }
                                  className="data-[state=unchecked]:bg-muted-foreground/25"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted-foreground mb-0.5">Escalation Phone</p>
                                <p className="font-mono truncate">
                                  {restaurant.escalation_phone_number || (
                                    <span className="italic text-muted-foreground">Not set</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-0.5">Forwarding</p>
                                <Badge
                                  variant={restaurant.forward_escalations ? "default" : "secondary"}
                                  className="text-[11px]"
                                >
                                  {restaurant.forward_escalations ? "On" : "Off"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-0.5">Readiness</p>
                                {restaurant.kill_switch_can_redirect ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
                                  >
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Ready
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Blocked
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {restaurant.kill_switch_blockers.length > 0 && (
                              <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-2.5 space-y-0.5">
                                {restaurant.kill_switch_blockers.map((blocker) => (
                                  <p
                                    key={blocker}
                                    className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5"
                                  >
                                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                    {getBlockerLabel(blocker)}
                                  </p>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Bulk Toggle Confirmation */}
      <AlertDialog
        open={bulkTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBulkTarget(null);
            setEnableConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full ${bulkTarget ? "bg-primary/10" : "bg-muted"}`}
              >
                {bulkTarget ? (
                  <Zap className="h-5 w-5 text-primary" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <AlertDialogTitle className="text-left">
                {bulkTarget
                  ? "Enable kill switch for all restaurants?"
                  : "Disable kill switch for all restaurants?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {bulkTarget
                ? "This will route inbound calls to staff for all restaurants that have forwarding configured. Restaurants that are not ready will be skipped."
                : "This will return all restaurants to normal AI call handling."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkTarget && (
            <div className="space-y-2 pt-1">
              <Label htmlFor="bulk-confirm" className="text-sm">
                Type <span className="font-mono font-semibold text-primary">ENABLE</span> to confirm
              </Label>
              <Input
                id="bulk-confirm"
                value={enableConfirmText}
                onChange={(e) => setEnableConfirmText(e.target.value)}
                placeholder="ENABLE"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkUpdating || (bulkTarget === true && enableConfirmText !== "ENABLE")}
              onClick={(e) => {
                e.preventDefault();
                handleBulkToggle();
              }}
              className={bulkTarget ? "bg-primary hover:bg-primary/90" : ""}
            >
              {isBulkUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {bulkTarget ? "Enable All" : "Disable All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Restaurant Toggle Confirmation */}
      <AlertDialog
        open={pendingRestaurant !== null && restaurantTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRestaurant(null);
            setRestaurantTarget(null);
            setEnableConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full ${restaurantTarget ? "bg-primary/10" : "bg-muted"}`}
              >
                {restaurantTarget ? (
                  <Zap className="h-5 w-5 text-primary" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <AlertDialogTitle className="text-left">
                {restaurantTarget ? "Enable kill switch?" : "Disable kill switch?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {pendingRestaurant ? (
                <>
                  <span className="font-medium text-foreground">{pendingRestaurant.name}</span>
                  {restaurantTarget
                    ? " will bypass AI and forward calls to the escalation phone number."
                    : " will resume normal AI call handling."}
                </>
              ) : (
                "Confirm this action."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {restaurantTarget && (
            <div className="space-y-2 pt-1">
              <Label htmlFor="single-confirm" className="text-sm">
                Type <span className="font-mono font-semibold text-primary">ENABLE</span> to confirm
              </Label>
              <Input
                id="single-confirm"
                value={enableConfirmText}
                onChange={(e) => setEnableConfirmText(e.target.value)}
                placeholder="ENABLE"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRestaurantId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                updatingRestaurantId !== null ||
                (restaurantTarget === true && enableConfirmText !== "ENABLE")
              }
              onClick={(e) => {
                e.preventDefault();
                handleRestaurantToggle();
              }}
              className={restaurantTarget ? "bg-primary hover:bg-primary/90" : ""}
            >
              {updatingRestaurantId !== null ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KillSwitch;
