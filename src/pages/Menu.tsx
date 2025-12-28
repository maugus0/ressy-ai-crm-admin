import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  StarOff,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Clock,
  Filter,
  X,
  CheckSquare,
  FileText,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getRestaurants } from "@/services/restaurants";
import {
  getMenuItems,
  getMenuItem,
  getMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemSpecial,
  bulkUpdateMenuAvailability,
} from "@/services/menu";
import {
  parseCSVLine,
  sanitizeCSVValue,
  validateCSVFileSize,
  MAX_CSV_FILE_SIZE,
} from "@/lib/utils/csv";
import type {
  Restaurant,
  MenuItem,
  MenuItemCreateRequest,
  MenuCategoriesResponse,
  PaginationInfo,
} from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface MenuFormData {
  item_name: string;
  price: string;
  category: string;
  sub_category: string;
  item_desc: string;
  avg_prep_time: string;
  is_available: boolean;
  is_special: boolean;
}

const defaultFormData: MenuFormData = {
  item_name: "",
  price: "",
  category: "",
  sub_category: "",
  item_desc: "",
  avg_prep_time: "15", // Default prep time of 15 minutes
  is_available: true,
  is_special: false,
};

// ============================================================================
// Component
// ============================================================================

const Menu = () => {
  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<MenuCategoriesResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailable, setFilterAvailable] = useState<boolean | undefined>(undefined);
  const [filterSpecial, setFilterSpecial] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkAvailability, setBulkAvailability] = useState(true);

  // CSV upload state
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsing, setCsvParsing] = useState(false);

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // Fetch Functions
  // ============================================================================

  const fetchRestaurants = useCallback(async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data.items);
      if (data.items.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(data.items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [selectedRestaurantId]);

  const fetchCategories = useCallback(async () => {
    if (!selectedRestaurantId) return;
    try {
      const data = await getMenuCategories(selectedRestaurantId);
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, [selectedRestaurantId]);

  const fetchMenuItems = useCallback(async () => {
    if (!selectedRestaurantId) return;

    try {
      setIsLoadingMenu(true);
      setError(null);
      const data = await getMenuItems(selectedRestaurantId, {
        page: currentPage,
        limit: 20,
        category: selectedCategory || undefined,
        sub_category: selectedSubCategory || undefined,
        is_available: filterAvailable,
        is_special: filterSpecial,
        search: searchQuery || undefined,
      });
      setMenuItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setIsLoadingMenu(false);
    }
  }, [
    selectedRestaurantId,
    currentPage,
    selectedCategory,
    selectedSubCategory,
    filterAvailable,
    filterSpecial,
    searchQuery,
  ]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchCategories();
      setSelectedCategory("");
      setSelectedSubCategory("");
      setCurrentPage(1);
      setSelectedItemIds(new Set());
    }
  }, [selectedRestaurantId, fetchCategories]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (selectedCategory && categories?.categories[selectedCategory]) {
      setAvailableSubCategories(categories.categories[selectedCategory]);
    } else {
      setAvailableSubCategories([]);
    }
    setSelectedSubCategory("");
    // Reset to page 1 when category changes
    setCurrentPage(1);
  }, [selectedCategory, categories]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMenuItems();
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setFilterAvailable(undefined);
    setFilterSpecial(undefined);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Item name validation
    const itemName = formData.item_name.trim();
    if (!itemName) {
      errors.item_name = "Item name is required";
    } else if (itemName.length > 200) {
      errors.item_name = "Item name must be less than 200 characters";
    }

    // Price validation
    const priceStr = formData.price.trim();
    if (!priceStr) {
      errors.price = "Price is required";
    } else {
      const price = parseFloat(priceStr);
      if (isNaN(price)) {
        errors.price = "Please enter a valid price";
      } else if (price < 0) {
        errors.price = "Price cannot be negative";
      } else if (price > 99999.99) {
        errors.price = "Price is too high";
      }
    }

    // Category validation
    const category = formData.category.trim();
    if (!category) {
      errors.category = "Category is required";
    } else if (category.length > 100) {
      errors.category = "Category must be less than 100 characters";
    }

    // Sub-category validation (optional)
    if (formData.sub_category && formData.sub_category.length > 100) {
      errors.sub_category = "Sub-category must be less than 100 characters";
    }

    // Prep time validation (MANDATORY)
    const prepTimeStr = formData.avg_prep_time.trim();
    if (!prepTimeStr) {
      errors.avg_prep_time = "Prep time is required";
    } else {
      const prepTime = parseInt(prepTimeStr);
      if (isNaN(prepTime)) {
        errors.avg_prep_time = "Please enter a valid number";
      } else if (prepTime < 1) {
        errors.avg_prep_time = "Prep time must be at least 1 minute";
      } else if (prepTime > 999) {
        errors.avg_prep_time = "Prep time is too high (max 999 minutes)";
      }
    }

    // Description validation (optional)
    if (formData.item_desc && formData.item_desc.length > 1000) {
      errors.item_desc = "Description must be less than 1000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setFormData({
      item_name: item.item_name || "",
      price: item.price,
      category: item.category,
      sub_category: item.sub_category || "",
      item_desc: item.item_desc || "",
      avg_prep_time: String(item.avg_prep_time),
      is_available: item.is_available,
      is_special: item.is_special,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (item: MenuItem) => {
    try {
      const details = await getMenuItem(item.id);
      setSelectedMenuItem(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load details");
    }
  };

  const handleCreate = async () => {
    if (!selectedRestaurantId) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: MenuItemCreateRequest = {
        item_name: formData.item_name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        ...(formData.sub_category.trim() && { sub_category: formData.sub_category.trim() }),
        ...(formData.item_desc.trim() && { item_desc: formData.item_desc.trim() }),
        avg_prep_time: parseInt(formData.avg_prep_time) || 15, // Mandatory with default
        is_available: formData.is_available,
        is_special: formData.is_special,
      };

      await createMenuItem(selectedRestaurantId, payload);
      toast.success("Menu item created successfully");
      setIsCreateDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenuItem) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateMenuItem(selectedMenuItem.id, {
        item_name: formData.item_name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        ...(formData.sub_category.trim() && { sub_category: formData.sub_category.trim() }),
        ...(formData.item_desc.trim() && { item_desc: formData.item_desc.trim() }),
        avg_prep_time: parseInt(formData.avg_prep_time) || 15, // Mandatory with default
        is_available: formData.is_available,
        is_special: formData.is_special,
      });
      toast.success("Menu item updated successfully");
      setIsEditDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMenuItem) return;

    try {
      setIsSubmitting(true);
      await deleteMenuItem(selectedMenuItem.id);
      toast.success("Menu item deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchMenuItems();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await toggleMenuItemAvailability(item.id, { is_available: !item.is_available });
      toast.success(
        `${item.item_name || "Menu item"} is now ${!item.is_available ? "available" : "unavailable"}`
      );
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update availability");
    }
  };

  const handleToggleSpecial = async (item: MenuItem) => {
    try {
      await toggleMenuItemSpecial(item.id, { is_special: !item.is_special });
      toast.success(
        `${item.item_name || "Menu item"} is ${!item.is_special ? "now a special" : "no longer a special"}`
      );
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update special status");
    }
  };

  // Bulk operations
  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(new Set(menuItems.map((item) => item.id)));
    } else {
      setSelectedItemIds(new Set());
    }
  };

  const handleBulkAvailability = async () => {
    if (!selectedRestaurantId || selectedItemIds.size === 0) return;

    try {
      setIsSubmitting(true);
      const result = await bulkUpdateMenuAvailability(selectedRestaurantId, {
        menu_item_ids: Array.from(selectedItemIds),
        is_available: bulkAvailability,
      });
      toast.success(`Updated availability for ${result.updated_count} item(s)`);
      setIsBulkDialogOpen(false);
      setSelectedItemIds(new Set());
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk update");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Upload Handler
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    // Validate file size
    if (!validateCSVFileSize(file)) {
      toast.error(`File size must be less than ${MAX_CSV_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setCsvFile(file);
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedRestaurantId) return;

    try {
      setCsvParsing(true);
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      if (lines.length === 0) {
        toast.error("CSV file is empty");
        return;
      }

      // Parse CSV - expect format: menu_item_id (first column)
      // Optional header row - skip if first line doesn't look like a number
      let startIndex = 0;
      const firstLine = parseCSVLine(lines[0]);
      if (firstLine.length > 0 && isNaN(Number(sanitizeCSVValue(firstLine[0])))) {
        // First line is likely a header, skip it
        startIndex = 1;
      }

      const menuItemIds: number[] = [];
      const errors: string[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = parseCSVLine(line);
        if (columns.length === 0) continue;

        // Get first column (menu_item_id)
        const idStr = sanitizeCSVValue(columns[0]);
        const id = parseInt(idStr, 10);

        if (isNaN(id)) {
          errors.push(`Line ${i + 1}: Invalid menu item ID "${idStr}"`);
          continue;
        }

        if (id <= 0) {
          errors.push(`Line ${i + 1}: Menu item ID must be positive`);
          continue;
        }

        menuItemIds.push(id);
      }

      if (menuItemIds.length === 0) {
        toast.error("No valid menu item IDs found in CSV file");
        if (errors.length > 0) {
          console.error("CSV parsing errors:", errors);
        }
        return;
      }

      if (errors.length > 0) {
        toast.warning(
          `${errors.length} error(s) found, but processing ${menuItemIds.length} valid ID(s)`
        );
        console.warn("CSV parsing warnings:", errors);
      }

      // Perform bulk update
      setIsSubmitting(true);
      const result = await bulkUpdateMenuAvailability(selectedRestaurantId, {
        menu_item_ids: menuItemIds,
        is_available: bulkAvailability,
      });

      toast.success(`Updated availability for ${result.updated_count} item(s) from CSV`);
      setIsCsvDialogOpen(false);
      setCsvFile(null);
      fetchMenuItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process CSV file");
    } finally {
      setCsvParsing(false);
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getCategoryList = (): string[] => {
    if (!categories?.categories) return [];
    return Object.keys(categories.categories).sort();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input
              id="item_name"
              placeholder="e.g., Margherita Pizza"
              value={formData.item_name}
              onChange={(e) => {
                setFormData({ ...formData, item_name: e.target.value });
                if (formErrors.item_name) setFormErrors({ ...formErrors, item_name: "" });
              }}
              className={formErrors.item_name ? "border-destructive" : ""}
              maxLength={200}
            />
            {formErrors.item_name && (
              <p className="text-sm text-destructive">{formErrors.item_name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="99999.99"
                placeholder="15.99"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: "" });
                }}
                className={formErrors.price ? "border-destructive" : ""}
              />
              {formErrors.price && <p className="text-sm text-destructive">{formErrors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg_prep_time">Prep Time (min) *</Label>
              <Input
                id="avg_prep_time"
                type="number"
                min="1"
                max="999"
                placeholder="15"
                value={formData.avg_prep_time}
                onChange={(e) => {
                  setFormData({ ...formData, avg_prep_time: e.target.value });
                  if (formErrors.avg_prep_time) setFormErrors({ ...formErrors, avg_prep_time: "" });
                }}
                className={formErrors.avg_prep_time ? "border-destructive" : ""}
                required
              />
              {formErrors.avg_prep_time && (
                <p className="text-sm text-destructive">{formErrors.avg_prep_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <div className="space-y-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setFormData({ ...formData, category: "" });
                    } else {
                      setFormData({ ...formData, category: value, sub_category: "" });
                    }
                    if (formErrors.category) setFormErrors({ ...formErrors, category: "" });
                  }}
                >
                  <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select or type new" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryList().map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ New Category</SelectItem>
                  </SelectContent>
                </Select>
                {(formData.category === "" || !getCategoryList().includes(formData.category)) && (
                  <Input
                    placeholder="Type new category..."
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                      if (formErrors.category) setFormErrors({ ...formErrors, category: "" });
                    }}
                    maxLength={100}
                  />
                )}
              </div>
              {formErrors.category && (
                <p className="text-sm text-destructive">{formErrors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub_category">Sub-Category</Label>
              <div className="space-y-2">
                {categories?.categories[formData.category]?.length ? (
                  <Select
                    value={formData.sub_category}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setFormData({ ...formData, sub_category: "" });
                      } else {
                        setFormData({ ...formData, sub_category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type new" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.categories[formData.category].map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">+ New Sub-Category</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {(!categories?.categories[formData.category]?.length ||
                  formData.sub_category === "" ||
                  !categories?.categories[formData.category]?.includes(formData.sub_category)) && (
                  <Input
                    placeholder="Type sub-category (optional)..."
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    maxLength={100}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="details" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="item_desc">Description</Label>
          <Textarea
            id="item_desc"
            placeholder="Describe the menu item..."
            value={formData.item_desc}
            onChange={(e) => {
              setFormData({ ...formData, item_desc: e.target.value });
              if (formErrors.item_desc) setFormErrors({ ...formErrors, item_desc: "" });
            }}
            className={formErrors.item_desc ? "border-destructive" : ""}
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between">
            {formErrors.item_desc ? (
              <p className="text-sm text-destructive">{formErrors.item_desc}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">{formData.item_desc.length}/1000</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label>Available</Label>
            <p className="text-sm text-muted-foreground">Item can be ordered</p>
          </div>
          <Switch
            checked={formData.is_available}
            onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label>Special</Label>
            <p className="text-sm text-muted-foreground">Mark as today's special</p>
          </div>
          <Switch
            checked={formData.is_special}
            onCheckedChange={(checked) => setFormData({ ...formData, is_special: checked })}
          />
        </div>
      </TabsContent>
    </Tabs>
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
          title="Menu Management"
          description="Manage menu items, categories, and specials"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4 p-4 sm:p-6">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Menu Items</CardTitle>
                  {pagination && (
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {pagination.total} items
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Restaurant Selector */}
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

                  {/* Add Menu Item */}
                  <Button
                    onClick={openCreateDialog}
                    disabled={!selectedRestaurantId}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add Item</span>
                  </Button>
                </div>
              </div>

              {/* Search and Filter Row */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Category Filter */}
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] md:w-[160px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getCategoryList().map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sub-Category Filter */}
                  {availableSubCategories.length > 0 && (
                    <Select
                      value={selectedSubCategory || "all"}
                      onValueChange={(v) => setSelectedSubCategory(v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="w-full sm:w-[140px] md:w-[160px]">
                        <SelectValue placeholder="Sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {availableSubCategories.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* More Filters Toggle */}
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-initial"
                  >
                    <Filter className="h-4 w-4 mr-1 sm:mr-0" />
                    <span className="sm:hidden">Filters</span>
                  </Button>

                  {/* Clear Filters */}
                  {(selectedCategory || searchQuery || filterAvailable !== undefined) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="flex-1 sm:flex-initial"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="sm:hidden">Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Availability:</Label>
                    <Select
                      value={filterAvailable === undefined ? "all" : String(filterAvailable)}
                      onValueChange={(v) =>
                        setFilterAvailable(v === "all" ? undefined : v === "true")
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Available</SelectItem>
                        <SelectItem value="false">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Special:</Label>
                    <Select
                      value={filterSpecial === undefined ? "all" : String(filterSpecial)}
                      onValueChange={(v) =>
                        setFilterSpecial(v === "all" ? undefined : v === "true")
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Specials Only</SelectItem>
                        <SelectItem value="false">Non-Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg -mb-10">
                {selectedItemIds.size > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {selectedItemIds.size} item(s) selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBulkAvailability(true);
                          setIsBulkDialogOpen(true);
                        }}
                        className="flex-1 sm:flex-initial"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Set Available
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBulkAvailability(false);
                          setIsBulkDialogOpen(true);
                        }}
                        className="flex-1 sm:flex-initial"
                      >
                        <EyeOff className="h-4 w-4 mr-1" />
                        Set Unavailable
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItemIds(new Set())}
                        className="flex-1 sm:flex-initial"
                      >
                        Clear
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Bulk update via CSV:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkAvailability(true);
                        setIsCsvDialogOpen(true);
                      }}
                      disabled={!selectedRestaurantId}
                      className="flex-1 sm:flex-initial"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload CSV
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              {error && (
                <div className="text-center py-6 px-4 text-sm sm:text-base text-destructive bg-destructive/5 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {isLoadingMenu ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
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
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={
                                  menuItems.length > 0 &&
                                  menuItems.every((item) => selectedItemIds.has(item.id))
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead className="font-semibold">Item</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold text-right">Price</TableHead>
                            <TableHead className="font-semibold text-center hidden lg:table-cell">
                              Prep
                            </TableHead>
                            <TableHead className="font-semibold text-center">Available</TableHead>
                            <TableHead className="font-semibold text-center">Special</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuItems.map((item) => (
                            <TableRow
                              key={item.id}
                              className="group hover:bg-muted/30 transition-colors"
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedItemIds.has(item.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectItem(item.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="min-w-[200px]">
                                  <p className="font-medium text-base">
                                    {item.item_name || "Unnamed Item"}
                                  </p>
                                  {item.item_desc && (
                                    <p className="text-sm text-muted-foreground truncate max-w-[280px]">
                                      {item.item_desc}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="w-fit">
                                    {item.category}
                                  </Badge>
                                  {item.sub_category && (
                                    <span className="text-xs text-muted-foreground">
                                      {item.sub_category}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-primary">${item.price}</span>
                              </TableCell>
                              <TableCell className="text-center hidden lg:table-cell">
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-sm">{item.avg_prep_time}m</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                    item.is_available
                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {item.is_available ? (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" />
                                      <span>Yes</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      <span>No</span>
                                    </>
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="text-center">
                                <button
                                  onClick={() => handleToggleSpecial(item)}
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                    item.is_special
                                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {item.is_special ? (
                                    <>
                                      <Star className="h-3 w-3 mr-1 fill-current" />
                                      Special
                                    </>
                                  ) : (
                                    <>
                                      <StarOff className="h-3 w-3 mr-1" />
                                      Regular
                                    </>
                                  )}
                                </button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openDetailsDialog(item)}
                                      >
                                        <Eye className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleToggleSpecial(item)}
                                      >
                                        {item.is_special ? (
                                          <StarOff className="h-4 w-4 text-orange-500" />
                                        ) : (
                                          <Star className="h-4 w-4 text-orange-500" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {item.is_special ? "Remove Special" : "Make Special"}
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openEditDialog(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => openDeleteDialog(item)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {menuItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Checkbox
                                checked={selectedItemIds.has(item.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectItem(item.id, checked as boolean)
                                }
                                className="flex-shrink-0"
                              />
                              <h3 className="font-semibold text-base truncate">
                                {item.item_name || "Unnamed Item"}
                              </h3>
                            </div>
                            {item.item_desc && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {item.item_desc}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {item.sub_category && (
                                <Badge variant="outline" className="text-xs">
                                  {item.sub_category}
                                </Badge>
                              )}
                              <span className="text-sm font-semibold text-primary">
                                ${item.price}
                              </span>
                              {item.avg_prep_time && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.avg_prep_time}m</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                item.is_available
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {item.is_available ? (
                                <>
                                  <Eye className="h-3 w-3" />
                                  <span>Available</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  <span>Unavailable</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleSpecial(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                item.is_special
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {item.is_special ? (
                                <>
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>Special</span>
                                </>
                              ) : (
                                <>
                                  <StarOff className="h-3 w-3" />
                                  <span>Regular</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDetailsDialog(item)}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                      </p>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                          disabled={currentPage === pagination.pages}
                          className="flex-1 sm:flex-initial"
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isLoadingMenu && !error && menuItems.length === 0 && selectedRestaurantId && (
                <div className="text-center py-12 text-muted-foreground">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No menu items found</p>
                  <p className="text-sm">
                    {searchQuery || selectedCategory
                      ? "Try adjusting your filters"
                      : "Add your first menu item to get started"}
                  </p>
                  {!searchQuery && !selectedCategory && (
                    <Button className="mt-4" onClick={openCreateDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
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
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>Create a new menu item for this restaurant</DialogDescription>
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
            <Button
              onClick={handleCreate}
              disabled={
                isSubmitting || !formData.item_name || !formData.price || !formData.category
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update the menu item details</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                isSubmitting || !formData.item_name || !formData.price || !formData.category
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMenuItem?.item_name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{selectedMenuItem?.item_name}</DialogTitle>
            <DialogDescription>Menu item details</DialogDescription>
          </DialogHeader>
          {selectedMenuItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Category</Label>
                  <p className="font-medium">{selectedMenuItem.category}</p>
                  {selectedMenuItem.sub_category && (
                    <p className="text-sm text-muted-foreground">{selectedMenuItem.sub_category}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Price</Label>
                  <p className="font-medium text-lg">${selectedMenuItem.price}</p>
                </div>
              </div>

              {selectedMenuItem.item_desc && (
                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="text-sm sm:text-base">{selectedMenuItem.item_desc}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Prep Time</Label>
                  <p className="font-medium">{selectedMenuItem.avg_prep_time} minutes</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant={selectedMenuItem.is_available ? "default" : "secondary"}>
                      {selectedMenuItem.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    {selectedMenuItem.is_special && <Badge variant="destructive">Special</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground text-sm">Created</Label>
                  <p className="text-sm">{formatDate(selectedMenuItem.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Updated</Label>
                  <p className="text-sm">{formatDate(selectedMenuItem.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {selectedMenuItem && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedMenuItem);
                }}
                className="w-full sm:w-auto"
              >
                Edit Item
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Availability Dialog */}
      <AlertDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Update Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Set {selectedItemIds.size} item(s) to{" "}
              <span className="font-semibold">
                {bulkAvailability ? "Available" : "Unavailable"}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAvailability}>
              {isSubmitting ? "Updating..." : "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Update via CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file with menu item IDs to bulk update availability. CSV format: one menu
              item ID per line (first column).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                disabled={csvParsing || isSubmitting}
              />
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• CSV format: One menu item ID per line (first column)</p>
                <p>• Optional header row will be automatically skipped</p>
                <p>• Maximum file size: {(MAX_CSV_FILE_SIZE / 1024 / 1024).toFixed(0)}MB</p>
                <p>• Example:</p>
                <pre className="bg-muted p-2 rounded text-xs font-mono">
                  menu_item_id{`\n`}123{`\n`}456{`\n`}789
                </pre>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Set Availability To:</Label>
                <p className="text-sm text-muted-foreground">
                  {bulkAvailability ? "Available" : "Unavailable"}
                </p>
              </div>
              <Switch
                checked={bulkAvailability}
                onCheckedChange={setBulkAvailability}
                disabled={csvParsing || isSubmitting}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCsvDialogOpen(false);
                setCsvFile(null);
              }}
              disabled={csvParsing || isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile || csvParsing || isSubmitting || !selectedRestaurantId}
              className="w-full sm:w-auto"
            >
              {csvParsing || isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Menu;
