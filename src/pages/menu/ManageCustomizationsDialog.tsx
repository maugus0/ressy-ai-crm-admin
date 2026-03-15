import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Trash2, Loader2, Settings2, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { getMenuItem } from "@/services/menu";
import {
  getOptionGroups,
  attachOptionGroupToItem,
  detachOptionGroupFromItem,
} from "@/services/menuOptions";
import type { MenuItem, OptionGroup, MenuItemOptionGroupAttachRequest } from "@/types/api.types";
import { formatPriceDelta } from "@/lib/utils/menu";

// ============================================================================
// Types
// ============================================================================

interface ManageCustomizationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  selectedRestaurantId: number | null;
  onChanged?: () => void;
}

interface AttachFormData {
  group_id: string;
  min_select_override: string;
  max_select_override: string;
  free_allowance_override: string;
  allows_quantity_override: string;
  max_quantity_per_option_override: string;
  is_required_override: string;
  sort_order: string;
}

const defaultAttachForm: AttachFormData = {
  group_id: "",
  min_select_override: "",
  max_select_override: "",
  free_allowance_override: "",
  allows_quantity_override: "",
  max_quantity_per_option_override: "",
  is_required_override: "",
  sort_order: "0",
};

// ============================================================================
// Component
// ============================================================================

const ManageCustomizationsDialog = ({
  open,
  onOpenChange,
  menuItem,
  selectedRestaurantId,
  onChanged,
}: ManageCustomizationsDialogProps) => {
  const [itemDetails, setItemDetails] = useState<MenuItem | null>(null);
  const [allGroups, setAllGroups] = useState<OptionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attach form
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [attachForm, setAttachForm] = useState<AttachFormData>(defaultAttachForm);
  const [showOverrides, setShowOverrides] = useState(false);

  // Detach confirmation
  const [detachGroup, setDetachGroup] = useState<OptionGroup | null>(null);
  const [isDetachDialogOpen, setIsDetachDialogOpen] = useState(false);

  // ============================================================================
  // Fetch
  // ============================================================================

  const fetchData = useCallback(async () => {
    if (!menuItem || !selectedRestaurantId) return;
    try {
      setIsLoading(true);
      const [details, groups] = await Promise.all([
        getMenuItem(menuItem.id),
        getOptionGroups(selectedRestaurantId),
      ]);
      setItemDetails(details);
      setAllGroups(groups);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [menuItem, selectedRestaurantId]);

  useEffect(() => {
    if (open && menuItem) {
      fetchData();
      setShowAttachForm(false);
      setAttachForm(defaultAttachForm);
      setShowOverrides(false);
    }
  }, [open, menuItem, fetchData]);

  // ============================================================================
  // Derived
  // ============================================================================

  const attachedGroupIds = new Set((itemDetails?.option_groups || []).map((g) => g.id));

  const availableGroups = allGroups.filter((g) => !attachedGroupIds.has(g.id));

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAttach = async () => {
    if (!itemDetails || !attachForm.group_id) return;
    try {
      setIsSubmitting(true);
      const payload: MenuItemOptionGroupAttachRequest = {
        group_id: parseInt(attachForm.group_id),
        sort_order: parseInt(attachForm.sort_order) || 0,
      };

      if (attachForm.min_select_override)
        payload.min_select_override = parseInt(attachForm.min_select_override);
      if (attachForm.max_select_override)
        payload.max_select_override = parseInt(attachForm.max_select_override);
      if (attachForm.free_allowance_override)
        payload.free_allowance_override = parseInt(attachForm.free_allowance_override);
      if (attachForm.allows_quantity_override && attachForm.allows_quantity_override !== "inherit")
        payload.allows_quantity_override = attachForm.allows_quantity_override === "true";
      if (attachForm.max_quantity_per_option_override)
        payload.max_quantity_per_option_override = parseInt(
          attachForm.max_quantity_per_option_override
        );
      if (attachForm.is_required_override && attachForm.is_required_override !== "inherit")
        payload.is_required_override = attachForm.is_required_override === "true";

      await attachOptionGroupToItem(itemDetails.id, payload);
      toast.success("Option group attached");
      setShowAttachForm(false);
      setAttachForm(defaultAttachForm);
      setShowOverrides(false);
      fetchData();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to attach option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetach = async () => {
    if (!itemDetails || !detachGroup) return;
    try {
      setIsSubmitting(true);
      await detachOptionGroupFromItem(itemDetails.id, detachGroup.id);
      toast.success("Option group detached");
      setIsDetachDialogOpen(false);
      setDetachGroup(null);
      fetchData();
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to detach option group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Customizations — {menuItem?.item_name}
            </DialogTitle>
            <DialogDescription>Attach or detach option groups for this menu item</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Attached Groups */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Attached Groups ({itemDetails?.option_groups?.length || 0})
                </h4>

                {!itemDetails?.option_groups || itemDetails.option_groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                    No customization groups attached to this item
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itemDetails.option_groups
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((group) => (
                        <div
                          key={group.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium">{group.name}</span>
                              <Badge
                                variant={
                                  group.selection_type === "single" ? "outline" : "secondary"
                                }
                                className="text-xs"
                              >
                                {group.selection_type === "single" ? "Single" : "Multiple"}
                              </Badge>
                              {group.is_required && <Badge className="text-xs">Required</Badge>}
                            </div>
                            {group.values.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 ml-5">
                                {group.values
                                  .sort((a, b) => a.sort_order - b.sort_order)
                                  .slice(0, 5)
                                  .map((v) => (
                                    <span
                                      key={v.id}
                                      className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                                    >
                                      {v.name}
                                      {v.price_delta > 0 && (
                                        <span className="text-orange-600 ml-1">
                                          {formatPriceDelta(v.price_delta)}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                {group.values.length > 5 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{group.values.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => {
                              setDetachGroup(group);
                              setIsDetachDialogOpen(true);
                            }}
                          >
                            <Unlink className="h-3 w-3 mr-1" />
                            Detach
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Attach Form */}
              {!showAttachForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAttachForm(true)}
                  disabled={availableGroups.length === 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {availableGroups.length === 0 ? "All groups attached" : "Attach Option Group"}
                </Button>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <h4 className="font-medium text-sm">Attach Option Group</h4>

                  <div className="space-y-2">
                    <Label>Option Group *</Label>
                    <Select
                      value={attachForm.group_id}
                      onValueChange={(v) => setAttachForm({ ...attachForm, group_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name} ({g.selection_type}, {g.values.length} values)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      min="0"
                      value={attachForm.sort_order}
                      onChange={(e) => setAttachForm({ ...attachForm, sort_order: e.target.value })}
                      className="w-24"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={showOverrides} onCheckedChange={setShowOverrides} />
                    <Label className="text-sm">Set per-item overrides</Label>
                  </div>

                  {showOverrides && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Select Override</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Inherit from group"
                          value={attachForm.min_select_override}
                          onChange={(e) =>
                            setAttachForm({ ...attachForm, min_select_override: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Select Override</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Inherit from group"
                          value={attachForm.max_select_override}
                          onChange={(e) =>
                            setAttachForm({ ...attachForm, max_select_override: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Free Allowance Override</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Inherit from group"
                          value={attachForm.free_allowance_override}
                          onChange={(e) =>
                            setAttachForm({
                              ...attachForm,
                              free_allowance_override: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Qty Per Option Override</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Inherit from group"
                          value={attachForm.max_quantity_per_option_override}
                          onChange={(e) =>
                            setAttachForm({
                              ...attachForm,
                              max_quantity_per_option_override: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Allows Quantity Override</Label>
                        <Select
                          value={attachForm.allows_quantity_override}
                          onValueChange={(v) =>
                            setAttachForm({ ...attachForm, allows_quantity_override: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Inherit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Inherit</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Required Override</Label>
                        <Select
                          value={attachForm.is_required_override}
                          onValueChange={(v) =>
                            setAttachForm({ ...attachForm, is_required_override: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Inherit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Inherit</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAttachForm(false);
                        setAttachForm(defaultAttachForm);
                        setShowOverrides(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAttach}
                      disabled={isSubmitting || !attachForm.group_id}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Attaching...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3 w-3 mr-1" />
                          Attach
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detach Confirmation */}
      <AlertDialog open={isDetachDialogOpen} onOpenChange={setIsDetachDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detach Option Group</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &ldquo;{detachGroup?.name}&rdquo; from &ldquo;{menuItem?.item_name}&rdquo;? The
              group itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDetach}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Detaching...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Detach
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCustomizationsDialog;
