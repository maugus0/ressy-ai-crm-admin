import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  HelpCircle,
  Eye,
  Upload,
  X,
  Globe,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { getRestaurants } from "@/services/restaurants";
import { parseCSVLine, validateCSVFileSize, MAX_CSV_FILE_SIZE } from "@/lib/utils/csv";
import { formatLocalDate } from "@/lib/utils/timezone";
import {
  getFAQs,
  getFAQ,
  searchFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  bulkCreateFAQs,
} from "@/services/faq";
import type {
  Restaurant,
  FAQ as FAQType,
  FAQCreateRequest,
  PaginationInfo,
} from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

interface FAQFormData {
  question: string;
  answer: string;
}

interface BulkFAQEntry {
  question: string;
  answer: string;
}

const defaultFormData: FAQFormData = {
  question: "",
  answer: "",
};

// ============================================================================
// Component
// ============================================================================

const FAQ = () => {
  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restaurant state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // FAQs state
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<"id" | null>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Search state
  const [searchMode, setSearchMode] = useState<"restaurant" | "global">("restaurant");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQType | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk create state
  const [bulkEntries, setBulkEntries] = useState<BulkFAQEntry[]>([{ question: "", answer: "" }]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

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

  const fetchFAQs = useCallback(async () => {
    if (searchMode === "restaurant" && !selectedRestaurantId) return;

    try {
      setIsLoadingFAQs(true);
      setError(null);

      let data;
      if (searchMode === "global" && debouncedSearch) {
        // Global search across all restaurants
        data = await searchFAQs({
          page: currentPage,
          limit: 20,
          q: debouncedSearch,
        });
      } else if (selectedRestaurantId) {
        // Restaurant-specific FAQs
        data = await getFAQs(selectedRestaurantId, {
          page: currentPage,
          limit: 20,
          search: debouncedSearch || undefined,
        });
      } else {
        setFaqs([]);
        setPagination(null);
        return;
      }

      setFaqs(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
    } finally {
      setIsLoadingFAQs(false);
    }
  }, [selectedRestaurantId, currentPage, searchMode, debouncedSearch]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId || searchMode === "global") {
      setCurrentPage(1);
    }
  }, [selectedRestaurantId, searchMode]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch((prev) => {
        // Only reset page if search query actually changed
        if (prev !== searchQuery) {
          setCurrentPage(1);
        }
        return searchQuery;
      });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
    setSearchMode("restaurant");
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const handleSearchModeChange = (mode: "restaurant" | "global") => {
    setSearchMode(mode);
    setCurrentPage(1);
    if (mode === "global") {
      setSearchQuery("");
      setDebouncedSearch("");
    }
  };

  // Sort FAQs based on sortColumn and sortDirection
  const sortedFAQs = [...faqs].sort((a, b) => {
    if (!sortColumn) return 0;

    let comparison = 0;
    if (sortColumn === "id") {
      comparison = a.id - b.id;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (column: "id") => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: "id") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Question validation
    const question = formData.question.trim();
    if (!question) {
      errors.question = "Question is required";
    } else if (question.length < 5) {
      errors.question = "Question must be at least 5 characters";
    } else if (question.length > 500) {
      errors.question = "Question must be less than 500 characters";
    }

    // Answer validation
    const answer = formData.answer.trim();
    if (!answer) {
      errors.answer = "Answer is required";
    } else if (answer.length < 5) {
      errors.answer = "Answer must be at least 5 characters";
    } else if (answer.length > 2000) {
      errors.answer = "Answer must be less than 2000 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (faq: FAQType) => {
    setSelectedFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: FAQType) => {
    setSelectedFAQ(faq);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = async (faq: FAQType) => {
    try {
      const details = await getFAQ(faq.id);
      setSelectedFAQ(details);
      setIsDetailsDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load details");
    }
  };

  const openBulkCreateDialog = () => {
    setBulkEntries([{ question: "", answer: "" }]);
    setBulkErrors([]);
    setIsBulkCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!selectedRestaurantId) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload: FAQCreateRequest = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      };

      await createFAQ(selectedRestaurantId, payload);
      toast.success("FAQ created successfully");
      setIsCreateDialogOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFAQ) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await updateFAQ(selectedFAQ.id, {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
      });
      toast.success("FAQ updated successfully");
      setIsEditDialogOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFAQ) return;

    try {
      setIsSubmitting(true);
      await deleteFAQ(selectedFAQ.id);
      toast.success("FAQ deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk create handlers
  const addBulkEntry = () => {
    setBulkEntries([...bulkEntries, { question: "", answer: "" }]);
  };

  const removeBulkEntry = (index: number) => {
    if (bulkEntries.length > 1) {
      setBulkEntries(bulkEntries.filter((_, i) => i !== index));
    }
  };

  const updateBulkEntry = (index: number, field: keyof BulkFAQEntry, value: string) => {
    const updated = [...bulkEntries];
    updated[index][field] = value;
    setBulkEntries(updated);
  };

  const validateBulkEntries = (): boolean => {
    const errors: string[] = [];
    bulkEntries.forEach((entry, index) => {
      const question = entry.question.trim();
      const answer = entry.answer.trim();

      // Question validation (matches single form validation)
      if (!question) {
        errors.push(`Entry ${index + 1}: Question is required`);
      } else if (question.length < 5) {
        errors.push(`Entry ${index + 1}: Question must be at least 5 characters`);
      } else if (question.length > 500) {
        errors.push(`Entry ${index + 1}: Question must be less than 500 characters`);
      }

      // Answer validation (matches single form validation)
      if (!answer) {
        errors.push(`Entry ${index + 1}: Answer is required`);
      } else if (answer.length < 5) {
        errors.push(`Entry ${index + 1}: Answer must be at least 5 characters`);
      } else if (answer.length > 2000) {
        errors.push(`Entry ${index + 1}: Answer must be less than 2000 characters`);
      }
    });
    setBulkErrors(errors);
    return errors.length === 0;
  };

  const handleBulkCreate = async () => {
    if (!selectedRestaurantId) return;
    if (!validateBulkEntries()) return;

    try {
      setIsSubmitting(true);
      const validEntries = bulkEntries.filter((e) => e.question.trim() && e.answer.trim());

      const result = await bulkCreateFAQs(selectedRestaurantId, {
        faqs: validEntries.map((e) => ({
          question: e.question.trim(),
          answer: e.answer.trim(),
        })),
      });

      toast.success(`Successfully created ${result.items.length} FAQ(s)`);
      setIsBulkCreateDialogOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk create FAQs");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Upload handler
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (!validateCSVFileSize(file, MAX_CSV_FILE_SIZE)) {
      toast.error(
        `CSV file is too large. Please upload a file smaller than ${MAX_CSV_FILE_SIZE / (1024 * 1024)}MB.`
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => line.trim());

        const parsed: BulkFAQEntry[] = [];
        const errors: string[] = [];

        lines.forEach((line, lineIndex) => {
          // Skip header if present
          if (
            lineIndex === 0 &&
            (line.toLowerCase().includes("question") || line.toLowerCase().includes("answer"))
          ) {
            return;
          }

          // Parse CSV line with quote handling
          const parts = parseCSVLine(line);
          if (parts.length < 2) {
            errors.push(`Line ${lineIndex + 1}: Invalid format (need question and answer)`);
            return;
          }

          const question = parts[0].trim();
          const answer = parts[1].trim();

          if (!question || !answer) {
            errors.push(`Line ${lineIndex + 1}: Both question and answer are required`);
            return;
          }

          parsed.push({ question, answer });
        });

        if (parsed.length > 0) {
          setBulkEntries(parsed);
          setBulkErrors(errors);
          toast.success(`Loaded ${parsed.length} FAQ(s) from CSV`);
        } else {
          toast.error("No valid FAQs found in CSV file");
          setBulkErrors(errors);
        }
      } catch (err) {
        console.error("Error parsing CSV file:", err);
        toast.error(
          err instanceof Error
            ? `Failed to parse CSV file: ${err.message}`
            : "Failed to parse CSV file. Please check the format."
        );
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const formatDate = (dateStr: string) => {
    return formatLocalDate(dateStr, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRestaurantName = (restaurantId: number) => {
    return restaurants.find((r) => r.id === restaurantId)?.name || `Restaurant #${restaurantId}`;
  };

  // ============================================================================
  // Render Form
  // ============================================================================

  const renderForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          placeholder="e.g., What are your hours?"
          value={formData.question}
          onChange={(e) => {
            setFormData({ ...formData, question: e.target.value });
            if (formErrors.question) setFormErrors({ ...formErrors, question: "" });
          }}
          className={formErrors.question ? "border-destructive" : ""}
          maxLength={500}
        />
        <div className="flex justify-between">
          {formErrors.question ? (
            <p className="text-sm text-destructive">{formErrors.question}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{formData.question.length}/500</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          placeholder="Provide a clear and helpful answer..."
          value={formData.answer}
          onChange={(e) => {
            setFormData({ ...formData, answer: e.target.value });
            if (formErrors.answer) setFormErrors({ ...formErrors, answer: "" });
          }}
          className={formErrors.answer ? "border-destructive" : ""}
          rows={4}
          maxLength={2000}
        />
        <div className="flex justify-between">
          {formErrors.answer ? (
            <p className="text-sm text-destructive">{formErrors.answer}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{formData.answer.length}/2000</p>
        </div>
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
          title="FAQ Management"
          description="Manage frequently asked questions for restaurants"
        />
        <main className="flex-1 p-4 lg:p-6">
          <Card>
            <CardHeader className="space-y-4">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <CardTitle>FAQs</CardTitle>
                  {pagination && (
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {pagination.total} items
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  {/* Search Mode Toggle */}
                  <div className="flex rounded-lg border overflow-hidden w-full sm:w-auto">
                    <Button
                      variant={searchMode === "restaurant" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 sm:flex-initial rounded-none px-3 sm:px-3 h-9 sm:h-8"
                      onClick={() => handleSearchModeChange("restaurant")}
                    >
                      <Building2 className="h-4 w-4 mr-2 sm:mr-1.5" />
                      <span className="text-sm">Restaurant</span>
                    </Button>
                    <Button
                      variant={searchMode === "global" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 sm:flex-initial rounded-none px-3 sm:px-3 h-9 sm:h-8"
                      onClick={() => handleSearchModeChange("global")}
                    >
                      <Globe className="h-4 w-4 mr-2 sm:mr-1.5" />
                      <span className="text-sm">Global</span>
                    </Button>
                  </div>

                  {/* Restaurant Selector (only in restaurant mode) */}
                  {searchMode === "restaurant" && (
                    <Select
                      value={selectedRestaurantId?.toString() || ""}
                      onValueChange={handleRestaurantChange}
                      disabled={isLoadingRestaurants}
                    >
                      <SelectTrigger className="w-full sm:w-[140px] md:w-[200px]">
                        <SelectValue placeholder="Select" />
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

                  {/* Action Buttons */}
                  {searchMode === "restaurant" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={openBulkCreateDialog}
                        disabled={!selectedRestaurantId}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Bulk Add</span>
                        <span className="sm:hidden">Bulk</span>
                      </Button>
                      <Button
                        onClick={openCreateDialog}
                        disabled={!selectedRestaurantId}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add FAQ</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    searchMode === "global" ? "Search across all restaurants..." : "Search FAQs..."
                  }
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="text-center py-8 px-4 text-destructive bg-destructive/5 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {isLoadingFAQs ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : faqs.length > 0 ? (
                <>
                  {/* Table View */}
                  <div className="overflow-x-auto border rounded-lg">
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[60px] font-semibold hidden sm:table-cell">
                              <button
                                onClick={() => handleSort("id")}
                                className="flex items-center hover:text-primary transition-colors"
                              >
                                ID
                                {getSortIcon("id")}
                              </button>
                            </TableHead>
                            {searchMode === "global" && (
                              <TableHead className="font-semibold hidden md:table-cell">
                                Restaurant
                              </TableHead>
                            )}
                            <TableHead className="font-semibold">Question</TableHead>
                            <TableHead className="font-semibold max-w-[300px] hidden md:table-cell">
                              Answer
                            </TableHead>
                            <TableHead className="font-semibold w-[90px] hidden lg:table-cell">
                              Created
                            </TableHead>
                            <TableHead className="font-semibold text-right w-[100px]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedFAQs.map((faq) => (
                            <TableRow
                              key={faq.id}
                              className="group hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-mono text-sm hidden sm:table-cell">
                                {faq.id}
                              </TableCell>
                              {searchMode === "global" && (
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="outline" className="text-xs">
                                    {faq.restaurant_name || getRestaurantName(faq.restaurant_id)}
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm sm:text-base line-clamp-2">
                                    {faq.question}
                                  </p>
                                  {/* Mobile only: show truncated answer */}
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 md:hidden">
                                    {faq.answer}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <p className="text-muted-foreground text-sm truncate max-w-[300px]">
                                  {faq.answer}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                                {formatDate(faq.created_at)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openDetailsDialog(faq)}
                                      >
                                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openEditDialog(faq)}
                                      >
                                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => openDeleteDialog(faq)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
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

                  {/* Full Accordion View */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        FAQ Preview
                      </h3>
                      <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                        {faqs.length} {faqs.length === 1 ? "question" : "questions"}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-6 border">
                      <Accordion type="single" collapsible className="w-full space-y-3">
                        {sortedFAQs.map((faq) => (
                          <AccordionItem
                            key={faq.id}
                            value={`faq-${faq.id}`}
                            className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          >
                            <AccordionTrigger className="text-left hover:no-underline px-5 py-4 group">
                              <div className="flex items-start gap-4 w-full">
                                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm mt-0.5">
                                  Q
                                </div>
                                <span className="font-medium text-base sm:text-lg leading-relaxed text-foreground tracking-tight group-hover:text-primary transition-colors">
                                  {faq.question}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="flex items-start gap-4 pt-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium mt-0.5">
                                  A
                                </div>
                                <p className="text-muted-foreground text-[15px] sm:text-base leading-7 font-normal tracking-wide max-w-none">
                                  {faq.answer}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
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
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No FAQs found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Try a different search term"
                      : searchMode === "global"
                        ? "Enter a search term to find FAQs"
                        : "Add your first FAQ to get started"}
                  </p>
                  {searchMode === "restaurant" && !searchQuery && selectedRestaurantId && (
                    <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                      <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add FAQ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={openBulkCreateDialog}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Add
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
            <DialogDescription>Create a new frequently asked question</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.question.trim() || !formData.answer.trim()}
            >
              {isSubmitting ? "Creating..." : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update the question and answer</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSubmitting || !formData.question.trim() || !formData.answer.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{selectedFAQ?.question}</p>
              </div>
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
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>FAQ Details</DialogTitle>
            <DialogDescription>
              {selectedFAQ?.restaurant_name || getRestaurantName(selectedFAQ?.restaurant_id || 0)}
            </DialogDescription>
          </DialogHeader>
          {selectedFAQ && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Question</Label>
                <p className="font-medium text-lg mt-1">{selectedFAQ.question}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Answer</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedFAQ.answer}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{formatDate(selectedFAQ.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="text-sm">{formatDate(selectedFAQ.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedFAQ && (
              <Button
                onClick={() => {
                  setIsDetailsDialogOpen(false);
                  openEditDialog(selectedFAQ);
                }}
              >
                Edit FAQ
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Bulk Add FAQs</DialogTitle>
            <DialogDescription>Add multiple FAQs at once</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                {bulkEntries.map((entry, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        FAQ #{index + 1}
                      </span>
                      {bulkEntries.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeBulkEntry(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Question"
                      value={entry.question}
                      onChange={(e) => updateBulkEntry(index, "question", e.target.value)}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={entry.answer}
                      onChange={(e) => updateBulkEntry(index, "answer", e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}

                <Button variant="outline" className="w-full" onClick={addBulkEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another FAQ
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="flex-1 overflow-auto mt-4">
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a CSV file with questions and answers
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Format: question,answer (one per line)
                  </p>
                  <label>
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleCSVUpload}
                    />
                  </label>
                </div>

                {bulkEntries.length > 0 && bulkEntries[0].question && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Preview ({bulkEntries.length} FAQs loaded)
                    </p>
                    <div className="max-h-[200px] overflow-auto space-y-2">
                      {bulkEntries.slice(0, 5).map((entry, i) => (
                        <div key={i} className="text-sm p-2 bg-background rounded">
                          <p className="font-medium truncate">{entry.question}</p>
                          <p className="text-muted-foreground truncate">{entry.answer}</p>
                        </div>
                      ))}
                      {bulkEntries.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{bulkEntries.length - 5} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Errors */}
          {bulkErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <p className="font-medium mb-1">Validation Errors:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {bulkErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {bulkErrors.length > 5 && <li>+{bulkErrors.length - 5} more errors...</li>}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={
                isSubmitting ||
                bulkEntries.length === 0 ||
                !bulkEntries.some((e) => e.question.trim() && e.answer.trim())
              }
            >
              {isSubmitting
                ? "Creating..."
                : `Create ${bulkEntries.filter((e) => e.question.trim() && e.answer.trim()).length} FAQ(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQ;
