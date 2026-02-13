import { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Info,
  BarChart3,
  Clock,
  PhoneCall,
  Users,
  UtensilsCrossed,
  HelpCircle,
  Building2,
  Settings2,
  Plug,
  CreditCard,
  Timer,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Loader2,
  Bot,
  ShoppingBag,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  getRestaurants,
  getRestaurant,
  getRestaurantStats,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "@/services/restaurants";
import type {
  Restaurant,
  RestaurantCreateRequest,
  RestaurantStats,
  PaginationInfo,
  OperatingHours,
} from "@/types/api.types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TimezoneCombobox } from "@/components/ui/timezone-combobox";
import { toast } from "sonner";
import { validateJsonObject, safeParseJsonObject } from "@/lib/utils/json";
import {
  DEFAULT_TIMEZONE,
  formatLocalDateTime,
  getSupportedTimeZones,
  DAYS_OF_WEEK,
  DAY_LABELS_SHORT,
  getDayName,
} from "@/lib/utils/timezone";
import type { DayOfWeek } from "@/lib/utils/timezone";
import { formatTimeForInput, formatTimeForApi } from "@/lib/utils/time";

// Default operating hours for new restaurants (deep clone to avoid mutating shared reference)
const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  tuesday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  wednesday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  thursday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  friday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  saturday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
  sunday: { open: "09:00:00", close: "22:00:00", is_closed: false, is_24_hours: false },
};

function getDefaultOperatingHoursClone(): OperatingHours {
  return JSON.parse(JSON.stringify(DEFAULT_OPERATING_HOURS)) as OperatingHours;
}

/**
 * Get display text for today's operating hours
 */
const getTodayHoursDisplay = (operatingHours: OperatingHours | null): string => {
  if (!operatingHours) return "Not set";

  const today = new Date();
  const dayName = getDayName(today);
  const todayHours = operatingHours[dayName];

  if (todayHours.is_closed) {
    return "Closed Today";
  }

  if (todayHours.is_24_hours) {
    return "Open 24 hrs";
  }

  if (!todayHours.open || !todayHours.close) {
    return "Not set";
  }

  return `${todayHours.open.slice(0, 5)} - ${todayHours.close.slice(0, 5)}`;
};

// Form data structure - uses JSON strings for integration details
// Objects are only created during submission
interface RestaurantFormData {
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number: string;
  forward_escalations: boolean;
  escalation_phone_number: string;
  forward_minutes: number;
  backward_minutes: number;
  is_credit_card_required_for_reservation: boolean;
  operating_hours: OperatingHours;
  timezone: string;
  reservation_seating_capacity: number;
  reservation_advance_days: number;
  twilio_details_json: string;
  deepgram_details_json: string;
  open_table_details_json: string;
  features_orders_enabled: boolean;
  features_reservations_enabled: boolean;
}

// Form validation errors
interface FormErrors {
  name?: string;
  address?: string;
  phone_number?: string;
  twilio_phone_number?: string;
  escalation_phone_number?: string;
  forward_minutes?: string;
  backward_minutes?: string;
  reservation_seating_capacity?: string;
  reservation_advance_days?: string;
  twilio_details?: string;
  deepgram_details?: string;
  open_table_details?: string;
}

const defaultFormData: RestaurantFormData = {
  name: "",
  address: "",
  phone_number: "",
  twilio_phone_number: "",
  forward_escalations: false,
  escalation_phone_number: "",
  forward_minutes: 60,
  backward_minutes: 30,
  is_credit_card_required_for_reservation: false,
  operating_hours: getDefaultOperatingHoursClone(),
  timezone: DEFAULT_TIMEZONE,
  reservation_seating_capacity: 50,
  reservation_advance_days: 30,
  twilio_details_json: "{}",
  deepgram_details_json: "{}",
  open_table_details_json: "{}",
  features_orders_enabled: true,
  features_reservations_enabled: true,
};

// Phone number validation regex (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

const Restaurants = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"id" | "name" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant | null>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Form state with extended data
  const [formData, setFormData] = useState<RestaurantFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState("basic");
  const timeZoneOptions = useMemo(() => [...getSupportedTimeZones()].sort(), []);

  /**
   * Copy hours from one day to all days
   */
  const copyToAllDays = (sourceDay: DayOfWeek) => {
    const sourceDayHours = formData.operating_hours[sourceDay];
    const newOperatingHours = { ...formData.operating_hours };

    DAYS_OF_WEEK.forEach((day) => {
      newOperatingHours[day] = { ...sourceDayHours };
    });

    setFormData({ ...formData, operating_hours: newOperatingHours });
    toast.success(`Copied ${DAY_LABELS_SHORT[sourceDay]}'s hours to all days`);
  };

  /**
   * Update a specific day's hours
   */
  const updateDayHours = (
    day: DayOfWeek,
    field: "open" | "close" | "is_closed" | "is_24_hours",
    value: string | boolean | null
  ) => {
    const currentDayHours = formData.operating_hours[day];
    const updatedDayHours = { ...currentDayHours, [field]: value };

    // Handle mutual exclusivity and clearing logic
    if (field === "is_closed" && value === true) {
      // When marking as closed, disable 24 hours
      updatedDayHours.is_24_hours = false;
    } else if (field === "is_closed" && value === false) {
      // When unmarking as closed, ensure we have valid times if not 24 hours
      if (!updatedDayHours.is_24_hours) {
        updatedDayHours.open = updatedDayHours.open || "09:00:00";
        updatedDayHours.close = updatedDayHours.close || "22:00:00";
      }
    } else if (field === "is_24_hours" && value === true) {
      // When marking as 24 hours, clear the times (optional: keep them for if they toggle back)
      updatedDayHours.open = null;
      updatedDayHours.close = null;
    } else if (field === "is_24_hours" && value === false) {
      // When toggling off 24 hours, restore default times
      updatedDayHours.open = currentDayHours.open || "09:00:00";
      updatedDayHours.close = currentDayHours.close || "22:00:00";
    }

    setFormData({
      ...formData,
      operating_hours: {
        ...formData.operating_hours,
        [day]: updatedDayHours,
      },
    });
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRestaurants({
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
      });
      setRestaurants(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Sort restaurants based on sortColumn and sortDirection
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (!sortColumn) return 0;

    let comparison = 0;
    if (sortColumn === "id") {
      comparison = a.id - b.id;
    } else if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (column: "id" | "name") => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "id" | "name") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  };

  const resetForm = () => {
    setFormData({ ...defaultFormData, operating_hours: getDefaultOperatingHoursClone() });
    setFormErrors({});
    setActiveTab("basic");
  };

  // Validate a single JSON field and update errors
  const validateJsonField = (
    json: string,
    field: "twilio_details" | "deepgram_details" | "open_table_details"
  ): { valid: boolean; data: Record<string, unknown> } => {
    const result = validateJsonObject(json);
    setFormErrors((prev) => ({
      ...prev,
      [field]: result.error || undefined,
    }));
    return { valid: result.valid, data: result.data || {} };
  };

  // Validate entire form and return errors
  const validateForm = (): { valid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      errors.name = "Restaurant name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.length < 5) {
      errors.address = "Please enter a complete address";
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else if (!PHONE_REGEX.test(formData.phone_number)) {
      errors.phone_number = "Phone must be in E.164 format (e.g., +15551234567)";
    }

    // Optional Twilio phone validation
    if (formData.twilio_phone_number && !PHONE_REGEX.test(formData.twilio_phone_number)) {
      errors.twilio_phone_number = "Twilio number must be in E.164 format";
    }

    if (formData.forward_escalations) {
      if (!formData.escalation_phone_number.trim()) {
        errors.escalation_phone_number = "Escalation phone number is required";
      } else if (!PHONE_REGEX.test(formData.escalation_phone_number)) {
        errors.escalation_phone_number = "Escalation phone must be in E.164 format";
      }
    }

    // Number validations
    if (formData.forward_minutes < 0 || formData.forward_minutes > 1440) {
      errors.forward_minutes = "Must be between 0 and 1440 minutes";
    }
    if (formData.backward_minutes < 0 || formData.backward_minutes > 1440) {
      errors.backward_minutes = "Must be between 0 and 1440 minutes";
    }
    if (formData.reservation_seating_capacity < 1 || formData.reservation_seating_capacity > 1000) {
      errors.reservation_seating_capacity = "Must be between 1 and 1000 seats";
    }
    if (formData.reservation_advance_days < 1 || formData.reservation_advance_days > 365) {
      errors.reservation_advance_days = "Must be between 1 and 365 days";
    }

    // JSON validations
    const twilioResult = validateJsonObject(formData.twilio_details_json);
    if (!twilioResult.valid) {
      errors.twilio_details = twilioResult.error;
    }

    const deepgramResult = validateJsonObject(formData.deepgram_details_json);
    if (!deepgramResult.valid) {
      errors.deepgram_details = deepgramResult.error;
    }

    const openTableResult = validateJsonObject(formData.open_table_details_json);
    if (!openTableResult.valid) {
      errors.open_table_details = openTableResult.error;
    }

    setFormErrors(errors);
    return { valid: Object.keys(errors).length === 0, errors };
  };

  // Prepare and validate form data for submission
  const prepareFormDataForSubmit = (): RestaurantCreateRequest | null => {
    const validation = validateForm();
    if (!validation.valid) {
      // Switch to tab with first error
      if (
        validation.errors.name ||
        validation.errors.address ||
        validation.errors.phone_number ||
        validation.errors.twilio_phone_number ||
        validation.errors.escalation_phone_number
      ) {
        setActiveTab("basic");
      } else if (validation.errors.forward_minutes || validation.errors.backward_minutes) {
        setActiveTab("settings");
      } else if (
        validation.errors.twilio_details ||
        validation.errors.deepgram_details ||
        validation.errors.open_table_details
      ) {
        setActiveTab("integrations");
      }
      return null;
    }

    return {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone_number: formData.phone_number.trim(),
      twilio_phone_number: formData.twilio_phone_number.trim() || undefined,
      forward_escalations: formData.forward_escalations,
      escalation_phone_number: formData.forward_escalations
        ? formData.escalation_phone_number.trim() || undefined
        : undefined,
      forward_minutes: formData.forward_minutes,
      backward_minutes: formData.backward_minutes,
      is_credit_card_required_for_reservation: formData.is_credit_card_required_for_reservation,
      operating_hours: formData.operating_hours,
      timezone: formData.timezone || DEFAULT_TIMEZONE,
      reservation_seating_capacity: formData.reservation_seating_capacity,
      reservation_advance_days: formData.reservation_advance_days,
      twilio_details: safeParseJsonObject(formData.twilio_details_json),
      deepgram_details: safeParseJsonObject(formData.deepgram_details_json),
      open_table_details: safeParseJsonObject(formData.open_table_details_json),
      features: {
        orders_enabled: formData.features_orders_enabled,
        reservations_enabled: formData.features_reservations_enabled,
        faqs_enabled: true, // Always true; FAQ feature is required for the agent to function correctly
      },
    };
  };

  const handleCreate = async () => {
    const payload = prepareFormDataForSubmit();
    if (!payload) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      await createRestaurant(payload);
      toast.success("Restaurant created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchRestaurants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create restaurant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRestaurant) return;

    const payload = prepareFormDataForSubmit();
    if (!payload) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateRestaurant(selectedRestaurant.id, payload);
      toast.success("Restaurant updated successfully");
      setIsEditDialogOpen(false);
      setSelectedRestaurant(null);
      resetForm();
      fetchRestaurants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update restaurant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    try {
      setIsSubmitting(true);
      await deleteRestaurant(selectedRestaurant.id);
      toast.success("Restaurant deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete restaurant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormErrors({});

    // Ensure is_24_hours is populated for each day when loading restaurant data (handles legacy API)
    const operatingHours = getDefaultOperatingHoursClone();
    if (restaurant.operating_hours) {
      const defaultDay = getDefaultOperatingHoursClone().monday;
      DAYS_OF_WEEK.forEach((day) => {
        const fromApi = restaurant.operating_hours![day];
        operatingHours[day] = {
          open: fromApi?.open ?? defaultDay.open,
          close: fromApi?.close ?? defaultDay.close,
          is_closed: fromApi?.is_closed ?? false,
          is_24_hours: fromApi?.is_24_hours ?? false,
        };
      });
    }

    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      phone_number: restaurant.phone_number,
      twilio_phone_number: restaurant.twilio_phone_number || "",
      forward_escalations: restaurant.forward_escalations ?? false,
      escalation_phone_number: restaurant.escalation_phone_number || "",
      forward_minutes: restaurant.forward_minutes,
      backward_minutes: restaurant.backward_minutes,
      is_credit_card_required_for_reservation: restaurant.is_credit_card_required_for_reservation,
      operating_hours: operatingHours,
      timezone: restaurant.timezone || DEFAULT_TIMEZONE,
      reservation_seating_capacity: restaurant.reservation_seating_capacity ?? 50,
      reservation_advance_days: restaurant.reservation_advance_days ?? 30,
      twilio_details_json: JSON.stringify(restaurant.twilio_details || {}, null, 2),
      deepgram_details_json: JSON.stringify(restaurant.deepgram_details || {}, null, 2),
      open_table_details_json: JSON.stringify(restaurant.open_table_details || {}, null, 2),
      features_orders_enabled: restaurant.features?.orders_enabled ?? true,
      features_reservations_enabled: restaurant.features?.reservations_enabled ?? true,
    });
    setActiveTab("basic");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDetailsDialogOpen(true);
    setIsLoadingDetails(true);
    try {
      const details = await getRestaurant(restaurant.id);
      setRestaurantDetails(details);
    } catch {
      toast.error("Failed to load restaurant details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openStatsDialog = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsStatsDialogOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await getRestaurantStats(restaurant.id);
      setRestaurantStats(stats);
    } catch {
      toast.error("Failed to load restaurant stats");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatJson = (obj: Record<string, unknown> | null | undefined) => {
    if (!obj || Object.keys(obj).length === 0) return "No configuration";
    return JSON.stringify(obj, null, 2);
  };

  const hasIntegrations = (restaurant: Restaurant) => {
    return (
      (restaurant.twilio_details && Object.keys(restaurant.twilio_details).length > 0) ||
      (restaurant.deepgram_details && Object.keys(restaurant.deepgram_details).length > 0) ||
      (restaurant.open_table_details && Object.keys(restaurant.open_table_details).length > 0)
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Restaurants"
          description="Manage restaurant information, settings, and integrations"
        />
        <main className="flex-1 p-4 lg:p-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">All Restaurants</CardTitle>
                    {pagination && (
                      <p className="text-sm text-muted-foreground hidden sm:block">
                        {pagination.total} restaurant{pagination.total !== 1 ? "s" : ""} total
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 w-full sm:w-[220px]"
                    />
                  </div>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="shadow-sm w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Restaurant
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <div className="text-center py-8 px-4 text-destructive bg-destructive/5 mx-4 mb-4 rounded-lg">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-[50px] font-semibold hidden sm:table-cell">
                            <button
                              onClick={() => handleSort("id")}
                              className="flex items-center hover:text-primary transition-colors"
                            >
                              ID
                              {getSortIcon("id")}
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold">
                            <button
                              onClick={() => handleSort("name")}
                              className="flex items-center hover:text-primary transition-colors"
                            >
                              Restaurant
                              {getSortIcon("name")}
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">
                            Contact
                          </TableHead>
                          <TableHead className="font-semibold text-center hidden lg:table-cell">
                            Hours
                          </TableHead>
                          <TableHead className="font-semibold text-center hidden xl:table-cell">
                            Settings
                          </TableHead>
                          <TableHead className="font-semibold text-center w-[140px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedRestaurants.map((restaurant) => (
                          <TableRow key={restaurant.id} className="group">
                            <TableCell className="font-mono text-muted-foreground hidden sm:table-cell">
                              #{restaurant.id}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{restaurant.name}</p>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="text-xs truncate max-w-[250px]">
                                    {restaurant.address}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {restaurant.phone_number}
                                </div>
                                {restaurant.twilio_phone_number && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <PhoneCall className="h-3 w-3" />
                                    Twilio: {restaurant.twilio_phone_number}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              {restaurant.operating_hours ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                                          getTodayHoursDisplay(restaurant.operating_hours) ===
                                          "Closed Today"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-green-50 text-green-700"
                                        }`}
                                      >
                                        <Clock className="h-3 w-3" />
                                        {getTodayHoursDisplay(restaurant.operating_hours)}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <div className="space-y-1 text-xs">
                                        <p className="font-semibold mb-2 pb-1 border-b">
                                          Weekly Schedule
                                        </p>
                                        {DAYS_OF_WEEK.map((day) => {
                                          const hours = restaurant.operating_hours![day];
                                          return (
                                            <div key={day} className="flex justify-between gap-4">
                                              <span className="font-medium">
                                                {DAY_LABELS_SHORT[day]}:
                                              </span>
                                              <span>
                                                {hours.is_closed
                                                  ? "Closed"
                                                  : hours.is_24_hours
                                                    ? "24 hrs"
                                                    : hours.open && hours.close
                                                      ? `${hours.open.slice(0, 5)} - ${hours.close.slice(0, 5)}`
                                                      : "Not set"}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not set</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <div className="flex items-center justify-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant={
                                          restaurant.is_credit_card_required_for_reservation
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-[10px] px-1.5"
                                      >
                                        <CreditCard className="h-3 w-3" />
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Credit card{" "}
                                      {restaurant.is_credit_card_required_for_reservation
                                        ? "required"
                                        : "not required"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                        <Users className="h-3 w-3 text-blue-500" />
                                        <span>{restaurant.reservation_seating_capacity ?? 50}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Seating capacity:{" "}
                                      {restaurant.reservation_seating_capacity ?? 50} seats
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                                        <Timer className="h-3 w-3" />
                                        <span className="text-green-600">
                                          +{restaurant.forward_minutes}
                                        </span>
                                        <span>/</span>
                                        <span className="text-orange-600">
                                          -{restaurant.backward_minutes}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Forward: {restaurant.forward_minutes}m, Backward:{" "}
                                      {restaurant.backward_minutes}m
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {hasIntegrations(restaurant) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge variant="outline" className="text-[10px] px-1.5">
                                          <Plug className="h-3 w-3 text-blue-500" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>Has integrations configured</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                {/* Feature flags badges */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div
                                        className={`p-1 rounded ${restaurant.features?.orders_enabled !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                                      >
                                        <ShoppingBag className="h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Orders{" "}
                                      {restaurant.features?.orders_enabled !== false
                                        ? "enabled"
                                        : "disabled"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div
                                        className={`p-1 rounded ${restaurant.features?.reservations_enabled !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                                      >
                                        <CalendarDays className="h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Reservations{" "}
                                      {restaurant.features?.reservations_enabled !== false
                                        ? "enabled"
                                        : "disabled"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div
                                        className={`p-1 rounded ${restaurant.features?.faqs_enabled !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                                      >
                                        <HelpCircle className="h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      FAQs{" "}
                                      {restaurant.features?.faqs_enabled !== false
                                        ? "enabled"
                                        : "disabled"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openDetailsDialog(restaurant)}
                                      >
                                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openStatsDialog(restaurant)}
                                      >
                                        <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Stats</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openEditDialog(restaurant)}
                                      >
                                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openDeleteDialog(restaurant)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Page {pagination.page} of {pagination.pages}
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                          disabled={currentPage === pagination.pages}
                          className="flex-1 sm:flex-initial"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isLoading && !error && restaurants.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No restaurants found</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first restaurant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit Dialog with Tabs */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedRestaurant(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditDialogOpen ? (
                <>
                  <Pencil className="h-5 w-5" /> Edit Restaurant
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> Create Restaurant
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? `Editing: ${selectedRestaurant?.name}`
                : "Fill in the details to create a new restaurant."}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Plug className="h-4 w-4" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[50vh] mt-4">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Restaurant Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name)
                          setFormErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="e.g., Ressy's Kitchen"
                      className={formErrors.name ? "border-destructive" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-destructive">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address)
                          setFormErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      placeholder="e.g., 123 Main St, Springfield, IL 62701"
                      className={formErrors.address ? "border-destructive" : ""}
                    />
                    {formErrors.address && (
                      <p className="text-xs text-destructive">{formErrors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone_number">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <PhoneInput
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(value) => {
                          setFormData({ ...formData, phone_number: value });
                          if (formErrors.phone_number)
                            setFormErrors((prev) => ({ ...prev, phone_number: undefined }));
                        }}
                        placeholder="1234567890"
                        error={!!formErrors.phone_number}
                      />
                      {formErrors.phone_number && (
                        <p className="text-xs text-destructive">{formErrors.phone_number}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="twilio_phone_number">Twilio Phone Number</Label>
                      <PhoneInput
                        id="twilio_phone_number"
                        value={formData.twilio_phone_number}
                        onChange={(value) => {
                          setFormData({ ...formData, twilio_phone_number: value });
                          if (formErrors.twilio_phone_number)
                            setFormErrors((prev) => ({ ...prev, twilio_phone_number: undefined }));
                        }}
                        placeholder="1234567890"
                        error={!!formErrors.twilio_phone_number}
                      />
                      {formErrors.twilio_phone_number && (
                        <p className="text-xs text-destructive">{formErrors.twilio_phone_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="forward_escalations" className="text-sm font-medium">
                        Forward Escalations
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Route escalated calls directly to the restaurant
                      </p>
                    </div>
                    <Switch
                      id="forward_escalations"
                      checked={formData.forward_escalations}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, forward_escalations: checked });
                        if (!checked && formErrors.escalation_phone_number) {
                          setFormErrors((prev) => ({
                            ...prev,
                            escalation_phone_number: undefined,
                          }));
                        }
                      }}
                    />
                  </div>

                  {formData.forward_escalations && (
                    <div className="grid gap-2">
                      <Label htmlFor="escalation_phone_number">
                        Escalation Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <PhoneInput
                        id="escalation_phone_number"
                        value={formData.escalation_phone_number}
                        onChange={(value) => {
                          setFormData({ ...formData, escalation_phone_number: value });
                          if (formErrors.escalation_phone_number)
                            setFormErrors((prev) => ({
                              ...prev,
                              escalation_phone_number: undefined,
                            }));
                        }}
                        placeholder="1234567890"
                        error={!!formErrors.escalation_phone_number}
                      />
                      {formErrors.escalation_phone_number && (
                        <p className="text-xs text-destructive">
                          {formErrors.escalation_phone_number}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 space-y-4">
                <div className="grid gap-4">
                  {/* Operating Hours Section - Per Day */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Weekly Operating Hours
                      </h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToAllDays("monday")}
                              className="h-7 text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Copy Mon to All
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Monday's hours to all days</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="space-y-3">
                      {DAYS_OF_WEEK.map((day) => {
                        const dayHours = formData.operating_hours[day];
                        return (
                          <div
                            key={day}
                            className="flex items-center gap-2 p-2 rounded-lg border bg-background"
                          >
                            {/* Day Name */}
                            <div className="min-w-[50px]">
                              <Label className="text-xs font-medium">{DAY_LABELS_SHORT[day]}</Label>
                            </div>

                            {/* Closed Toggle */}
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={dayHours.is_closed}
                                onCheckedChange={(checked) => {
                                  updateDayHours(day, "is_closed", checked);
                                }}
                                className="scale-75"
                              />
                              <span className="text-xs text-muted-foreground w-12">
                                {dayHours.is_closed ? "Closed" : "Open"}
                              </span>
                            </div>

                            {/* 24 Hours Toggle - Only show if not closed */}
                            {!dayHours.is_closed && (
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={dayHours.is_24_hours}
                                  onCheckedChange={(checked) => {
                                    updateDayHours(day, "is_24_hours", checked);
                                  }}
                                  className="scale-75"
                                />
                                <span className="text-xs text-muted-foreground w-10">24 hrs</span>
                              </div>
                            )}

                            {/* Time Inputs - Only show if not closed and not 24 hours */}
                            {!dayHours.is_closed && !dayHours.is_24_hours && (
                              <>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    type="time"
                                    value={formatTimeForInput(dayHours.open)}
                                    onChange={(e) => {
                                      const v = formatTimeForApi(e.target.value);
                                      updateDayHours(day, "open", v ?? null);
                                    }}
                                    className="h-8 text-xs"
                                    placeholder="Opening"
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">-</span>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    type="time"
                                    value={formatTimeForInput(dayHours.close)}
                                    onChange={(e) => {
                                      const v = formatTimeForApi(e.target.value);
                                      updateDayHours(day, "close", v ?? null);
                                    }}
                                    className="h-8 text-xs"
                                    placeholder="Closing"
                                  />
                                </div>
                              </>
                            )}

                            {/* Open 24 Hours display - Only show if 24 hours is enabled */}
                            {!dayHours.is_closed && dayHours.is_24_hours && (
                              <span className="flex-1 text-xs text-green-600 font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Open 24 hours
                              </span>
                            )}

                            {/* Copy Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToAllDays(day)}
                                    className="h-7 w-7 shrink-0"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy to all days</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timezone Selection */}
                    <div className="grid gap-2 mt-4 pt-4 border-t">
                      <Label htmlFor="timezone">Timezone</Label>
                      <TimezoneCombobox
                        value={formData.timezone}
                        onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                        timezones={timeZoneOptions}
                        placeholder="Select timezone"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used to interpret operating hours and availability checks
                      </p>
                    </div>
                  </div>

                  {/* Reservation Settings Section */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> Reservation Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="seatingCapacity">Maximum Seating Capacity</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="seatingCapacity"
                            type="number"
                            min={1}
                            max={1000}
                            value={formData.reservation_seating_capacity}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                reservation_seating_capacity: Number(e.target.value),
                              });
                              if (formErrors.reservation_seating_capacity)
                                setFormErrors((prev) => ({
                                  ...prev,
                                  reservation_seating_capacity: undefined,
                                }));
                            }}
                            className={`w-32 ${formErrors.reservation_seating_capacity ? "border-destructive" : ""}`}
                          />
                          <span className="text-sm text-muted-foreground">seats</span>
                        </div>
                        {formErrors.reservation_seating_capacity ? (
                          <p className="text-xs text-destructive">
                            {formErrors.reservation_seating_capacity}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Maximum guests that can be seated at any time
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanceDays">Advance Booking Window</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="advanceDays"
                            type="number"
                            min={1}
                            max={365}
                            value={formData.reservation_advance_days}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                reservation_advance_days: Number(e.target.value),
                              });
                              if (formErrors.reservation_advance_days)
                                setFormErrors((prev) => ({
                                  ...prev,
                                  reservation_advance_days: undefined,
                                }));
                            }}
                            className={`w-32 ${formErrors.reservation_advance_days ? "border-destructive" : ""}`}
                          />
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                        {formErrors.reservation_advance_days ? (
                          <p className="text-xs text-destructive">
                            {formErrors.reservation_advance_days}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            How far in advance customers can book
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="forward_minutes">
                          Forward Minutes
                          <span className="text-muted-foreground text-xs ml-2">
                            (booking window ahead)
                          </span>
                        </Label>
                        <Input
                          id="forward_minutes"
                          type="number"
                          min="0"
                          max="1440"
                          value={formData.forward_minutes}
                          onChange={(e) => {
                            setFormData({ ...formData, forward_minutes: Number(e.target.value) });
                            if (formErrors.forward_minutes)
                              setFormErrors((prev) => ({ ...prev, forward_minutes: undefined }));
                          }}
                          className={formErrors.forward_minutes ? "border-destructive" : ""}
                        />
                        {formErrors.forward_minutes && (
                          <p className="text-xs text-destructive">{formErrors.forward_minutes}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="backward_minutes">
                          Backward Minutes
                          <span className="text-muted-foreground text-xs ml-2">
                            (cancellation window)
                          </span>
                        </Label>
                        <Input
                          id="backward_minutes"
                          type="number"
                          min="0"
                          max="1440"
                          value={formData.backward_minutes}
                          onChange={(e) => {
                            setFormData({ ...formData, backward_minutes: Number(e.target.value) });
                            if (formErrors.backward_minutes)
                              setFormErrors((prev) => ({ ...prev, backward_minutes: undefined }));
                          }}
                          className={formErrors.backward_minutes ? "border-destructive" : ""}
                        />
                        {formErrors.backward_minutes && (
                          <p className="text-xs text-destructive">{formErrors.backward_minutes}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="credit_card" className="text-sm font-medium">
                          Credit Card Required
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Require credit card for reservations
                        </p>
                      </div>
                      <Switch
                        id="credit_card"
                        checked={formData.is_credit_card_required_for_reservation}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            is_credit_card_required_for_reservation: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Agent Capabilities Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Agent Capabilities
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Configure what RessyAI can handle for this restaurant
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Warning Banner */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                          Disabling capabilities will route those requests to restaurant staff via
                          escalation.
                        </span>
                      </div>

                      {/* Orders Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="features_orders"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            Pickup Orders
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Handle pickup order requests
                          </p>
                        </div>
                        <Switch
                          id="features_orders"
                          checked={formData.features_orders_enabled}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, features_orders_enabled: checked })
                          }
                        />
                      </div>

                      <Separator />

                      {/* Reservations Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="features_reservations"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            Reservations
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Handle table reservation requests
                          </p>
                        </div>
                        <Switch
                          id="features_reservations"
                          checked={formData.features_reservations_enabled}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, features_reservations_enabled: checked })
                          }
                        />
                      </div>

                      <Separator />

                      {/* FAQs Toggle - Always ON (required for agent) */}
                      <div className="flex items-center justify-between opacity-90">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="features_faqs"
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            FAQs & General Questions
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  FAQ feature is always enabled for the agent to function correctly
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Answer menu and general inquiries (always on)
                          </p>
                        </div>
                        <Switch
                          id="features_faqs"
                          checked={true}
                          disabled
                          className="data-[state=checked]:opacity-70"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0 space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                  <Info className="h-4 w-4 inline mr-2" />
                  Enter JSON configuration for each integration. Leave as{" "}
                  <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{"{}"}</code> if not
                  configured.
                </div>

                <div className="grid gap-4">
                  {/* Twilio Integration */}
                  <Collapsible defaultOpen className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group w-full justify-between p-4 h-auto hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <PhoneCall className="h-4 w-4 text-blue-500" />
                          Twilio Configuration
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="grid gap-2">
                        {formErrors.twilio_details && (
                          <p className="text-xs text-destructive">{formErrors.twilio_details}</p>
                        )}
                        <Textarea
                          id="twilio_details"
                          value={formData.twilio_details_json}
                          onChange={(e) => {
                            setFormData({ ...formData, twilio_details_json: e.target.value });
                            validateJsonField(e.target.value, "twilio_details");
                          }}
                          placeholder='{"workspace_sid": "WSxxxx", "phone_sid": "PNxxxx"}'
                          className={`font-mono text-sm min-h-[80px] ${formErrors.twilio_details ? "border-destructive" : ""}`}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Deepgram Integration */}
                  <Collapsible defaultOpen className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group w-full justify-between p-4 h-auto hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Settings2 className="h-4 w-4 text-green-500" />
                          Deepgram Configuration
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="grid gap-2">
                        {formErrors.deepgram_details && (
                          <p className="text-xs text-destructive">{formErrors.deepgram_details}</p>
                        )}
                        <Textarea
                          id="deepgram_details"
                          value={formData.deepgram_details_json}
                          onChange={(e) => {
                            setFormData({ ...formData, deepgram_details_json: e.target.value });
                            validateJsonField(e.target.value, "deepgram_details");
                          }}
                          placeholder='{"project_id": "dg-project-1"}'
                          className={`font-mono text-sm min-h-[80px] ${formErrors.deepgram_details ? "border-destructive" : ""}`}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* OpenTable Integration */}
                  <Collapsible defaultOpen className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group w-full justify-between p-4 h-auto hover:bg-muted/50"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                          OpenTable Configuration
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="grid gap-2">
                        {formErrors.open_table_details && (
                          <p className="text-xs text-destructive">
                            {formErrors.open_table_details}
                          </p>
                        )}
                        <Textarea
                          id="open_table_details"
                          value={formData.open_table_details_json}
                          onChange={(e) => {
                            setFormData({ ...formData, open_table_details_json: e.target.value });
                            validateJsonField(e.target.value, "open_table_details");
                          }}
                          placeholder='{"rid": "99999"}'
                          className={`font-mono text-sm min-h-[80px] ${formErrors.open_table_details ? "border-destructive" : ""}`}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEdit : handleCreate}
              disabled={
                isSubmitting || !formData.name || !formData.address || !formData.phone_number
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditDialogOpen ? (
                "Save Changes"
              ) : (
                "Create Restaurant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Restaurant Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : restaurantDetails ? (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <span className="ml-2 font-mono">#{restaurantDetails.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{restaurantDetails.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="ml-2">{restaurantDetails.address}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-mono">{restaurantDetails.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Twilio:</span>
                    <span className="ml-2 font-mono">{restaurantDetails.twilio_phone_number}</span>
                  </div>
                </div>
              </div>

              {/* Hours & Settings */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Operating Hours
                </h4>
                <div className="space-y-2 text-sm">
                  {restaurantDetails.operating_hours ? (
                    DAYS_OF_WEEK.map((day) => {
                      const hours = restaurantDetails.operating_hours![day];
                      return (
                        <div key={day} className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground font-medium min-w-[100px]">
                            {DAY_LABELS_SHORT[day]}:
                          </span>
                          {hours.is_closed ? (
                            <Badge variant="secondary" className="text-xs">
                              Closed
                            </Badge>
                          ) : hours.is_24_hours ? (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Open 24 hours
                            </span>
                          ) : (
                            <span className="font-mono text-xs">
                              {hours.open && hours.close
                                ? `${hours.open.slice(0, 5)} - ${hours.close.slice(0, 5)}`
                                : "Not set"}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground">No hours configured</p>
                  )}
                  <div className="pt-2 border-t mt-3">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="ml-2 font-medium">
                      {restaurantDetails.timezone || DEFAULT_TIMEZONE}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reservation Settings */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> Reservation Settings
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Seating Capacity:</span>
                    <span className="ml-2">
                      {restaurantDetails.reservation_seating_capacity ?? 50} seats
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Advance Booking:</span>
                    <span className="ml-2">
                      {restaurantDetails.reservation_advance_days ?? 30} days
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Forward:</span>
                    <span className="ml-2">{restaurantDetails.forward_minutes} minutes</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Backward:</span>
                    <span className="ml-2">{restaurantDetails.backward_minutes} minutes</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Credit Card:</span>
                    <Badge
                      className="ml-2"
                      variant={
                        restaurantDetails.is_credit_card_required_for_reservation
                          ? "default"
                          : "secondary"
                      }
                    >
                      {restaurantDetails.is_credit_card_required_for_reservation
                        ? "Required"
                        : "Not Required"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Escalation Settings */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" /> Escalation Settings
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Forward Escalations:</span>
                    <span className="ml-2">
                      {restaurantDetails.forward_escalations ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Escalation Phone:</span>
                    <span className="ml-2">
                      {restaurantDetails.escalation_phone_number || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Capabilities Section */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Agent Capabilities
                </h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${restaurantDetails.features?.orders_enabled !== false ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span
                      className={
                        restaurantDetails.features?.orders_enabled !== false
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      Orders
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${restaurantDetails.features?.reservations_enabled !== false ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span
                      className={
                        restaurantDetails.features?.reservations_enabled !== false
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      Reservations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${restaurantDetails.features?.faqs_enabled !== false ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <span
                      className={
                        restaurantDetails.features?.faqs_enabled !== false
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      FAQs
                    </span>
                  </div>
                </div>
              </div>

              {/* Integration Details */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plug className="h-4 w-4" /> Integration Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Twilio:</span>
                    <pre className="p-2 bg-background rounded border text-xs font-mono overflow-x-auto">
                      {formatJson(restaurantDetails.twilio_details)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Deepgram:</span>
                    <pre className="p-2 bg-background rounded border text-xs font-mono overflow-x-auto">
                      {formatJson(restaurantDetails.deepgram_details)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">OpenTable:</span>
                    <pre className="p-2 bg-background rounded border text-xs font-mono overflow-x-auto">
                      {formatJson(restaurantDetails.open_table_details)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Created: {formatLocalDateTime(restaurantDetails.created_at)}</span>
                <span>Updated: {formatLocalDateTime(restaurantDetails.updated_at)}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Restaurant Statistics
            </DialogTitle>
            <DialogDescription>Aggregated data for {selectedRestaurant?.name}</DialogDescription>
          </DialogHeader>
          {isLoadingStats ? (
            <div className="space-y-3 py-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : restaurantStats ? (
            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  <span className="text-sm font-medium">Menu Items</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {restaurantStats.total_menu_items}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {restaurantStats.available_menu_items} available •{" "}
                  {restaurantStats.special_items_count} special
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">FAQs</span>
                </div>
                <p className="text-3xl font-bold text-green-700">{restaurantStats.total_faqs}</p>
                <p className="text-xs text-green-600 mt-1">Total questions</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">Administrators</span>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {restaurantStats.total_administrators}
                </p>
                <p className="text-xs text-purple-600 mt-1">Staff members</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <PhoneCall className="h-5 w-5" />
                  <span className="text-sm font-medium">Calls</span>
                </div>
                <p className="text-3xl font-bold text-orange-700">{restaurantStats.total_calls}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {restaurantStats.total_minute_usage.toFixed(1)} min used
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Restaurant
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{selectedRestaurant?.name}"</strong>? This
              action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Restaurant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Restaurants;
