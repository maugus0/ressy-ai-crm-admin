import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOptionGroups,
  getOptionGroup,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
} from "@/services/menuOptions";
import type {
  OptionGroup,
  OptionValue,
  OptionGroupCreateRequest,
  OptionGroupUpdateRequest,
  OptionValueCreateRequest,
} from "@/types/api.types";
import { formatPriceDelta, promptStyleLabel } from "@/lib/utils/menu";

// ============================================================================
// Types
// ============================================================================

interface OptionGroupsTabProps {
  selectedRestaurantId: number | null;
}

interface GroupFormData {
  name: string;
  description: string;
  selection_type: "single" | "multiple";
  min_select: string;
  max_select: string;
  free_allowance: string;
  free_allowance_strategy: string;
  allows_quantity: boolean;
  max_quantity_per_option: string;
  prompt_style: "ASK_ALWAYS" | "ASK_IF_MENTIONED" | "SUGGEST_POPULAR";
  is_required: boolean;
  is_available: boolean;
  sort_order: string;
}

interface InlineValueRow {
  name: string;
  price_delta: string;
  is_default: boolean;
  is_available: boolean;
  sort_order: string;
}

interface ValueFormData {
  name: string;
  price_delta: string;
  is_default: boolean;
  is_available: boolean;
  sort_order: string;
}

const defaultGroupForm: GroupFormData = {
  name: "",
  description: "",
  selection_type: "single",
  min_select: "0",
  max_select: "1",
  free_allowance: "0",
  free_allowance_strategy: "HIGHEST_PRICE_FIRST",
  allows_quantity: false,
  max_quantity_per_option: "",
  prompt_style: "ASK_ALWAYS",
  is_required: false,
  is_available: true,
  sort_order: "0",
};

const defaultValueForm: ValueFormData = {
  name: "",
  price_delta: "0",
  is_default: false,
  is_available: true,
  sort_order: "0",
};

// ============================================================================
// Component
// ============================================================================

const OptionGroupsTab = ({ selectedRestaurantId }: OptionGroupsTabProps) => {
  // Data state
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group CRUD dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<OptionGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormData>(defaultGroupForm);
  const [groupFormErrors, setGroupFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline values for create
  const [inlineValues, setInlineValues] = useState<InlineValueRow[]>([]);

  // Values management dialog
  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
  const [valuesGroup, setValuesGroup] = useState<OptionGroup | null>(null);
  const [isLoadingValues, setIsLoadingValues] = useState(false);

  // Value CRUD
  const [isValueFormOpen, setIsValueFormOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<OptionValue | null>(null);
  const [valueForm, setValueForm] = useState<ValueFormData>(defaultValueForm);
  const [valueFormErrors, setValueFormErrors] = useState<Record<string, string>>({});
  const [isDeleteValueDialogOpen, setIsDeleteValueDialogOpen] = useState(false);
  const [deletingValue, setDeletingValue] = useState<OptionValue | null>(null);

  // Mobile expansion
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  // ============================================================================
  // Fetch
  // ============================================================================

  const fetchGroups = useCallback(async () => {
    if (!selectedRestaurantId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOptionGroups(selectedRestaurantId);
      setOptionGroups(data.sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load option groups");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRestaurantId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ============================================================================
  // Group Form Validation
  // ============================================================================

  const validateGroupForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!groupForm.name.trim()) errors.name = "Name is required";
    const min = parseInt(groupForm.min_select);
    const max = groupForm.max_select ? parseInt(groupForm.max_select) : null;
    if (isNaN(min) || min < 0) errors.min_select = "Must be 0 or greater";
    if (max !== null && !isNaN(max) && max < min) errors.max_select = "Must be ≥ min select";
    if (groupForm.selection_type === "single" && max !== null && max > 1)
      errors.max_select = "Single-choice max must be 1";
    setGroupFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================================================
  // Group Handlers
  // ============================================================================

  const openCreateGroupDialog = () => {
    setGroupForm(defaultGroupForm);
    setGroupFormErrors({});
    setInlineValues([]);
    setIsCreateDialogOpen(true);
  };

  const openEditGroupDialog = (group: OptionGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      selection_type: group.selection_type,
      min_select: String(group.min_select),
      max_select: group.max_select !== null ? String(group.max_select) : "",
      free_allowance: String(group.free_allowance),
      free_allowance_strategy: group.free_allowance_strategy,
      allows_quantity: group.allows_quantity,
      max_quantity_per_option:
        group.max_quantity_per_option !== null ? String(group.max_quantity_per_option) : "",
      prompt_style: group.prompt_style,
      is_required: group.is_required,
      is_available: group.is_available,
      sort_order: String(group.sort_order),
    });
    setGroupFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteGroupDialog = (group: OptionGroup) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!selectedRestaurantId || !validateGroupForm()) return;
    try {
      setIsSubmitting(true);
      const payload: OptionGroupCreateRequest = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || null,
        selection_type: groupForm.selection_type,
        min_select: parseInt(groupForm.min_select) || 0,
        max_select: groupForm.max_select ? parseInt(groupForm.max_select) : null,
        free_allowance: parseInt(groupForm.free_allowance) || 0,
        free_allowance_strategy: groupForm.free_allowance_strategy,
        allows_quantity: groupForm.allows_quantity,
        max_quantity_per_option: groupForm.max_quantity_per_option
          ? parseInt(groupForm.max_quantity_per_option)
          : null,
        prompt_style: groupForm.prompt_style,
        is_required: groupForm.is_required,
        is_available: groupForm.is_available,
        sort_order: parseInt(groupForm.sort_order) || 0,
        values: inlineValues
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            price_delta: parseFloat(v.price_delta) || 0,
            is_default: v.is_default,
            is_available: v.is_available,
            sort_order: parseInt(v.sort_order) || 0,
          })),
      };
      await createOptionGroup(selectedRestaurantId, payload);
      toast.success("Option group created");
      setIsCreateDialogOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !validateGroupForm()) return;
    try {
      setIsSubmitting(true);
      const payload: OptionGroupUpdateRequest = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || null,
        selection_type: groupForm.selection_type,
        min_select: parseInt(groupForm.min_select) || 0,
        max_select: groupForm.max_select ? parseInt(groupForm.max_select) : null,
        free_allowance: parseInt(groupForm.free_allowance) || 0,
        free_allowance_strategy: groupForm.free_allowance_strategy,
        allows_quantity: groupForm.allows_quantity,
        max_quantity_per_option: groupForm.max_quantity_per_option
          ? parseInt(groupForm.max_quantity_per_option)
          : null,
        prompt_style: groupForm.prompt_style,
        is_required: groupForm.is_required,
        is_available: groupForm.is_available,
        sort_order: parseInt(groupForm.sort_order) || 0,
      };
      await updateOptionGroup(selectedGroup.id, payload);
      toast.success("Option group updated");
      setIsEditDialogOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    try {
      setIsSubmitting(true);
      await deleteOptionGroup(selectedGroup.id);
      toast.success("Option group deleted");
      setIsDeleteDialogOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Inline Values (for create dialog)
  // ============================================================================

  const addInlineValue = () => {
    setInlineValues((prev) => [
      ...prev,
      {
        name: "",
        price_delta: "0",
        is_default: false,
        is_available: true,
        sort_order: String(prev.length),
      },
    ]);
  };

  const updateInlineValue = (
    index: number,
    field: keyof InlineValueRow,
    value: string | boolean
  ) => {
    setInlineValues((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const removeInlineValue = (index: number) => {
    setInlineValues((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================================
  // Values Management Dialog
  // ============================================================================

  const openValuesDialog = async (group: OptionGroup) => {
    try {
      setIsLoadingValues(true);
      setIsValuesDialogOpen(true);
      const fullGroup = await getOptionGroup(group.id);
      setValuesGroup(fullGroup);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load values");
      setIsValuesDialogOpen(false);
    } finally {
      setIsLoadingValues(false);
    }
  };

  const refreshValues = async () => {
    if (!valuesGroup) return;
    try {
      setIsLoadingValues(true);
      const fullGroup = await getOptionGroup(valuesGroup.id);
      setValuesGroup(fullGroup);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh values");
    } finally {
      setIsLoadingValues(false);
    }
  };

  // ============================================================================
  // Value CRUD
  // ============================================================================

  const validateValueForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!valueForm.name.trim()) errors.name = "Name is required";
    const delta = parseFloat(valueForm.price_delta);
    if (isNaN(delta)) errors.price_delta = "Must be a valid number";
    setValueFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddValueForm = () => {
    setEditingValue(null);
    setValueForm({
      ...defaultValueForm,
      sort_order: String(valuesGroup?.values.length || 0),
    });
    setValueFormErrors({});
    setIsValueFormOpen(true);
  };

  const openEditValueForm = (value: OptionValue) => {
    setEditingValue(value);
    setValueForm({
      name: value.name,
      price_delta: String(value.price_delta),
      is_default: value.is_default,
      is_available: value.is_available,
      sort_order: String(value.sort_order),
    });
    setValueFormErrors({});
    setIsValueFormOpen(true);
  };

  const handleSaveValue = async () => {
    if (!valuesGroup || !validateValueForm()) return;
    try {
      setIsSubmitting(true);
      if (editingValue) {
        await updateOptionValue(editingValue.id, {
          name: valueForm.name.trim(),
          price_delta: parseFloat(valueForm.price_delta) || 0,
          is_default: valueForm.is_default,
          is_available: valueForm.is_available,
          sort_order: parseInt(valueForm.sort_order) || 0,
        });
        toast.success("Value updated");
      } else {
        const payload: OptionValueCreateRequest = {
          name: valueForm.name.trim(),
          price_delta: parseFloat(valueForm.price_delta) || 0,
          is_default: valueForm.is_default,
          is_available: valueForm.is_available,
          sort_order: parseInt(valueForm.sort_order) || 0,
        };
        await createOptionValue(valuesGroup.id, payload);
        toast.success("Value added");
      }
      setIsValueFormOpen(false);
      refreshValues();
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save value");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteValue = async () => {
    if (!deletingValue) return;
    try {
      setIsSubmitting(true);
      await deleteOptionValue(deletingValue.id);
      toast.success("Value deleted");
      setIsDeleteValueDialogOpen(false);
      setDeletingValue(null);
      refreshValues();
      fetchGroups();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete value");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Group Form Render
  // ============================================================================

  const renderGroupForm = (isCreate: boolean) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="og-name">Name *</Label>
        <Input
          id="og-name"
          placeholder="e.g., Spice Level"
          value={groupForm.name}
          onChange={(e) => {
            setGroupForm({ ...groupForm, name: e.target.value });
            if (groupFormErrors.name) setGroupFormErrors({ ...groupFormErrors, name: "" });
          }}
          className={groupFormErrors.name ? "border-destructive" : ""}
        />
        {groupFormErrors.name && <p className="text-sm text-destructive">{groupFormErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="og-desc">Description</Label>
        <Textarea
          id="og-desc"
          placeholder="Optional description..."
          value={groupForm.description}
          onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Selection Type</Label>
          <Select
            value={groupForm.selection_type}
            onValueChange={(v) => {
              const type = v as "single" | "multiple";
              setGroupForm({
                ...groupForm,
                selection_type: type,
                max_select: type === "single" ? "1" : groupForm.max_select,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Choice</SelectItem>
              <SelectItem value="multiple">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prompt Style</Label>
          <Select
            value={groupForm.prompt_style}
            onValueChange={(v) =>
              setGroupForm({
                ...groupForm,
                prompt_style: v as "ASK_ALWAYS" | "ASK_IF_MENTIONED" | "SUGGEST_POPULAR",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASK_ALWAYS">Always Ask</SelectItem>
              <SelectItem value="ASK_IF_MENTIONED">Ask If Mentioned</SelectItem>
              <SelectItem value="SUGGEST_POPULAR">Suggest Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Min Select</Label>
          <Input
            type="number"
            min="0"
            value={groupForm.min_select}
            onChange={(e) => {
              setGroupForm({ ...groupForm, min_select: e.target.value });
              if (groupFormErrors.min_select)
                setGroupFormErrors({ ...groupFormErrors, min_select: "" });
            }}
            className={groupFormErrors.min_select ? "border-destructive" : ""}
          />
          {groupFormErrors.min_select && (
            <p className="text-sm text-destructive">{groupFormErrors.min_select}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Max Select</Label>
          <Input
            type="number"
            min="0"
            placeholder="Unlimited"
            value={groupForm.max_select}
            onChange={(e) => {
              setGroupForm({ ...groupForm, max_select: e.target.value });
              if (groupFormErrors.max_select)
                setGroupFormErrors({ ...groupFormErrors, max_select: "" });
            }}
            className={groupFormErrors.max_select ? "border-destructive" : ""}
            disabled={groupForm.selection_type === "single"}
          />
          {groupFormErrors.max_select && (
            <p className="text-sm text-destructive">{groupFormErrors.max_select}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min="0"
            value={groupForm.sort_order}
            onChange={(e) => setGroupForm({ ...groupForm, sort_order: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Free Allowance</Label>
          <Input
            type="number"
            min="0"
            value={groupForm.free_allowance}
            onChange={(e) => setGroupForm({ ...groupForm, free_allowance: e.target.value })}
          />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label>Free Strategy</Label>
          <Select
            value={groupForm.free_allowance_strategy}
            onValueChange={(v) => setGroupForm({ ...groupForm, free_allowance_strategy: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGHEST_PRICE_FIRST">Highest Price First</SelectItem>
              <SelectItem value="LOWEST_PRICE_FIRST">Lowest Price First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Allows Quantity</Label>
            <p className="text-sm text-muted-foreground">Let callers specify quantity per option</p>
          </div>
          <Switch
            checked={groupForm.allows_quantity}
            onCheckedChange={(v) => setGroupForm({ ...groupForm, allows_quantity: v })}
          />
        </div>
        {groupForm.allows_quantity && (
          <div className="space-y-2 pl-4">
            <Label>Max Quantity Per Option</Label>
            <Input
              type="number"
              min="1"
              placeholder="Unlimited"
              value={groupForm.max_quantity_per_option}
              onChange={(e) =>
                setGroupForm({ ...groupForm, max_quantity_per_option: e.target.value })
              }
              className="w-32"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label>Required</Label>
            <p className="text-sm text-muted-foreground">Must be answered to complete order</p>
          </div>
          <Switch
            checked={groupForm.is_required}
            onCheckedChange={(v) => setGroupForm({ ...groupForm, is_required: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Available</Label>
            <p className="text-sm text-muted-foreground">Show this group to callers</p>
          </div>
          <Switch
            checked={groupForm.is_available}
            onCheckedChange={(v) => setGroupForm({ ...groupForm, is_available: v })}
          />
        </div>
      </div>

      {/* Inline values for create only */}
      {isCreate && (
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Initial Values</Label>
            <Button variant="outline" size="sm" onClick={addInlineValue}>
              <Plus className="h-3 w-3 mr-1" />
              Add Value
            </Button>
          </div>
          {inlineValues.map((v, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex-1 min-w-[120px] space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="Value name"
                  value={v.name}
                  onChange={(e) => updateInlineValue(i, "name", e.target.value)}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Price +/-</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={v.price_delta}
                  onChange={(e) => updateInlineValue(i, "price_delta", e.target.value)}
                />
              </div>
              <div className="w-16 space-y-1">
                <Label className="text-xs">Order</Label>
                <Input
                  type="number"
                  value={v.sort_order}
                  onChange={(e) => updateInlineValue(i, "sort_order", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pb-1">
                <label className="flex items-center gap-1 text-xs">
                  <Switch
                    checked={v.is_default}
                    onCheckedChange={(c) => updateInlineValue(i, "is_default", c)}
                    className="scale-75"
                  />
                  Default
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeInlineValue(i)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {inlineValues.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No values yet. You can add values now or manage them later.
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================================
  // Render
  // ============================================================================

  if (!selectedRestaurantId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Select a restaurant</p>
        <p className="text-sm">Choose a restaurant to manage option groups</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Option Groups</h3>
          <Badge variant="secondary">{optionGroups.length}</Badge>
        </div>
        <Button onClick={openCreateGroupDialog} disabled={!selectedRestaurantId}>
          <Plus className="h-4 w-4 mr-2" />
          Add Option Group
        </Button>
      </div>

      {error && (
        <div className="text-center py-6 px-4 text-sm text-destructive bg-destructive/5 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : optionGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No option groups</p>
          <p className="text-sm">Create your first option group to add customizations</p>
          <Button className="mt-4" onClick={openCreateGroupDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option Group
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border rounded-lg">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-center">Selection</TableHead>
                    <TableHead className="font-semibold">Prompt</TableHead>
                    <TableHead className="font-semibold text-center">Required</TableHead>
                    <TableHead className="font-semibold text-center">Available</TableHead>
                    <TableHead className="font-semibold text-center">Values</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optionGroups.map((group) => (
                    <TableRow key={group.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={group.selection_type === "single" ? "outline" : "secondary"}
                        >
                          {group.selection_type === "single" ? "Single" : "Multiple"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {group.min_select}–{group.max_select ?? "∞"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{promptStyleLabel(group.prompt_style)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={group.is_required ? "default" : "outline"}>
                          {group.is_required ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.is_available ? (
                          <Eye className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{group.values.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openValuesDialog(group)}
                              >
                                <Settings2 className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Manage Values</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditGroupDialog(group)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Group</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDeleteGroupDialog(group)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Group</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {optionGroups.map((group) => (
              <div key={group.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{group.name}</h4>
                      <Badge
                        variant={group.selection_type === "single" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {group.selection_type === "single" ? "Single" : "Multiple"}
                      </Badge>
                      {group.is_required && <Badge className="text-xs">Required</Badge>}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() =>
                      setExpandedGroupId(expandedGroupId === group.id ? null : group.id)
                    }
                  >
                    {expandedGroupId === group.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Select: {group.min_select}–{group.max_select ?? "∞"}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {promptStyleLabel(group.prompt_style)}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{group.values.length} values</span>
                  {!group.is_available && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-orange-600">Disabled</span>
                    </>
                  )}
                </div>

                {expandedGroupId === group.id && group.values.length > 0 && (
                  <div className="border-t pt-2 space-y-1">
                    {group.values
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((v) => (
                        <div key={v.id} className="flex items-center justify-between text-sm py-1">
                          <div className="flex items-center gap-2">
                            <span>{v.name}</span>
                            {v.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                            {!v.is_available && (
                              <Badge variant="secondary" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {formatPriceDelta(v.price_delta)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-2"
                    onClick={() => openValuesDialog(group)}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                    Manage Values
                  </Button>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditGroupDialog(group)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openDeleteGroupDialog(group)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* Create Group Dialog */}
      {/* ================================================================ */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Option Group</DialogTitle>
            <DialogDescription>
              Create a reusable customization group for menu items
            </DialogDescription>
          </DialogHeader>
          {renderGroupForm(true)}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={isSubmitting || !groupForm.name.trim()}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Edit Group Dialog */}
      {/* ================================================================ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Option Group</DialogTitle>
            <DialogDescription>Update group settings. Manage values separately.</DialogDescription>
          </DialogHeader>
          {renderGroupForm(false)}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={isSubmitting || !groupForm.name.trim()}
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

      {/* ================================================================ */}
      {/* Delete Group Dialog */}
      {/* ================================================================ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{selectedGroup?.name}&rdquo;? This will fail if
              the group is attached to menu items or used in orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================ */}
      {/* Values Management Dialog */}
      {/* ================================================================ */}
      <Dialog open={isValuesDialogOpen} onOpenChange={setIsValuesDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{valuesGroup?.name} — Values</DialogTitle>
            <DialogDescription>
              {valuesGroup && (
                <span>
                  {valuesGroup.selection_type === "single" ? "Single choice" : "Multiple choice"} •{" "}
                  Select {valuesGroup.min_select}–{valuesGroup.max_select ?? "∞"}
                  {valuesGroup.free_allowance > 0 && ` • ${valuesGroup.free_allowance} free`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingValues ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : valuesGroup ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={openAddValueForm}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Value
                </Button>
              </div>

              {valuesGroup.values.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No values yet. Add your first value.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold text-right">Price Delta</TableHead>
                        <TableHead className="font-semibold text-center">Default</TableHead>
                        <TableHead className="font-semibold text-center">Available</TableHead>
                        <TableHead className="font-semibold text-center">Order</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valuesGroup.values
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((value) => (
                          <TableRow key={value.id}>
                            <TableCell className="font-medium">{value.name}</TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  value.price_delta > 0
                                    ? "text-orange-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {formatPriceDelta(value.price_delta)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {value.is_default && <Badge variant="outline">Default</Badge>}
                            </TableCell>
                            <TableCell className="text-center">
                              {value.is_available ? (
                                <Eye className="h-4 w-4 text-emerald-600 mx-auto" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {value.sort_order}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditValueForm(value)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setDeletingValue(value);
                                    setIsDeleteValueDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Value Create/Edit Form (inline) */}
              {isValueFormOpen && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <h4 className="font-medium text-sm">
                    {editingValue ? "Edit Value" : "Add Value"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input
                        placeholder="Value name"
                        value={valueForm.name}
                        onChange={(e) => {
                          setValueForm({ ...valueForm, name: e.target.value });
                          if (valueFormErrors.name)
                            setValueFormErrors({ ...valueFormErrors, name: "" });
                        }}
                        className={valueFormErrors.name ? "border-destructive" : ""}
                      />
                      {valueFormErrors.name && (
                        <p className="text-xs text-destructive">{valueFormErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price Delta ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={valueForm.price_delta}
                        onChange={(e) => {
                          setValueForm({ ...valueForm, price_delta: e.target.value });
                          if (valueFormErrors.price_delta)
                            setValueFormErrors({ ...valueFormErrors, price_delta: "" });
                        }}
                        className={valueFormErrors.price_delta ? "border-destructive" : ""}
                      />
                      {valueFormErrors.price_delta && (
                        <p className="text-xs text-destructive">{valueFormErrors.price_delta}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={valueForm.is_default}
                        onCheckedChange={(v) => setValueForm({ ...valueForm, is_default: v })}
                      />
                      <Label className="text-sm">Default</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={valueForm.is_available}
                        onCheckedChange={(v) => setValueForm({ ...valueForm, is_available: v })}
                      />
                      <Label className="text-sm">Available</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Sort:</Label>
                      <Input
                        type="number"
                        className="w-16 h-8"
                        value={valueForm.sort_order}
                        onChange={(e) => setValueForm({ ...valueForm, sort_order: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsValueFormOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveValue}
                      disabled={isSubmitting || !valueForm.name.trim()}
                    >
                      {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {editingValue ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValuesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Value Confirmation */}
      <AlertDialog open={isDeleteValueDialogOpen} onOpenChange={setIsDeleteValueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option Value</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingValue?.name}&rdquo;? Default values
              and values used in orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OptionGroupsTab;
