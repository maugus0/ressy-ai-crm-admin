import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ShoppingBag,
  Clock,
  Search,
  Filter,
  X,
  Eye,
  Pencil,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  Truck,
  UtensilsCrossed,
  RotateCcw,
  Phone,
  Mail,
  User,
  Building2,
  AlertTriangle,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getRestaurants } from "@/services/restaurants";
import {
  getOrders,
  getOrderDetails,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  restoreOrder,
} from "@/services/orders";
import { getMenuItems, getMenuCategories } from "@/services/menu";
import type {
  Restaurant,
  DashboardOrder,
  DashboardOrderStatus,
  DashboardOrderCreateRequest,
  DashboardOrderUpdateRequest,
  DashboardOrderCreateItem,
  DashboardOrderCustomization,
  MenuItem,
  MenuCategoriesResponse,
} from "@/types/api.types";

// ============================================================================
// Helper Functions
// ============================================================================

const formatDateTime = (dateTime: string) => {
  // Format in Vancouver timezone
  const date = new Date(dateTime);
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getStatusStyles = (status: DashboardOrderStatus): string => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "confirmed":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "preparing":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800";
    case "ready":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800";
  }
};

const getStatusIcon = (status: DashboardOrderStatus) => {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "confirmed":
      return <CheckCircle className="h-3 w-3" />;
    case "preparing":
      return <UtensilsCrossed className="h-3 w-3" />;
    case "ready":
      return <Package className="h-3 w-3" />;
    case "completed":
      return <CheckCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const STATUS_OPTIONS: DashboardOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

// ============================================================================
// Types
// ============================================================================

interface OrderItemFormData {
  item_id?: number;
  name: string;
  quantity: number;
  price: number;
  instructions: string;
}

interface OrderFormData {
  items: OrderItemFormData[];
  total_amount: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery: boolean;
  table_number: string;
  notes: string;
  status: DashboardOrderStatus;
}

const defaultItemFormData: OrderItemFormData = {
  name: "",
  quantity: 1,
  price: 0,
  instructions: "",
};

const defaultFormData: OrderFormData = {
  items: [{ ...defaultItemFormData }],
  total_amount: "0",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  delivery: false,
  table_number: "",
  notes: "",
  status: "pending",
};

// ============================================================================
// Component
// ============================================================================

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.permissions?.includes("*");

  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Prevent infinite loop
  const hasAutoSelectedRestaurant = useRef(false);

  // Orders state
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<DashboardOrder | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Menu state for order creation
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategoriesResponse>({ categories: {} });
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>("all");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants({ limit: 100 });
      setRestaurants(data.items);
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
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!selectedRestaurantId) return;

    try {
      setIsLoadingOrders(true);
      setError(null);

      const params: {
        status?: DashboardOrderStatus;
        start_date?: string;
        end_date?: string;
        include_deleted: boolean;
        limit: number;
        offset: number;
      } = {
        include_deleted: includeDeleted,
        limit,
        offset,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter as DashboardOrderStatus;
      }
      if (startDate) {
        params.start_date = new Date(startDate).toISOString();
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.end_date = end.toISOString();
      }

      const data = await getOrders(selectedRestaurantId, params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
      setOrders([]);
      setTotal(0);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [selectedRestaurantId, statusFilter, startDate, endDate, includeDeleted, limit, offset]);

  const fetchMenu = useCallback(async () => {
    if (!selectedRestaurantId) return;

    try {
      setIsLoadingMenu(true);
      // Fetch menu items with pagination (API max is 100)
      const allMenuItems: MenuItem[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const menuData = await getMenuItems(selectedRestaurantId, {
          page,
          limit: 100,
          is_available: true,
        });
        allMenuItems.push(...menuData.items);
        hasMore = menuData.items.length === 100;
        page++;
        // Safety limit to prevent infinite loops
        if (page > 10) break;
      }

      const categoriesData = await getMenuCategories(selectedRestaurantId);
      setMenuItems(allMenuItems);
      setMenuCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load menu:", err);
      toast.error("Failed to load menu items");
    } finally {
      setIsLoadingMenu(false);
    }
  }, [selectedRestaurantId]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchOrders();
    }
  }, [fetchOrders, selectedRestaurantId]);

  useEffect(() => {
    setOffset(0);
  }, [selectedRestaurantId, statusFilter, startDate, endDate, includeDeleted]);

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
    setIncludeDeleted(false);
    setOffset(0);
    setError(null);
  };

  const calculateTotal = (items: OrderItemFormData[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setSelectedMenuCategory("all");
    setMenuSearchQuery("");
    setIsCreateDialogOpen(true);
    fetchMenu();
  };

  const openEditDialog = (order: DashboardOrder) => {
    setSelectedOrderForEdit(order);
    const items: OrderItemFormData[] = order.order_details.map((item) => ({
      item_id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      instructions: item.instructions || "",
    }));
    if (items.length === 0) {
      items.push({ ...defaultItemFormData });
    }
    setFormData({
      items,
      total_amount: String(order.total_amount),
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      customer_email: order.customer_email || "",
      delivery: order.customization?.delivery || false,
      table_number: order.customization?.table_number?.toString() || "",
      notes: order.customization?.notes || "",
      status: order.status,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDetailsDialog = async (order: DashboardOrder) => {
    try {
      setIsLoadingDetails(true);
      setIsDetailsDialogOpen(true);
      const details = await getOrderDetails(order.id);
      setSelectedOrder(details);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load order details");
      setIsDetailsDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openCancelDialog = (order: DashboardOrder) => {
    setSelectedOrder(order);
    setIsCancelDialogOpen(true);
  };

  const openDeleteDialog = (order: DashboardOrder) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const openRestoreDialog = (order: DashboardOrder) => {
    setSelectedOrder(order);
    setIsRestoreDialogOpen(true);
  };

  // Form item management
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...defaultItemFormData }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    const total = calculateTotal(newItems);
    setFormData({
      ...formData,
      items: newItems,
      total_amount: total.toFixed(2),
    });
  };

  const updateItem = (index: number, field: keyof OrderItemFormData, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const total = calculateTotal(newItems);
    setFormData({
      ...formData,
      items: newItems,
      total_amount: total.toFixed(2),
    });
  };

  // Add menu item to order
  const addMenuItemToOrder = (menuItem: MenuItem) => {
    const newItem: OrderItemFormData = {
      item_id: menuItem.id,
      name: menuItem.item_name,
      quantity: 1,
      price: parseFloat(menuItem.price),
      instructions: "",
    };
    // Check if item already exists in order
    const existingIndex = formData.items.findIndex(
      (item) => item.item_id === menuItem.id && !item.instructions
    );
    if (existingIndex >= 0) {
      // Increment quantity
      const newItems = [...formData.items];
      newItems[existingIndex].quantity += 1;
      const total = calculateTotal(newItems);
      setFormData({
        ...formData,
        items: newItems,
        total_amount: total.toFixed(2),
      });
      toast.success(`Added another ${menuItem.item_name}`);
    } else {
      // Add new item (replace empty first item if exists)
      let newItems: OrderItemFormData[];
      if (formData.items.length === 1 && !formData.items[0].name) {
        newItems = [newItem];
      } else {
        newItems = [...formData.items, newItem];
      }
      const total = calculateTotal(newItems);
      setFormData({
        ...formData,
        items: newItems,
        total_amount: total.toFixed(2),
      });
      toast.success(`Added ${menuItem.item_name} to order`);
    }
  };

  // Filter menu items based on category and search
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedMenuCategory === "all" || item.category === selectedMenuCategory;
    const matchesSearch =
      !menuSearchQuery ||
      item.item_name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      item.item_desc?.toLowerCase().includes(menuSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group filtered menu items by category
  const groupedMenuItems = filteredMenuItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  // Form validation
  const validateForm = (opts?: { requireCustomerPhone?: boolean }): boolean => {
    const errors: Record<string, string> = {};

    // Validate items
    if (formData.items.length === 0) {
      errors.items = "At least one item is required";
    } else {
      formData.items.forEach((item, index) => {
        if (!item.name.trim()) {
          errors[`item_${index}_name`] = "Item name is required";
        }
        if (item.quantity < 1) {
          errors[`item_${index}_quantity`] = "Quantity must be at least 1";
        }
        if (item.price < 0) {
          errors[`item_${index}_price`] = "Price cannot be negative";
        }
      });
    }

    // Validate total
    const total = parseFloat(formData.total_amount);
    if (isNaN(total) || total < 0) {
      errors.total_amount = "Invalid total amount";
    }

    // Validate email if provided
    if (formData.customer_email && formData.customer_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customer_email.trim())) {
        errors.customer_email = "Invalid email address";
      }
    }

    // Customer phone (required for create; backend needs it to associate/resolve user)
    if (opts?.requireCustomerPhone) {
      if (!formData.customer_phone.trim()) {
        errors.customer_phone = "Customer phone number is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!selectedRestaurantId) return;
    if (!validateForm({ requireCustomerPhone: true })) return;

    try {
      setIsSubmitting(true);
      const orderDetails: DashboardOrderCreateItem[] = formData.items.map((item) => ({
        item_id: item.item_id,
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price,
        ...(item.instructions.trim() ? { instructions: item.instructions.trim() } : {}),
      }));

      const customization: DashboardOrderCustomization = {};
      if (formData.delivery) customization.delivery = true;
      {
        const tableNumber = Number(formData.table_number.trim());
        if (Number.isInteger(tableNumber) && tableNumber > 0)
          customization.table_number = tableNumber;
      }
      if (formData.notes.trim()) customization.notes = formData.notes.trim();

      const payload: DashboardOrderCreateRequest = {
        order_details: orderDetails,
        total_amount: parseFloat(formData.total_amount),
        ...(formData.customer_name.trim() ? { customer_name: formData.customer_name.trim() } : {}),
        ...(formData.customer_phone.trim()
          ? { customer_phone: formData.customer_phone.trim() }
          : {}),
        ...(formData.customer_email.trim()
          ? { customer_email: formData.customer_email.trim() }
          : {}),
        ...(Object.keys(customization).length > 0 ? { customization } : {}),
        status: formData.status,
      };

      await createOrder(selectedRestaurantId, payload);
      toast.success("Order created successfully");
      setIsCreateDialogOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrderForEdit) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const orderDetails: DashboardOrderCreateItem[] = formData.items.map((item) => ({
        item_id: item.item_id,
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price,
        ...(item.instructions.trim() ? { instructions: item.instructions.trim() } : {}),
      }));

      const customization: DashboardOrderCustomization = {};
      if (formData.delivery) customization.delivery = true;
      {
        const tableNumber = Number(formData.table_number.trim());
        if (Number.isInteger(tableNumber) && tableNumber > 0)
          customization.table_number = tableNumber;
      }
      if (formData.notes.trim()) customization.notes = formData.notes.trim();

      const payload: DashboardOrderUpdateRequest = {
        status: formData.status,
        total_amount: parseFloat(formData.total_amount),
        order_details: orderDetails,
        ...(Object.keys(customization).length > 0 ? { customization } : {}),
      };

      await updateOrder(selectedOrderForEdit.id, payload);
      toast.success("Order updated successfully");
      setIsEditDialogOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, status: DashboardOrderStatus) => {
    try {
      await updateOrderStatus(orderId, { status });
      toast.success(`Order status updated to '${status}'`);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;

    try {
      setIsSubmitting(true);
      await cancelOrder(selectedOrder.id);
      toast.success("Order cancelled successfully");
      setIsCancelDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      setIsSubmitting(true);
      await deleteOrder(selectedOrder.id);
      toast.success("Order deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedOrder) return;

    try {
      setIsSubmitting(true);
      await restoreOrder(selectedOrder.id);
      toast.success("Order restored successfully");
      setIsRestoreDialogOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasActiveFilters = statusFilter !== "all" || startDate || endDate || includeDeleted;

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = (isEditMode: boolean = false) => (
    <div className="space-y-6">
      {/* Menu Browser - Only show for create mode */}
      {!isEditMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Select from Menu
            </Label>
            {isLoadingMenu && (
              <span className="text-xs text-muted-foreground">Loading menu...</span>
            )}
          </div>

          {menuItems.length > 0 && (
            <>
              {/* Menu Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    className="pl-9"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedMenuCategory} onValueChange={setSelectedMenuCategory}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(menuCategories.categories || {}).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Menu Items Grid */}
              <div className="border rounded-lg bg-muted/20">
                <ScrollArea className="h-[200px] w-full">
                  <div className="p-3 space-y-3">
                    {Object.entries(groupedMenuItems).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {items.map((menuItem) => (
                            <div
                              key={menuItem.id}
                              className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-accent/50 cursor-pointer transition-colors group"
                              onClick={() => addMenuItemToOrder(menuItem)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{menuItem.item_name}</p>
                                {menuItem.item_desc && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {menuItem.item_desc}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  ${parseFloat(menuItem.price).toFixed(2)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-800/50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addMenuItemToOrder(menuItem);
                                  }}
                                >
                                  <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {filteredMenuItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No menu items found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {!isLoadingMenu && menuItems.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/20">
              <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No menu items available</p>
              <p className="text-xs">You can still add custom items below</p>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            {isEditMode ? "Order Items *" : "Order Items"}
            {formData.items.length > 0 && formData.items[0].name && (
              <Badge variant="secondary" className="ml-2">
                {formData.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
            )}
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Custom Item
          </Button>
        </div>
        {formErrors.items && <p className="text-sm text-destructive">{formErrors.items}</p>}

        <div className="border rounded-lg bg-muted/20">
          <ScrollArea className="h-[300px] w-full">
            <div className="p-4 space-y-3">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg space-y-3 bg-background ${
                    item.item_id
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {item.item_id ? (
                          <span className="flex items-center gap-1.5">
                            <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                        ) : (
                          `Item ${index + 1}`
                        )}
                      </span>
                      {item.item_id && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          From Menu
                        </Badge>
                      )}
                    </div>
                    {(formData.items.length > 1 || item.name) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {!item.item_id && (
                      <div className="col-span-2 sm:col-span-4 space-y-1.5">
                        <Label className="text-xs font-medium">Item Name *</Label>
                        <Input
                          placeholder="Custom item name"
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          className={`h-9 ${formErrors[`item_${index}_name`] ? "border-destructive" : ""}`}
                        />
                        {formErrors[`item_${index}_name`] && (
                          <p className="text-xs text-destructive">
                            {formErrors[`item_${index}_name`]}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                        className={`h-9 text-center ${formErrors[`item_${index}_quantity`] ? "border-destructive" : ""}`}
                      />
                      {formErrors[`item_${index}_quantity`] && (
                        <p className="text-xs text-destructive">
                          {formErrors[`item_${index}_quantity`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", parseFloat(e.target.value) || 0)
                        }
                        className={`h-9 ${formErrors[`item_${index}_price`] ? "border-destructive" : ""}`}
                        disabled={!!item.item_id}
                      />
                      {formErrors[`item_${index}_price`] && (
                        <p className="text-xs text-destructive">
                          {formErrors[`item_${index}_price`]}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium">Instructions</Label>
                      <Input
                        placeholder="Special requests..."
                        value={item.instructions}
                        onChange={(e) => updateItem(index, "instructions", e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {formData.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">
                    Select items from the menu above or add custom items
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
          <span className="font-medium text-emerald-700 dark:text-emerald-300">Total Amount:</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(parseFloat(formData.total_amount) || 0)}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Customer Information</Label>
        {isEditMode && (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            Customer information cannot be modified after order creation. View the order details to
            see customer information.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Name</Label>
            <Input
              id="customer_name"
              placeholder="John Smith"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              disabled={isEditMode}
              className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_phone">
              Phone
              {!isEditMode && (
                <>
                  {" "}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only"> (required)</span>
                </>
              )}
            </Label>
            <PhoneInput
              id="customer_phone"
              placeholder="1234567890"
              value={formData.customer_phone}
              onChange={(value) => {
                setFormData({ ...formData, customer_phone: value });
                if (formErrors.customer_phone) setFormErrors({ ...formErrors, customer_phone: "" });
              }}
              error={!!formErrors.customer_phone}
              disabled={isEditMode}
            />
            {formErrors.customer_phone && (
              <p className="text-sm text-destructive">{formErrors.customer_phone}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer_email">Email</Label>
          <Input
            id="customer_email"
            type="email"
            placeholder="john@example.com"
            value={formData.customer_email}
            onChange={(e) => {
              setFormData({ ...formData, customer_email: e.target.value });
              if (formErrors.customer_email) setFormErrors({ ...formErrors, customer_email: "" });
            }}
            className={`${formErrors.customer_email ? "border-destructive" : ""} ${isEditMode ? "bg-muted cursor-not-allowed" : ""}`}
            disabled={isEditMode}
          />
          {formErrors.customer_email && (
            <p className="text-sm text-destructive">{formErrors.customer_email}</p>
          )}
        </div>
      </div>

      {/* Order Options */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Order Options</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="delivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery
              </Label>
            </div>
            <Switch
              id="delivery"
              checked={formData.delivery}
              onCheckedChange={(checked) => setFormData({ ...formData, delivery: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table_number">Table Number</Label>
            <Input
              id="table_number"
              type="number"
              min="1"
              placeholder="5"
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="Ring doorbell twice, dietary restrictions..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as DashboardOrderStatus })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          title="Orders"
          description="Manage orders across all restaurants"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4 p-4 sm:p-6">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Orders</CardTitle>
                  {total > 0 && (
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {total} total
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Restaurant selector */}
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

                  {/* Create Order */}
                  <Button
                    onClick={openCreateDialog}
                    disabled={!selectedRestaurantId}
                    aria-label="Create Order"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>New Order</span>
                  </Button>

                  {/* Refresh */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchOrders}
                    disabled={isLoadingOrders || !selectedRestaurantId}
                    className="w-full sm:w-10 sm:h-10"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingOrders ? "animate-spin" : ""}`} />
                    <span className="ml-2 sm:hidden">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Status Tabs - Desktop / Dropdown - Mobile */}
              <div className="sm:hidden">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden sm:block">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="flex-wrap w-full justify-start">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                    <TabsTrigger value="preparing">Preparing</TabsTrigger>
                    <TabsTrigger value="ready">Ready</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* More Filters Toggle */}
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 sm:flex-initial"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>

                {/* Include Deleted Toggle */}
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Switch
                    id="include_deleted"
                    checked={includeDeleted}
                    onCheckedChange={setIncludeDeleted}
                  />
                  <Label
                    htmlFor="include_deleted"
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    Show Deleted
                  </Label>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground hover:text-foreground flex-1 sm:flex-initial"
                    aria-label="Clear all filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
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
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
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

              {isLoadingOrders ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto border rounded-lg">
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Order ID</TableHead>
                            <TableHead className="font-semibold">Customer</TableHead>
                            <TableHead className="font-semibold text-center hidden md:table-cell">
                              Items
                            </TableHead>
                            <TableHead className="font-semibold text-right">Total</TableHead>
                            <TableHead className="font-semibold text-center min-w-[110px] whitespace-nowrap">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold hidden lg:table-cell">
                              Created
                            </TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => {
                            const { date, time } = formatDateTime(order.created_at);
                            const isDeleted = !!order.deleted_at;
                            return (
                              <TableRow
                                key={order.id}
                                className={`group hover:bg-muted/30 transition-colors ${
                                  isDeleted ? "opacity-60 bg-red-50/30 dark:bg-red-950/10" : ""
                                }`}
                              >
                                <TableCell className="font-mono text-sm">
                                  <div className="flex items-center gap-2">
                                    #{order.id}
                                    {isDeleted && (
                                      <Badge variant="destructive" className="text-xs">
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Deleted
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="min-w-[140px]">
                                    {order.customer_name ? (
                                      <p className="font-medium flex items-center gap-1">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        {order.customer_name}
                                      </p>
                                    ) : (
                                      <p className="text-muted-foreground italic">No name</p>
                                    )}
                                    {order.customer_phone && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Phone className="h-3 w-3" />
                                        {order.customer_phone}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center hidden md:table-cell">
                                  <Badge variant="outline" className="gap-1">
                                    <Package className="h-3 w-3" />
                                    {order.order_details.length}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                                    {formatCurrency(order.total_amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center min-w-[110px] whitespace-nowrap">
                                  <div className="flex justify-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="h-auto p-0 hover:bg-transparent"
                                          disabled={isDeleted}
                                        >
                                          <span
                                            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer capitalize whitespace-nowrap ${getStatusStyles(order.status)}`}
                                          >
                                            <span className="flex-shrink-0">
                                              {getStatusIcon(order.status)}
                                            </span>
                                            <span className="whitespace-nowrap">
                                              {order.status}
                                            </span>
                                          </span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="center">
                                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {STATUS_OPTIONS.filter((s) => s !== order.status).map(
                                          (status) => (
                                            <DropdownMenuItem
                                              key={status}
                                              onClick={() => handleStatusUpdate(order.id, status)}
                                              className="capitalize"
                                            >
                                              {getStatusIcon(status)}
                                              <span className="ml-2">{status}</span>
                                            </DropdownMenuItem>
                                          )
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm">{date}</span>
                                    <span className="text-xs text-muted-foreground">{time}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openDetailsDialog(order)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        {!isDeleted && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => openEditDialog(order)}
                                              disabled={order.status === "cancelled"}
                                            >
                                              <Pencil className="h-4 w-4 mr-2" />
                                              Edit Order
                                            </DropdownMenuItem>
                                            {order.status !== "cancelled" &&
                                              order.status !== "completed" && (
                                                <DropdownMenuItem
                                                  onClick={() => openCancelDialog(order)}
                                                  className="text-amber-600"
                                                >
                                                  <XCircle className="h-4 w-4 mr-2" />
                                                  Cancel Order
                                                </DropdownMenuItem>
                                              )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => openDeleteDialog(order)}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete Order
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        {isDeleted && (
                                          <DropdownMenuItem
                                            onClick={() => openRestoreDialog(order)}
                                            className="text-green-600"
                                          >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Restore Order
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {orders.map((order) => {
                      const { date, time } = formatDateTime(order.created_at);
                      const isDeleted = !!order.deleted_at;
                      return (
                        <Card
                          key={order.id}
                          className={`p-4 ${isDeleted ? "opacity-60 bg-red-50/30 dark:bg-red-950/10" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm font-semibold">#{order.id}</span>
                                {isDeleted && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Deleted
                                  </Badge>
                                )}
                              </div>
                              {order.customer_name ? (
                                <p className="font-medium flex items-center gap-1 mb-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  {order.customer_name}
                                </p>
                              ) : (
                                <p className="text-muted-foreground italic text-sm mb-1">No name</p>
                              )}
                              {order.customer_phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                  <Phone className="h-3 w-3" />
                                  {order.customer_phone}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="gap-1 text-xs">
                                  <Package className="h-3 w-3" />
                                  {order.order_details.length} items
                                </Badge>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 hover:bg-transparent"
                                  disabled={isDeleted}
                                >
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border cursor-pointer capitalize whitespace-nowrap ${getStatusStyles(order.status)}`}
                                  >
                                    <span className="flex-shrink-0">
                                      {getStatusIcon(order.status)}
                                    </span>
                                    <span className="whitespace-nowrap">{order.status}</span>
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STATUS_OPTIONS.filter((s) => s !== order.status).map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => handleStatusUpdate(order.id, status)}
                                    className="capitalize"
                                  >
                                    {getStatusIcon(status)}
                                    <span className="ml-2">{status}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => openDetailsDialog(order)}
                              >
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!isDeleted && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => openEditDialog(order)}
                                        disabled={order.status === "cancelled"}
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Order
                                      </DropdownMenuItem>
                                      {order.status !== "cancelled" &&
                                        order.status !== "completed" && (
                                          <DropdownMenuItem
                                            onClick={() => openCancelDialog(order)}
                                            className="text-amber-600"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancel Order
                                          </DropdownMenuItem>
                                        )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog(order)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Order
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {isDeleted && (
                                    <DropdownMenuItem
                                      onClick={() => openRestoreDialog(order)}
                                      className="text-green-600"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Restore Order
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            {date} {time}
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Showing {orders.length > 0 ? offset + 1 : 0} to{" "}
                        {Math.min(offset + orders.length, total)} of {total} orders
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset((o) => Math.max(0, o - limit))}
                          disabled={offset === 0 || isLoadingOrders}
                          aria-label="Previous page"
                          className="flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOffset((o) => o + limit)}
                          disabled={offset + limit >= total || isLoadingOrders}
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

              {!isLoadingOrders && !error && orders.length === 0 && selectedRestaurantId && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold mb-2">No orders found</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "Create your first order for this restaurant."}
                  </p>
                  {!hasActiveFilters && (
                    <Button onClick={openCreateDialog} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Order
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}

              {!selectedRestaurantId && !isLoadingRestaurants && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Select a Restaurant</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Please select a restaurant from the dropdown above to view its orders.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
            <DialogDescription>Create a new order for this restaurant</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update order #{selectedOrderForEdit?.id}</DialogDescription>
          </DialogHeader>
          {renderForm(true)}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ShoppingBag className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Order #${selectedOrder.id}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              {/* Status & Deleted Badge */}
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${getStatusStyles(selectedOrder.status)}`}
                >
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status}
                </span>
                {selectedOrder.deleted_at && (
                  <Badge variant="destructive" className="gap-1 text-sm px-3 py-1">
                    <Trash2 className="h-3 w-3" />
                    Deleted
                  </Badge>
                )}
              </div>

              {/* Customer Info */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-sm font-medium mb-3 block">Customer Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {selectedOrder.customer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedOrder.customer_phone || "N/A"}
                    </p>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedOrder.customer_email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <Label className="font-medium">
                    Order Items ({selectedOrder.order_details.length})
                  </Label>
                </div>
                <div className="p-4 space-y-3">
                  {selectedOrder.order_details.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.instructions && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <StickyNote className="h-3 w-3" />
                            {item.instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">x{item.quantity}</p>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t font-bold">
                    <span>Total</span>
                    <span className="text-lg text-green-600">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customization */}
              {selectedOrder.customization &&
                Object.keys(selectedOrder.customization).length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Label className="text-sm font-medium mb-3 block">Order Options</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {selectedOrder.customization.delivery !== undefined && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>Delivery:</span>
                          <span className="font-medium">
                            {selectedOrder.customization.delivery ? "Yes" : "No"}
                          </span>
                        </div>
                      )}
                      {selectedOrder.customization.table_number && (
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                          <span>Table:</span>
                          <span className="font-medium">
                            {selectedOrder.customization.table_number}
                          </span>
                        </div>
                      )}
                      {selectedOrder.customization.notes && (
                        <div className="col-span-1 sm:col-span-2">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="font-medium">{selectedOrder.customization.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Created</Label>
                  <p>
                    {formatDateTime(selectedOrder.created_at).date}{" "}
                    {formatDateTime(selectedOrder.created_at).time}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Updated</Label>
                  <p>
                    {formatDateTime(selectedOrder.updated_at).date}{" "}
                    {formatDateTime(selectedOrder.updated_at).time}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {selectedOrder && !selectedOrder.deleted_at && selectedOrder.status !== "cancelled" && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedOrder);
                }}
                className="w-full sm:w-auto"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel Order #{selectedOrder?.id}? This will change the
              status to "cancelled".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Order #{selectedOrder?.id}? The order will be
              soft-deleted and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore Order #{selectedOrder?.id}? The order will become
              visible again and can be processed normally.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Restoring..." : "Restore Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
