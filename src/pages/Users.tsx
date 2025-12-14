import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Shield,
  Building2,
  Key,
  Mail,
  Calendar,
  Clock,
  Eye,
  UserCog,
  Upload,
  X,
} from "lucide-react";
import {
  getAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminPassword,
  updateAdminRole,
  bulkCreateAdminUsers,
  getClientUsers,
  getClientUser,
  createClientUser,
  updateClientUser,
  deleteClientUser,
  resetClientPassword,
  updateClientRole,
  bulkCreateClientUsers,
} from "@/services/users";
import { getRestaurants } from "@/services/restaurants";
import type { AdminUser, ClientUser, Restaurant, PaginationInfo } from "@/types/api.types";
import { toast } from "sonner";

// Role definitions (matching database roles table)
// role_id 1 = admin
// role_id 2 = manager
const ADMIN_ROLES = [
  { id: 1, name: "admin", label: "Admin" },
  { id: 2, name: "manager", label: "Manager" },
];

const CLIENT_ROLES = [
  { id: 1, name: "admin", label: "Restaurant Admin" },
  { id: 2, name: "manager", label: "Manager" },
];

// Email validation regex - more robust pattern (RFC 5322 compliant subset)
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// Password validation: at least 8 chars, max 128 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,128}$/;

interface UserFormData {
  email: string;
  password: string;
  role_id: number;
}

interface FormErrors {
  email?: string;
  password?: string;
  role_id?: string;
}

const defaultFormData: UserFormData = {
  email: "",
  password: "",
  role_id: 1,
};

const Users = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "client">("admin");

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminPagination, setAdminPagination] = useState<PaginationInfo | null>(null);
  const [adminPage, setAdminPage] = useState(1);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Client users state
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [clientPagination, setClientPagination] = useState<PaginationInfo | null>(null);
  const [clientPage, setClientPage] = useState(1);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Restaurant selector for client users
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | ClientUser | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUser | ClientUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Bulk create state
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<UserFormData[]>([
    { email: "", password: "", role_id: 1 },
  ]);
  const [bulkErrors, setBulkErrors] = useState<Record<number, FormErrors>>({});
  const [bulkCreateMode, setBulkCreateMode] = useState<"manual" | "csv">("manual");

  // Fetch restaurants for client user management
  const fetchRestaurants = useCallback(async () => {
    try {
      setRestaurantsLoading(true);
      // Fetch all restaurants - remove limit to get all available
      const data = await getRestaurants({});
      setRestaurants(data.items);

      // Warn if a suspiciously high number of restaurants is returned (possible truncation)
      if (data.items.length >= 1000) {
        toast.warning(
          "Warning: A large number of restaurants were loaded. Please contact support if you cannot find a restaurant."
        );
      }

      // Only set default restaurant if none is selected
      // Use functional update to avoid dependency on selectedRestaurantId
      setSelectedRestaurantId((prevId) => {
        if (!prevId && data.items.length > 0) {
          return data.items[0].id;
        }
        return prevId;
      });
    } catch (err) {
      toast.error("Failed to load restaurants");
    } finally {
      setRestaurantsLoading(false);
    }
  }, []); // Removed selectedRestaurantId from dependencies to prevent infinite loop

  // Fetch admin users
  const fetchAdminUsers = useCallback(async () => {
    try {
      setAdminLoading(true);
      setAdminError(null);
      const data = await getAdminUsers({ page: adminPage, limit: 10 });
      setAdminUsers(data.items);
      setAdminPagination(data.pagination);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to load admin users");
    } finally {
      setAdminLoading(false);
    }
  }, [adminPage]);

  // Fetch client users
  const fetchClientUsers = useCallback(async () => {
    if (!selectedRestaurantId) return;
    try {
      setClientLoading(true);
      setClientError(null);
      const data = await getClientUsers(selectedRestaurantId, { page: clientPage, limit: 10 });
      setClientUsers(data.items);
      setClientPagination(data.pagination);
    } catch (err) {
      setClientError(err instanceof Error ? err.message : "Failed to load client users");
    } finally {
      setClientLoading(false);
    }
  }, [selectedRestaurantId, clientPage]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminUsers();
    }
  }, [activeTab, fetchAdminUsers]);

  useEffect(() => {
    if (activeTab === "client" && selectedRestaurantId) {
      fetchClientUsers();
    }
  }, [activeTab, selectedRestaurantId, fetchClientUsers]);

  const resetForm = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setNewPassword("");
    setPasswordError("");
  };

  const validateForm = (isCreate: boolean): boolean => {
    const errors: FormErrors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (isCreate) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8 || formData.password.length > 128) {
        errors.password = "Password must be 8-128 characters";
      } else if (!PASSWORD_REGEX.test(formData.password)) {
        errors.password =
          "Password must contain uppercase, lowercase, number, and special character";
      }
    }

    if (!formData.role_id) {
      errors.role_id = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    if (!newPassword) {
      setPasswordError("Password is required");
      return false;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError("Password must be 8-128 characters");
      return false;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError("Password must contain uppercase, lowercase, number, and special character");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Create user
  const handleCreate = async () => {
    if (!validateForm(true)) return;

    try {
      setIsSubmitting(true);
      if (activeTab === "admin") {
        await createAdminUser(formData);
        toast.success("Admin user created successfully");
        fetchAdminUsers();
      } else if (selectedRestaurantId) {
        await createClientUser(selectedRestaurantId, formData);
        toast.success("Client user created successfully");
        fetchClientUsers();
      }
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update user
  const handleEdit = async () => {
    if (!selectedUser || !validateForm(false)) return;

    try {
      setIsSubmitting(true);
      if (activeTab === "admin") {
        await updateAdminUser(selectedUser.uuid, {
          email: formData.email,
          role_id: formData.role_id,
        });
        toast.success("Admin user updated successfully");
        fetchAdminUsers();
      } else if (selectedRestaurantId) {
        await updateClientUser(selectedRestaurantId, selectedUser.uuid, {
          email: formData.email,
          role_id: formData.role_id,
        });
        toast.success("Client user updated successfully");
        fetchClientUsers();
      }
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      if (activeTab === "admin") {
        await deleteAdminUser(selectedUser.uuid);
        toast.success("Admin user deleted successfully");
        fetchAdminUsers();
      } else if (selectedRestaurantId) {
        await deleteClientUser(selectedRestaurantId, selectedUser.uuid);
        toast.success("Client user deleted successfully");
        fetchClientUsers();
      }
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser || !validatePassword()) return;

    try {
      setIsSubmitting(true);
      if (activeTab === "admin") {
        await resetAdminPassword(selectedUser.uuid, { new_password: newPassword });
        toast.success("Password reset successfully");
      } else if (selectedRestaurantId) {
        await resetClientPassword(selectedRestaurantId, selectedUser.uuid, {
          new_password: newPassword,
        });
        toast.success("Password reset successfully");
      }
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update role inline
  const handleRoleChange = async (user: AdminUser | ClientUser, newRoleId: number) => {
    try {
      if (activeTab === "admin") {
        await updateAdminRole(user.uuid, { role_id: newRoleId });
        toast.success("Role updated successfully");
        fetchAdminUsers();
      } else if (selectedRestaurantId) {
        await updateClientRole(selectedRestaurantId, user.uuid, { role_id: newRoleId });
        toast.success("Role updated successfully");
        fetchClientUsers();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  // Bulk create functions
  const resetBulkForm = () => {
    setBulkUsers([{ email: "", password: "", role_id: 1 }]);
    setBulkErrors({});
    setBulkCreateMode("manual");
  };

  const addBulkUserRow = () => {
    setBulkUsers([...bulkUsers, { email: "", password: "", role_id: 1 }]);
  };

  const removeBulkUserRow = (index: number) => {
    if (bulkUsers.length > 1) {
      const updated = bulkUsers.filter((_, i) => i !== index);
      setBulkUsers(updated);
      const updatedErrors = { ...bulkErrors };
      delete updatedErrors[index];
      // Reindex errors
      const newErrors: Record<number, FormErrors> = {};
      Object.keys(updatedErrors).forEach((key) => {
        const oldIndex = Number(key);
        if (oldIndex > index) {
          newErrors[oldIndex - 1] = updatedErrors[oldIndex];
        } else if (oldIndex < index) {
          newErrors[oldIndex] = updatedErrors[oldIndex];
        }
      });
      setBulkErrors(newErrors);
    }
  };

  const updateBulkUser = (index: number, field: keyof UserFormData, value: string | number) => {
    const updated = [...bulkUsers];
    updated[index] = { ...updated[index], [field]: value };
    setBulkUsers(updated);

    // Clear error for this field
    if (bulkErrors[index]) {
      const updatedErrors = { ...bulkErrors };
      delete updatedErrors[index][field as keyof FormErrors];
      if (Object.keys(updatedErrors[index]).length === 0) {
        delete updatedErrors[index];
      }
      setBulkErrors(updatedErrors);
    }
  };

  const validateBulkUsers = (): boolean => {
    const errors: Record<number, FormErrors> = {};
    let hasErrors = false;

    bulkUsers.forEach((user, index) => {
      const userErrors: FormErrors = {};

      if (!user.email.trim()) {
        userErrors.email = "Email is required";
        hasErrors = true;
      } else if (!EMAIL_REGEX.test(user.email)) {
        userErrors.email = "Invalid email format";
        hasErrors = true;
      }

      if (!user.password) {
        userErrors.password = "Password is required";
        hasErrors = true;
      } else if (user.password.length < 8 || user.password.length > 128) {
        userErrors.password = "Password must be 8-128 characters";
        hasErrors = true;
      } else if (!PASSWORD_REGEX.test(user.password)) {
        userErrors.password =
          "Password must contain uppercase, lowercase, number, and special character";
        hasErrors = true;
      }

      if (!user.role_id) {
        userErrors.role_id = "Role is required";
        hasErrors = true;
      }

      if (Object.keys(userErrors).length > 0) {
        errors[index] = userErrors;
      }
    });

    setBulkErrors(errors);
    return !hasErrors;
  };

  const handleBulkCreate = async () => {
    if (!validateBulkUsers()) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      if (activeTab === "admin") {
        const response = await bulkCreateAdminUsers({ users: bulkUsers });
        toast.success(`Successfully created ${response.items.length} admin user(s)`);
        fetchAdminUsers();
      } else if (selectedRestaurantId) {
        const response = await bulkCreateClientUsers(selectedRestaurantId, { users: bulkUsers });
        toast.success(`Successfully created ${response.items.length} client user(s)`);
        fetchClientUsers();
      }
      setIsBulkCreateDialogOpen(false);
      resetBulkForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk create users");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Sanitize CSV value to prevent CSV injection attacks
   * Removes potentially dangerous formula prefixes
   */
  const sanitizeCSVValue = (value: string): string => {
    const trimmed = value.trim();
    // Remove formula injection prefixes: =, +, -, @, \t, \r
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return trimmed.replace(/^[=+\-@\t\r]+/, "");
    }
    return trimmed;
  };

  /**
   * Simple CSV parser that handles basic quoted values
   */
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(sanitizeCSVValue(current));
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(sanitizeCSVValue(current));

    return result;
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        // Parse CSV with improved handling
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0); // Filter empty lines

        if (lines.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const parsed: UserFormData[] = [];
        const errors: string[] = [];
        let isHeader = true;

        lines.forEach((line, lineIndex) => {
          // Skip header if present
          if (
            isHeader &&
            (line.toLowerCase().includes("email") || line.toLowerCase().includes("mail"))
          ) {
            isHeader = false;
            return;
          }
          isHeader = false;

          const parts = parseCSVLine(line);
          if (parts.length < 2) {
            errors.push(`Line ${lineIndex + 1}: Missing required fields (email, password)`);
            return;
          }

          const email = sanitizeCSVValue(parts[0]);
          const password = sanitizeCSVValue(parts[1]);
          let role_id = activeTab === "client" ? 2 : 1; // Default: manager for client, admin for admin

          // Parse role if provided
          if (parts.length >= 3) {
            const roleValue = sanitizeCSVValue(parts[2]).toLowerCase();
            if (roleValue === "2" || roleValue === "manager") {
              role_id = 2;
            } else if (roleValue === "1" || roleValue === "admin") {
              role_id = 1;
            } else {
              errors.push(`Line ${lineIndex + 1}: Invalid role "${parts[2]}", using default`);
            }
          }

          // Validate email format
          if (!email || !EMAIL_REGEX.test(email)) {
            errors.push(`Line ${lineIndex + 1}: Invalid email format "${email}"`);
            return;
          }

          // Validate password strength and length
          if (!password) {
            errors.push(`Line ${lineIndex + 1}: Password is required`);
            return;
          }

          if (password.length < 8 || password.length > 128) {
            errors.push(
              `Line ${lineIndex + 1}: Password must be 8-128 characters (email: ${email})`
            );
            return;
          }

          if (!PASSWORD_REGEX.test(password)) {
            errors.push(
              `Line ${lineIndex + 1}: Password must contain uppercase, lowercase, number, and special character (email: ${email})`
            );
            return;
          }

          parsed.push({ email, password, role_id });
        });

        if (parsed.length > 0) {
          setBulkUsers(parsed);
          setBulkCreateMode("manual");
          if (errors.length > 0) {
            toast.warning(
              `Loaded ${parsed.length} valid user(s). ${errors.length} error(s) - check console for details.`
            );
            console.warn("CSV parsing errors:", errors);
          } else {
            toast.success(`Loaded ${parsed.length} user(s) from CSV`);
          }
        } else {
          toast.error(
            errors.length > 0
              ? `No valid users found. ${errors.length} error(s) - check console for details.`
              : "No valid users found in CSV file"
          );
          if (errors.length > 0) {
            console.error("CSV parsing errors:", errors);
          }
        }
      } catch (err) {
        toast.error("Failed to parse CSV file. Please check the format.");
        console.error("CSV parsing error:", err);
      }
    };
    reader.readAsText(file);
  };

  // Open edit dialog
  const openEditDialog = (user: AdminUser | ClientUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      role_id: user.role_id,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: AdminUser | ClientUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Open reset password dialog
  const openResetPasswordDialog = (user: AdminUser | ClientUser) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordError("");
    setIsResetPasswordDialogOpen(true);
  };

  // Open details dialog
  const openDetailsDialog = async (user: AdminUser | ClientUser) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
    setIsLoadingDetails(true);
    try {
      if (activeTab === "admin") {
        const details = await getAdminUser(user.uuid);
        setUserDetails(details);
      } else if (selectedRestaurantId) {
        const details = await getClientUser(selectedRestaurantId, user.uuid);
        setUserDetails(details);
      }
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const currentRoles = activeTab === "admin" ? ADMIN_ROLES : CLIENT_ROLES;

  const renderUserTable = (
    users: (AdminUser | ClientUser)[],
    loading: boolean,
    error: string | null,
    pagination: PaginationInfo | null,
    page: number,
    setPage: (p: number) => void
  ) => (
    <>
      {error && (
        <div className="text-center py-8 px-4 text-destructive bg-destructive/5 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Last Login</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uuid} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(user.role_id)}
                          onValueChange={(value) => handleRoleChange(user, Number(value))}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue>
                              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {currentRoles.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(user.last_login)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDetailsDialog(user)}
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
                                onClick={() => openResetPasswordDialog(user)}
                              >
                                <Key className="h-4 w-4 text-orange-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset Password</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(user)}
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
                                onClick={() => openDeleteDialog(user)}
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

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No users found</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add your first user
              </Button>
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Users"
          description="Manage platform admins and restaurant client users"
        />
        <main className="flex-1 p-4 lg:p-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">User Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage admin and client user accounts
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkCreateDialogOpen(true)}
                    className="shadow-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Create
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "admin" | "client")}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Users
                    {adminPagination && (
                      <Badge variant="secondary" className="ml-1">
                        {adminPagination.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client Users
                    {clientPagination && (
                      <Badge variant="secondary" className="ml-1">
                        {clientPagination.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="mt-4">
                  {renderUserTable(
                    adminUsers,
                    adminLoading,
                    adminError,
                    adminPagination,
                    adminPage,
                    setAdminPage
                  )}
                </TabsContent>

                <TabsContent value="client" className="mt-4 space-y-4">
                  {/* Restaurant selector */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Label className="whitespace-nowrap font-medium">Restaurant:</Label>
                    {restaurantsLoading ? (
                      <Skeleton className="h-10 w-[250px]" />
                    ) : (
                      <Select
                        value={selectedRestaurantId ? String(selectedRestaurantId) : ""}
                        onValueChange={(value) => {
                          setSelectedRestaurantId(Number(value));
                          setClientPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[300px]">
                          <SelectValue placeholder="Select a restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map((restaurant) => (
                            <SelectItem key={restaurant.id} value={String(restaurant.id)}>
                              {restaurant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {selectedRestaurantId ? (
                    renderUserTable(
                      clientUsers,
                      clientLoading,
                      clientError,
                      clientPagination,
                      clientPage,
                      setClientPage
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Select a restaurant to view its users</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedUser(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditDialogOpen ? (
                <>
                  <Pencil className="h-5 w-5" /> Edit User
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> Create {activeTab === "admin" ? "Admin" : "Client"}{" "}
                  User
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? `Editing: ${selectedUser?.email}`
                : `Add a new ${activeTab === "admin" ? "platform admin" : "restaurant client"} user.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="user@example.com"
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            {isCreateDialogOpen && (
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (formErrors.password)
                      setFormErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="8-128 chars: uppercase, lowercase, number, special char"
                  className={formErrors.password ? "border-destructive" : ""}
                />
                {formErrors.password && (
                  <p className="text-xs text-destructive">{formErrors.password}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(formData.role_id)}
                onValueChange={(value) => setFormData({ ...formData, role_id: Number(value) })}
              >
                <SelectTrigger className={formErrors.role_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {currentRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role_id && (
                <p className="text-xs text-destructive">{formErrors.role_id}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleEdit : handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditDialogOpen ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" /> Reset Password
            </DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.email}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_password">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                placeholder="8-128 chars: uppercase, lowercase, number, special char"
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setNewPassword("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" /> User Details
            </DialogTitle>
            <DialogDescription>Complete information for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="space-y-3 py-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : userDetails ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">UUID:</span>
                  <p className="font-mono text-xs mt-1 break-all">{userDetails.uuid}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium mt-1">{userDetails.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <p className="mt-1">
                    <Badge variant={getRoleBadgeVariant(userDetails.role)}>
                      {userDetails.role}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Permissions:</span>
                  <p className="font-mono text-xs mt-1">
                    {userDetails.permissions.join(", ") || "None"}
                  </p>
                </div>
                {"restaurant_name" in userDetails && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Restaurant:</span>
                    <p className="font-medium mt-1">{userDetails.restaurant_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Last Login:</span>
                  <p className="mt-1">{formatDate(userDetails.last_login)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Active:</span>
                  <p className="mt-1">{formatDate(userDetails.last_active)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="mt-1">{formatDate(userDetails.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>
                  <p className="mt-1">{formatDate(userDetails.updated_at)}</p>
                </div>
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
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.email}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Bulk Create{" "}
              {activeTab === "admin" ? "Admin" : "Client"} Users
            </DialogTitle>
            <DialogDescription>
              Create multiple {activeTab === "admin" ? "admin" : "client"} users at once. You can
              add users manually or upload a CSV file.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs
              value={bulkCreateMode}
              onValueChange={(v) => setBulkCreateMode(v as "manual" | "csv")}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="csv" className="mt-4">
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">CSV File Format</Label>
                    <div className="text-xs text-muted-foreground space-y-1 mb-4">
                      <p>
                        Upload a CSV file with the following columns: <code>email</code>,{" "}
                        <code>password</code>, <code>role_id</code> (optional)
                      </p>
                      <p>Example:</p>
                      <pre className="bg-background p-2 rounded text-xs border">
                        {`email,password,role_id
user1@example.com,StrongPass1,1
user2@example.com,StrongPass2,2`}
                      </pre>
                      <p className="mt-2">
                        <strong>Role IDs:</strong> 1 = Admin, 2 = Manager
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="cursor-pointer"
                    />
                    <div className="text-xs text-muted-foreground">
                      CSV file will be parsed and loaded below
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Users ({bulkUsers.length} {bulkUsers.length === 1 ? "user" : "users"})
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBulkUserRow}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                    {bulkUsers.map((user, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-start p-3 bg-background border rounded-lg"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <Label className="text-xs mb-1">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="email"
                            value={user.email}
                            onChange={(e) => updateBulkUser(index, "email", e.target.value)}
                            placeholder="user@example.com"
                            className={bulkErrors[index]?.email ? "border-destructive h-9" : "h-9"}
                          />
                          {bulkErrors[index]?.email && (
                            <p className="text-xs text-destructive mt-1">
                              {bulkErrors[index].email}
                            </p>
                          )}
                        </div>

                        <div className="col-span-12 sm:col-span-4">
                          <Label className="text-xs mb-1">
                            Password <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="password"
                            value={user.password}
                            onChange={(e) => updateBulkUser(index, "password", e.target.value)}
                            placeholder="8-128 chars: uppercase, lowercase, number, special char"
                            className={
                              bulkErrors[index]?.password ? "border-destructive h-9" : "h-9"
                            }
                          />
                          {bulkErrors[index]?.password && (
                            <p className="text-xs text-destructive mt-1">
                              {bulkErrors[index].password}
                            </p>
                          )}
                        </div>

                        <div className="col-span-10 sm:col-span-3">
                          <Label className="text-xs mb-1">
                            Role <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={String(user.role_id)}
                            onValueChange={(value) =>
                              updateBulkUser(index, "role_id", Number(value))
                            }
                          >
                            <SelectTrigger
                              className={
                                bulkErrors[index]?.role_id ? "border-destructive h-9" : "h-9"
                              }
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currentRoles.map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {bulkErrors[index]?.role_id && (
                            <p className="text-xs text-destructive mt-1">
                              {bulkErrors[index].role_id}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2 sm:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeBulkUserRow(index)}
                            disabled={bulkUsers.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkCreateDialogOpen(false);
                resetBulkForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkCreate} disabled={isSubmitting || bulkUsers.length === 0}>
              {isSubmitting ? "Creating..." : `Create ${bulkUsers.length} User(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
