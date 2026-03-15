import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Loader2, Power, RefreshCw, Search, ShieldAlert } from "lucide-react";
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
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Kill-Switch"
          description="Manage kill-switch controls across restaurants"
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    Global Kill-Switch Control
                  </CardTitle>
                  <CardDescription>
                    Enabling kill switch routes inbound calls directly to restaurant escalation
                    numbers.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fetchRestaurants(true)}
                  disabled={
                    isLoading || isRefreshing || isBulkUpdating || updatingRestaurantId !== null
                  }
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{stats.total}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Enabled</p>
                  <p className="text-xl font-semibold text-destructive">{stats.enabled}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Disabled</p>
                  <p className="text-xl font-semibold">{stats.disabled}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Ready</p>
                  <p className="text-xl font-semibold text-emerald-600">{stats.ready}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Blocked</p>
                  <p className="text-xl font-semibold text-amber-600">{stats.blocked}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
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
                  Enable Kill Switch For All
                </Button>
                <Button
                  variant="outline"
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
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  Disable Kill Switch For All
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>Restaurant Controls</CardTitle>
                  <CardDescription>
                    Toggle kill switch per restaurant with readiness checks.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{filteredRestaurants.length} restaurants</Badge>
              </div>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by restaurant name or ID"
                  className="pl-9"
                />
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
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading restaurants...
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {search ? "No restaurants match your search." : "No restaurants found."}
                </div>
              ) : (
                <>
                  <div className="hidden lg:block border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Restaurant</TableHead>
                          <TableHead>Escalation Phone</TableHead>
                          <TableHead>Forwarding</TableHead>
                          <TableHead>Readiness</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Blockers</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRestaurants.map((restaurant) => {
                          const isUpdating = updatingRestaurantId === restaurant.id;
                          const canEnable = restaurant.kill_switch_can_redirect;
                          return (
                            <TableRow key={restaurant.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{restaurant.name}</p>
                                  <p className="text-xs text-muted-foreground">#{restaurant.id}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {restaurant.escalation_phone_number || "Not configured"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={restaurant.forward_escalations ? "default" : "secondary"}
                                >
                                  {restaurant.forward_escalations ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    restaurant.kill_switch_can_redirect ? "default" : "destructive"
                                  }
                                >
                                  {restaurant.kill_switch_can_redirect ? "Ready" : "Blocked"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    restaurant.kill_switch_enabled ? "destructive" : "secondary"
                                  }
                                >
                                  {restaurant.kill_switch_enabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {restaurant.kill_switch_blockers.length > 0 ? (
                                  <div className="space-y-1">
                                    {restaurant.kill_switch_blockers.map((blocker) => (
                                      <p
                                        key={blocker}
                                        className="text-xs text-amber-700 dark:text-amber-300"
                                      >
                                        {getBlockerLabel(blocker)}
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant={
                                    restaurant.kill_switch_enabled ? "outline" : "destructive"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    openRestaurantConfirmation(
                                      restaurant,
                                      !restaurant.kill_switch_enabled
                                    )
                                  }
                                  disabled={
                                    isUpdating ||
                                    isRefreshing ||
                                    isLoading ||
                                    isBulkUpdating ||
                                    (!restaurant.kill_switch_enabled && !canEnable)
                                  }
                                >
                                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                  {restaurant.kill_switch_enabled
                                    ? "Disable Kill Switch"
                                    : "Enable Kill Switch"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="lg:hidden space-y-3">
                    {filteredRestaurants.map((restaurant) => {
                      const isUpdating = updatingRestaurantId === restaurant.id;
                      const canEnable = restaurant.kill_switch_can_redirect;

                      return (
                        <Card key={restaurant.id} className="border">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{restaurant.name}</p>
                                <p className="text-xs text-muted-foreground">#{restaurant.id}</p>
                              </div>
                              <Badge
                                variant={
                                  restaurant.kill_switch_enabled ? "destructive" : "secondary"
                                }
                              >
                                {restaurant.kill_switch_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">Escalation Phone</p>
                                <p className="font-mono">
                                  {restaurant.escalation_phone_number || "Not configured"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Readiness</p>
                                <Badge
                                  variant={
                                    restaurant.kill_switch_can_redirect ? "default" : "destructive"
                                  }
                                >
                                  {restaurant.kill_switch_can_redirect ? "Ready" : "Blocked"}
                                </Badge>
                              </div>
                            </div>

                            {restaurant.kill_switch_blockers.length > 0 && (
                              <div className="rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-2">
                                {restaurant.kill_switch_blockers.map((blocker) => (
                                  <p
                                    key={blocker}
                                    className="text-xs text-amber-800 dark:text-amber-300"
                                  >
                                    {getBlockerLabel(blocker)}
                                  </p>
                                ))}
                              </div>
                            )}

                            <Button
                              className="w-full"
                              variant={restaurant.kill_switch_enabled ? "outline" : "destructive"}
                              onClick={() =>
                                openRestaurantConfirmation(
                                  restaurant,
                                  !restaurant.kill_switch_enabled
                                )
                              }
                              disabled={
                                isUpdating ||
                                isRefreshing ||
                                isLoading ||
                                isBulkUpdating ||
                                (!restaurant.kill_switch_enabled && !canEnable)
                              }
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              {restaurant.kill_switch_enabled
                                ? "Disable Kill Switch"
                                : "Enable Kill Switch"}
                            </Button>
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

      <AlertDialog open={bulkTarget !== null} onOpenChange={(open) => !open && setBulkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkTarget
                ? "Enable kill switch for all restaurants?"
                : "Disable kill switch for all restaurants?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkTarget
                ? "This will route inbound calls to staff for all restaurants that have forwarding configured. Restaurants that are not ready will be skipped."
                : "This will return all restaurants to normal AI call handling."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkUpdating}
              onClick={(e) => {
                e.preventDefault();
                handleBulkToggle();
              }}
              className={bulkTarget ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isBulkUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingRestaurant !== null && restaurantTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRestaurant(null);
            setRestaurantTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {restaurantTarget
                ? "Enable kill switch for this restaurant?"
                : "Disable kill switch for this restaurant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRestaurant ? (
                <>
                  <span className="font-medium">{pendingRestaurant.name}</span>
                  {restaurantTarget
                    ? " will bypass AI and forward calls to the escalation phone number."
                    : " will resume normal AI call handling."}
                </>
              ) : (
                "Confirm this action."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRestaurantId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updatingRestaurantId !== null}
              onClick={(e) => {
                e.preventDefault();
                handleRestaurantToggle();
              }}
              className={restaurantTarget ? "bg-destructive hover:bg-destructive/90" : ""}
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
