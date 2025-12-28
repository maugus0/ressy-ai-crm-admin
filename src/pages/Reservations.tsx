import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Search,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  X,
  RefreshCw,
  History,
  ArrowRight,
  User,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSSE } from "@/contexts/SSEContext";
import { getRestaurants } from "@/services/restaurants";
import {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  finalizeReservation,
  cancelReservation,
} from "@/services/reservations";
import type {
  Restaurant,
  Reservation,
  ReservationWithHistory,
  ReservationCreateRequest,
  ReservationUpdateRequest,
  ReservationParams,
} from "@/types/api.types";
import {
  vancouverDateTimeToISO,
  isoToVancouverDateTime,
  formatVancouverDateTime,
  isWithinOpeningHours,
  getTimeFromDateTime,
} from "@/lib/utils/timezone";

// ============================================================================
// Types
// ============================================================================

interface ReservationFormData {
  date_time: string;
  party_size: string;
  name: string;
  phone_number: string;
  email_address: string;
  special_request: string;
  notes: string;
  status?: Reservation["status"];
}

const defaultFormData: ReservationFormData = {
  date_time: "",
  party_size: "2",
  name: "",
  phone_number: "",
  email_address: "",
  special_request: "",
  notes: "",
};

// ============================================================================
// Component
// ============================================================================

/**
 * Reservations Management Page
 * Admin-only dashboard for managing restaurant reservations.
 * Backend RBAC: Admins can access all restaurants; access validated via JWT token.
 */
const Reservations = () => {
  const { user } = useAuth();
  const { events } = useSSE();
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("*");

  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Debounce search query
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent infinite loop in fetchRestaurants
  const hasAutoSelectedRestaurant = useRef(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<
    Reservation | ReservationWithHistory | null
  >(null);
  const [formData, setFormData] = useState<ReservationFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data.items);
      // Auto-select first restaurant if none selected (only once)
      // Use functional update to avoid dependency on selectedRestaurantId
      setSelectedRestaurantId((currentId) => {
        if (!currentId && data.items.length > 0 && !hasAutoSelectedRestaurant.current) {
          hasAutoSelectedRestaurant.current = true;
          return data.items[0].id;
        }
        return currentId;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoadingRestaurants(false);
    }
    // Removed selectedRestaurantId from deps to prevent infinite loop
    // Ref (hasAutoSelectedRestaurant) ensures auto-selection happens only once
    // Using functional update pattern to access current selectedRestaurantId without dependency
  }, []);

  const fetchReservations = useCallback(async () => {
    if (!selectedRestaurantId) return;

    try {
      setIsLoadingReservations(true);
      setError(null);

      const params: ReservationParams = {
        // When searching, fetch more results (up to 1000) to enable client-side filtering
        // Backend doesn't support search parameter, so we need all data for client-side search
        limit: debouncedSearchQuery.trim() ? 1000 : limit,
        offset: debouncedSearchQuery.trim() ? 0 : offset,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter as ReservationParams["status"];
      }
      if (startDate) {
        // Ensure start date is set to the start of the day in Vancouver timezone
        // Convert date string (YYYY-MM-DD) to datetime-local format, then to ISO
        const startDateTimeLocal = `${startDate}T00:00`;
        params.start_date = vancouverDateTimeToISO(startDateTimeLocal);
      }
      if (endDate) {
        // Ensure end date includes end of day in Vancouver timezone
        const endDateTimeLocal = `${endDate}T23:59`;
        params.end_date = vancouverDateTimeToISO(endDateTimeLocal);
      }

      const data = await getReservations(selectedRestaurantId, params);
      let filteredReservations = data.reservations || [];
      let filteredTotal = data.total || 0;

      // Apply client-side search filter (backend doesn't support search)
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase().trim();
        filteredReservations = filteredReservations.filter((reservation) => {
          return (
            reservation.name.toLowerCase().includes(query) ||
            reservation.phone_number.includes(query) ||
            reservation.email?.toLowerCase().includes(query) ||
            reservation.confirmation_number.toLowerCase().includes(query)
          );
        });
        // Update total to reflect filtered results
        filteredTotal = filteredReservations.length;

        // Apply pagination to client-side filtered results
        const startIdx = offset;
        const endIdx = offset + limit;
        filteredReservations = filteredReservations.slice(startIdx, endIdx);
      }

      setReservations(filteredReservations);
      setTotal(filteredTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reservations");
      setReservations([]);
      setTotal(0);
    } finally {
      setIsLoadingReservations(false);
    }
  }, [selectedRestaurantId, statusFilter, startDate, endDate, debouncedSearchQuery, limit, offset]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId) {
      setOffset(0);
    }
  }, [selectedRestaurantId]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setOffset(0); // Reset to first page on search
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchReservations();
    }
  }, [fetchReservations, selectedRestaurantId]);

  // Track last processed event to avoid duplicate refreshes
  const lastProcessedReservationEventRef = useRef<string | null>(null);

  // Auto-refresh when reservation events arrive from SSE
  useEffect(() => {
    // Find the most recent reservation event for this restaurant
    const reservationEvents = events.filter(
      (e) =>
        e.event_type === "reservation" &&
        (selectedRestaurantId === null || e.restaurant_id === Number(selectedRestaurantId))
    );

    if (
      reservationEvents.length > 0 &&
      reservationEvents[0].id !== lastProcessedReservationEventRef.current
    ) {
      lastProcessedReservationEventRef.current = reservationEvents[0].id;
      // Silently refresh the reservations list
      fetchReservations();
    }
  }, [events, selectedRestaurantId, fetchReservations]);

  // Separate state for date range validation error
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Validate date range
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setDateRangeError("End date must be after start date");
      } else {
        setDateRangeError(null);
      }
    } else {
      setDateRangeError(null);
    }
  }, [startDate, endDate]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setOffset(0);
    setError(null);
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    // API returns date_time in Vancouver time already (e.g., "2025-12-28T19:00:00")
    // Convert to datetime-local format (YYYY-MM-DDTHH:mm) by extracting parts directly
    let dateTimeLocal = "";
    if (reservation.date_time) {
      // The API string is already in Vancouver time, extract date/time parts directly
      // Format: "2025-12-28T19:00:00" -> "2025-12-28T19:00"
      const [datePart, timePart] = reservation.date_time.split("T");
      if (datePart && timePart) {
        // Extract just HH:mm from HH:mm:ss
        const [hour, minute] = timePart.split(":");
        dateTimeLocal = `${datePart}T${hour}:${minute}`;
      }
    }
    setFormData({
      date_time: dateTimeLocal,
      party_size: String(reservation.party_size),
      name: reservation.name,
      phone_number: reservation.phone_number,
      email_address: reservation.email || "",
      special_request: reservation.special_request || "",
      notes: reservation.notes || "",
      status: reservation.status,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = async (reservation: Reservation) => {
    try {
      const details = await getReservation(reservation.id);
      setSelectedReservation(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load reservation details");
    }
  };

  const openFinalizeDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsFinalizeDialogOpen(true);
  };

  const openCancelDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsCancelDialogOpen(true);
  };

  // Form validation
  const validateForm = (isEditMode: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    // Date/time validation
    if (!formData.date_time) {
      errors.date_time = "Date and time are required";
    } else {
      // Parse the datetime-local value
      const [datePart, timePart] = formData.date_time.split("T");
      if (!datePart || !timePart) {
        errors.date_time = "Please enter a valid date and time";
      } else {
        const [year, month, day] = datePart.split("-").map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        // For create mode, don't allow past dates
        // For edit mode, allow past dates (for historical records)
        if (!isEditMode && selectedDate < now) {
          errors.date_time = "Reservation date cannot be in the past";
        }

        // Validate opening hours if restaurant is selected
        if (selectedRestaurantId && !isEditMode) {
          const restaurant = restaurants.find((r) => r.id === selectedRestaurantId);
          if (restaurant?.opening_time && restaurant?.closing_time) {
            const time = getTimeFromDateTime(formData.date_time); // HH:mm format
            if (!isWithinOpeningHours(time, restaurant.opening_time, restaurant.closing_time)) {
              errors.date_time = `Reservation time must be within opening hours (${restaurant.opening_time.slice(0, 5)} - ${restaurant.closing_time.slice(0, 5)})`;
            }
          }
        }
      }
    }

    // Party size validation
    const partySize = parseInt(formData.party_size);
    if (!formData.party_size) {
      errors.party_size = "Party size is required";
    } else if (isNaN(partySize)) {
      errors.party_size = "Please enter a valid number";
    } else if (partySize < 1) {
      errors.party_size = "Party size must be at least 1";
    } else if (partySize > 20) {
      errors.party_size = "Party size cannot exceed 20";
    }

    // Name and phone validation (only for create mode)
    if (!isEditMode) {
      // Name validation
      if (!formData.name.trim()) {
        errors.name = "Name is required";
      } else if (formData.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      } else if (formData.name.trim().length > 100) {
        errors.name = "Name must be less than 100 characters";
      }

      // Phone validation (with country code)
      if (!formData.phone_number.trim()) {
        errors.phone_number = "Phone number is required";
      } else {
        // Remove country code prefix for digit counting
        const phoneWithoutCode = formData.phone_number.replace(/^\+\d{1,3}/, "").replace(/\D/g, "");
        if (phoneWithoutCode.length < 7 || phoneWithoutCode.length > 15) {
          errors.phone_number = "Please enter a valid phone number (7-15 digits)";
        } else if (!/^\+\d{1,3}\d{7,15}$/.test(formData.phone_number.trim())) {
          errors.phone_number = "Please enter a valid phone number format";
        }
      }

      // Email validation (optional)
      if (formData.email_address && formData.email_address.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email_address.trim())) {
          errors.email_address = "Please enter a valid email address";
        }
      }
    }

    // Special request and notes validation (max length)
    if (formData.special_request && formData.special_request.length > 500) {
      errors.special_request = "Special request must be less than 500 characters";
    }

    if (formData.notes && formData.notes.length > 1000) {
      errors.notes = "Notes must be less than 1000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!selectedRestaurantId) return;
    if (!validateForm(false)) return;

    try {
      setIsSubmitting(true);
      // Build payload with proper conditional inclusion
      // Convert Vancouver local time to ISO string
      const payload: ReservationCreateRequest = {
        date_time: vancouverDateTimeToISO(formData.date_time),
        party_size: parseInt(formData.party_size),
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        ...(formData.email_address.trim() ? { email_address: formData.email_address.trim() } : {}),
        ...(formData.special_request.trim()
          ? { special_request: formData.special_request.trim() }
          : {}),
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
      };

      await createReservation(selectedRestaurantId, payload);
      toast.success("Reservation created successfully");
      setIsCreateDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedReservation) return;
    if (!validateForm(true)) return;

    try {
      setIsSubmitting(true);
      // Build payload with proper conditional inclusion
      // Convert Vancouver local time to ISO string
      const payload: ReservationUpdateRequest = {
        date_time: vancouverDateTimeToISO(formData.date_time),
        party_size: parseInt(formData.party_size),
        ...(formData.special_request.trim()
          ? { special_request: formData.special_request.trim() }
          : {}),
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
        ...(formData.status ? { status: formData.status } : {}),
      };

      await updateReservation(selectedReservation.id, payload);
      toast.success("Reservation updated successfully");
      setIsEditDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedReservation) return;

    try {
      setIsSubmitting(true);
      await finalizeReservation(selectedReservation.id);
      toast.success("Reservation finalized successfully");
      setIsFinalizeDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;

    try {
      setIsSubmitting(true);
      await cancelReservation(selectedReservation.id);
      toast.success("Reservation cancelled successfully");
      setIsCancelDialogOpen(false);
      fetchReservations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Helper Components
  // ============================================================================

  const ReservationHistorySection = ({
    reservation,
  }: {
    reservation: Reservation | ReservationWithHistory | null;
  }) => {
    if (!reservation || !("history" in reservation)) {
      return null;
    }

    const reservationWithHistory = reservation as ReservationWithHistory;

    if (!reservationWithHistory.history || reservationWithHistory.history.length === 0) {
      return null;
    }

    return (
      <div className="border rounded-lg mt-4">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <Label className="font-medium">
            Reservation History ({reservationWithHistory.history.length})
          </Label>
        </div>
        <div className="p-4 space-y-3 max-h-[250px] overflow-y-auto">
          {reservationWithHistory.history.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-2 border-b last:border-0">
              <div className="flex-shrink-0 mt-1">{getHistoryActionIcon(entry.action)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.change_summary}</p>
                {entry.action === "status_changed" && entry.previous_value && entry.new_value && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={getStatusColor(entry.previous_value.status as Reservation["status"])}
                      className="capitalize text-xs"
                    >
                      {formatStatusLabel(entry.previous_value.status as Reservation["status"])}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge
                      variant={getStatusColor(entry.new_value.status as Reservation["status"])}
                      className="capitalize text-xs"
                    >
                      {formatStatusLabel(entry.new_value.status as Reservation["status"])}
                    </Badge>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(entry.created_at).date} {formatDateTime(entry.created_at).time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getStatusColor = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "completed":
        return "outline" as const;
      case "cancelled":
        return "destructive" as const;
      case "no_show":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatStatusLabel = (status: Reservation["status"]) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getHistoryActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "status_changed":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "party_size_changed":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "date_time_changed":
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case "guest_info_updated":
        return <User className="h-4 w-4 text-cyan-500" />;
      case "notes_updated":
        return <StickyNote className="h-4 w-4 text-orange-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    // API returns date_time in Vancouver time already (e.g., "2025-12-28T19:00:00")
    // Format it directly without timezone conversion since it's already in Vancouver time
    const [datePart, timePart] = dateTime.split("T");
    if (!datePart || !timePart) {
      return { date: "", time: "" };
    }

    // Parse the date parts
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    // Format date: "Dec 28, 2025"
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dateStr = `${monthNames[month - 1]} ${day}, ${year}`;

    // Format time: "7:00 PM" (12-hour format)
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    const minuteStr = minute.toString().padStart(2, "0");
    const timeStr = `${hour12}:${minuteStr} ${ampm}`;

    return {
      date: dateStr,
      time: timeStr,
    };
  };

  // Reservations are already filtered by search query in fetchReservations
  const filteredReservations = reservations;

  const totalPages = Math.ceil(total / limit);

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = (isEditMode: boolean = false) => (
    <div className="space-y-4">
      {isEditMode && selectedReservation && (
        <>
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Guest Information</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{selectedReservation.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedReservation.phone_number}</p>
              </div>
              {selectedReservation.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedReservation.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as Reservation["status"] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <DateTimePicker
            value={formData.date_time}
            onChange={(value) => {
              setFormData({ ...formData, date_time: value });
              if (formErrors.date_time) setFormErrors({ ...formErrors, date_time: "" });
            }}
            label="Date & Time *"
            error={formErrors.date_time}
            minDate={!isEditMode ? new Date() : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="party_size">Party Size *</Label>
          <Input
            id="party_size"
            type="number"
            min="1"
            max="20"
            value={formData.party_size}
            onChange={(e) => {
              setFormData({ ...formData, party_size: e.target.value });
              if (formErrors.party_size) setFormErrors({ ...formErrors, party_size: "" });
            }}
            className={formErrors.party_size ? "border-destructive" : ""}
          />
          {formErrors.party_size && (
            <p className="text-sm text-destructive">{formErrors.party_size}</p>
          )}
        </div>
      </div>

      {!isEditMode && (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Guest Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              className={formErrors.name ? "border-destructive" : ""}
              maxLength={100}
            />
            {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <PhoneInput
                id="phone_number"
                placeholder="1234567890"
                value={formData.phone_number}
                onChange={(value) => {
                  setFormData({ ...formData, phone_number: value });
                  if (formErrors.phone_number) setFormErrors({ ...formErrors, phone_number: "" });
                }}
                error={!!formErrors.phone_number}
              />
              {formErrors.phone_number && (
                <p className="text-sm text-destructive">{formErrors.phone_number}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_address">Email Address</Label>
              <Input
                id="email_address"
                type="email"
                placeholder="john@example.com"
                value={formData.email_address}
                onChange={(e) => {
                  setFormData({ ...formData, email_address: e.target.value });
                  if (formErrors.email_address) setFormErrors({ ...formErrors, email_address: "" });
                }}
                className={formErrors.email_address ? "border-destructive" : ""}
              />
              {formErrors.email_address && (
                <p className="text-sm text-destructive">{formErrors.email_address}</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="special_request">
          Special Request
          {formData.special_request && (
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.special_request.length}/500)
            </span>
          )}
        </Label>
        <Textarea
          id="special_request"
          placeholder="Window seat preferred, dietary restrictions, etc."
          value={formData.special_request}
          onChange={(e) => {
            setFormData({ ...formData, special_request: e.target.value });
            if (formErrors.special_request) setFormErrors({ ...formErrors, special_request: "" });
          }}
          rows={2}
          maxLength={500}
          className={formErrors.special_request ? "border-destructive" : ""}
        />
        {formErrors.special_request && (
          <p className="text-sm text-destructive">{formErrors.special_request}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Internal Notes
          {formData.notes && (
            <span className="text-xs text-muted-foreground ml-2">
              ({formData.notes.length}/1000)
            </span>
          )}
        </Label>
        <Textarea
          id="notes"
          placeholder="VIP customer, birthday celebration, etc."
          value={formData.notes}
          onChange={(e) => {
            setFormData({ ...formData, notes: e.target.value });
            if (formErrors.notes) setFormErrors({ ...formErrors, notes: "" });
          }}
          rows={2}
          maxLength={1000}
          className={formErrors.notes ? "border-destructive" : ""}
        />
        {formErrors.notes && <p className="text-sm text-destructive">{formErrors.notes}</p>}
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Reservations"
          description="Manage restaurant reservations"
        />
        <main className="flex-1 p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>Reservations</CardTitle>
                  {total > 0 && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {total} total
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  {/* Restaurant selector - required to specify which restaurant's reservations to manage */}
                  {isAdmin && (
                    <Select
                      value={selectedRestaurantId?.toString() || ""}
                      onValueChange={handleRestaurantChange}
                      disabled={isLoadingRestaurants}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Add Reservation */}
                  <Button
                    onClick={openCreateDialog}
                    disabled={!selectedRestaurantId}
                    aria-label="Add Reservation"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Reservation</span>
                    <span className="sm:hidden">Add</span>
                  </Button>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchReservations}
                    disabled={isLoadingReservations || !selectedRestaurantId}
                    className="w-full sm:w-10 sm:h-10"
                    aria-label="Refresh reservations"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingReservations ? "animate-spin" : ""}`}
                    />
                    <span className="ml-2 sm:hidden">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Search and Filter Row */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email, or confirmation number..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Offset reset is handled by debounce effect
                    }}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => {
                        setSearchQuery("");
                        // Debounce effect will handle debouncedSearchQuery update
                      }}
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
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
                  {(statusFilter !== "all" || startDate || endDate || searchQuery) && (
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
                <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setOffset(0);
                      }}
                      max={endDate || undefined}
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setOffset(0);
                      }}
                      min={startDate || undefined}
                    />
                  </div>
                  {dateRangeError && (
                    <div className="w-full">
                      <p className="text-sm text-destructive">{dateRangeError}</p>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {(error || dateRangeError) && (
                <div className="flex items-center gap-3 p-4 mb-4 text-sm bg-destructive/10 border border-destructive/20 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">{error || dateRangeError}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setError(null);
                      setDateRangeError(null);
                    }}
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {isLoadingReservations ? (
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
                            <TableHead className="font-semibold hidden sm:table-cell">ID</TableHead>
                            <TableHead className="font-semibold">Guest</TableHead>
                            <TableHead className="font-semibold text-center hidden md:table-cell">
                              Party
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                              Date & Time
                            </TableHead>
                            <TableHead className="font-semibold hidden sm:table-cell">
                              Confirmation
                            </TableHead>
                            <TableHead className="font-semibold text-center">Status</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReservations.map((reservation) => {
                            const { date, time } = formatDateTime(reservation.date_time);
                            return (
                              <TableRow
                                key={reservation.id}
                                className="group hover:bg-muted/30 transition-colors"
                              >
                                <TableCell className="font-mono text-sm hidden sm:table-cell">
                                  {reservation.id}
                                </TableCell>
                                <TableCell>
                                  <div className="min-w-[140px] sm:min-w-[200px]">
                                    <p className="font-medium text-sm sm:text-base">
                                      {reservation.name}
                                    </p>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {reservation.phone_number}
                                      </p>
                                      {reservation.email && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {reservation.email}
                                        </p>
                                      )}
                                    </div>
                                    {/* Mobile: Show date/time inline */}
                                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                                      <span className="text-xs text-muted-foreground">{date}</span>
                                      <span className="text-xs text-muted-foreground">{time}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center hidden md:table-cell">
                                  <div className="flex items-center justify-center gap-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">{reservation.party_size}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex flex-col gap-1">
                                    <span className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      {date}
                                    </span>
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {time}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs hidden sm:table-cell">
                                  {reservation.confirmation_number}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={getStatusColor(reservation.status)}
                                    className="capitalize"
                                  >
                                    {formatStatusLabel(reservation.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-blue-50 dark:hover:bg-blue-950"
                                          onClick={() => openDetailsDialog(reservation)}
                                        >
                                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>View Details</TooltipContent>
                                    </Tooltip>

                                    {reservation.status === "pending" && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-green-50 dark:hover:bg-green-950"
                                            onClick={() => openFinalizeDialog(reservation)}
                                          >
                                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Finalize Reservation</TooltipContent>
                                      </Tooltip>
                                    )}

                                    {(reservation.status === "pending" ||
                                      reservation.status === "confirmed") && (
                                      <>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-muted"
                                              onClick={() => openEditDialog(reservation)}
                                            >
                                              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit Reservation</TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-destructive/10"
                                              onClick={() => openCancelDialog(reservation)}
                                            >
                                              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Cancel Reservation</TooltipContent>
                                        </Tooltip>
                                      </>
                                    )}
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
                        Showing {filteredReservations.length > 0 ? offset + 1 : 0} to{" "}
                        {Math.min(offset + filteredReservations.length, total)} of {total}{" "}
                        reservation
                        {total !== 1 ? "s" : ""}
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset((p) => Math.max(0, p - limit))}
                          disabled={offset === 0 || isLoadingReservations}
                          aria-label="Previous page"
                          className="flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset((p) => p + limit)}
                          disabled={offset + limit >= total || isLoadingReservations}
                          aria-label="Next page"
                          className="flex-1 sm:flex-initial"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isLoadingReservations &&
                !error &&
                filteredReservations.length === 0 &&
                selectedRestaurantId && (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold mb-2">No reservations found</p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      {searchQuery || statusFilter !== "all" || startDate || endDate
                        ? "Try adjusting your search criteria or filters to see more results."
                        : "Get started by creating your first reservation for this restaurant."}
                    </p>
                    {!searchQuery && statusFilter === "all" && !startDate && !endDate && (
                      <Button onClick={openCreateDialog} size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Reservation
                      </Button>
                    )}
                    {(searchQuery || statusFilter !== "all" || startDate || endDate) && (
                      <Button variant="outline" onClick={handleClearFilters} className="mt-2">
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Reservation</DialogTitle>
            <DialogDescription>Create a new confirmed reservation</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
            <DialogDescription>
              Update reservation details for {selectedReservation?.name}
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>{selectedReservation?.confirmation_number}</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Guest Name</Label>
                  <p className="font-medium">{selectedReservation.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Party Size</Label>
                  <p className="font-medium">{selectedReservation.party_size} guests</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedReservation.phone_number}</p>
                </div>
                {selectedReservation.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedReservation.email}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Date & Time</Label>
                <p className="font-medium">
                  {formatDateTime(selectedReservation.date_time).date} at{" "}
                  {formatDateTime(selectedReservation.date_time).time}
                </p>
              </div>

              {selectedReservation.special_request && (
                <div>
                  <Label className="text-muted-foreground">Special Request</Label>
                  <p className="font-medium">{selectedReservation.special_request}</p>
                </div>
              )}

              {selectedReservation.notes && (
                <div>
                  <Label className="text-muted-foreground">Internal Notes</Label>
                  <p className="font-medium">{selectedReservation.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={getStatusColor(selectedReservation.status)}
                      className="capitalize"
                    >
                      {formatStatusLabel(selectedReservation.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservation Type</Label>
                  <p className="text-sm mt-1">{selectedReservation.reservation_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {formatDateTime(selectedReservation.created_at).date}{" "}
                    {formatDateTime(selectedReservation.created_at).time}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="text-sm">
                    {formatDateTime(selectedReservation.updated_at).date}{" "}
                    {formatDateTime(selectedReservation.updated_at).time}
                  </p>
                </div>
              </div>

              {/* Reservation History */}
              <ReservationHistorySection reservation={selectedReservation} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedReservation &&
              (selectedReservation.status === "pending" ||
                selectedReservation.status === "confirmed") && (
                <Button
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openEditDialog(selectedReservation);
                  }}
                >
                  Edit Reservation
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Dialog */}
      <AlertDialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to finalize this reservation? This will change the status from
              "pending" to "confirmed".
              {selectedReservation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedReservation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(selectedReservation.date_time).date} at{" "}
                    {formatDateTime(selectedReservation.date_time).time}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={isSubmitting}>
              {isSubmitting ? "Finalizing..." : "Finalize"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone and
              will release the time slot.
              {selectedReservation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{selectedReservation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(selectedReservation.date_time).date} at{" "}
                    {formatDateTime(selectedReservation.date_time).time}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Cancel Reservation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reservations;
