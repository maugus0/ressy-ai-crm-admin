import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Shield, User } from "lucide-react";
import { getRestaurants } from "@/services/restaurants";
import { getAdminUsers, getClientUsers } from "@/services/users";
import type { Restaurant, AdminUser, ClientUser, PaginationInfo } from "@/types/api.types";

const Users = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminPagination, setAdminPagination] = useState<PaginationInfo | null>(null);
  const [adminPage, setAdminPage] = useState(1);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Client users state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [clientPagination, setClientPagination] = useState<PaginationInfo | null>(null);
  const [clientPage, setClientPage] = useState(1);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Fetch admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        setIsLoadingAdmin(true);
        setAdminError(null);
        const data = await getAdminUsers({ page: adminPage, limit: 10 });
        setAdminUsers(data.items);
        setAdminPagination(data.pagination);
      } catch (err) {
        setAdminError(err instanceof Error ? err.message : "Failed to load admin users");
      } finally {
        setIsLoadingAdmin(false);
      }
    };
    fetchAdminUsers();
  }, [adminPage]);

  // Fetch restaurants for client users
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data.restaurants);
        if (data.restaurants.length > 0) {
          setSelectedRestaurantId(data.restaurants[0].id);
        }
      } catch (err) {
        setClientError(err instanceof Error ? err.message : "Failed to load restaurants");
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch client users when restaurant or page changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const fetchClientUsers = async () => {
      try {
        setIsLoadingClient(true);
        setClientError(null);
        const data = await getClientUsers(selectedRestaurantId, { page: clientPage, limit: 10 });
        setClientUsers(data.items);
        setClientPagination(data.pagination);
      } catch (err) {
        setClientError(err instanceof Error ? err.message : "Failed to load client users");
      } finally {
        setIsLoadingClient(false);
      }
    };
    fetchClientUsers();
  }, [selectedRestaurantId, clientPage]);

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
    setClientPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Users
                  </TabsTrigger>
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Users
                  </TabsTrigger>
                </TabsList>

                {/* Admin Users Tab */}
                <TabsContent value="admin">
                  {adminError && (
                    <div className="text-center py-8 text-destructive">{adminError}</div>
                  )}

                  {isLoadingAdmin ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminUsers.map((user) => (
                            <TableRow key={user.uuid}>
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="default">{user.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {user.permissions.slice(0, 3).map((perm, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                  {user.permissions.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{user.permissions.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(user.last_login)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Admin Pagination */}
                      {adminPagination && adminPagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Page {adminPagination.page} of {adminPagination.pages} (
                            {adminPagination.total} users)
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                              disabled={adminPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAdminPage((p) => Math.min(adminPagination.pages, p + 1))
                              }
                              disabled={adminPage === adminPagination.pages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {adminUsers.length === 0 && !adminError && (
                        <div className="text-center py-8 text-muted-foreground">
                          No admin users found
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Client Users Tab */}
                <TabsContent value="client">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Restaurant:</span>
                    <Select
                      value={selectedRestaurantId?.toString() || ""}
                      onValueChange={handleRestaurantChange}
                      disabled={isLoadingRestaurants}
                    >
                      <SelectTrigger className="w-[250px]">
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
                  </div>

                  {clientError && (
                    <div className="text-center py-8 text-destructive">{clientError}</div>
                  )}

                  {isLoadingClient ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Restaurant</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientUsers.map((user) => (
                            <TableRow key={user.uuid}>
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell className="text-sm">{user.restaurant_name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{user.role}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(user.last_login)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Client Pagination */}
                      {clientPagination && clientPagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Page {clientPagination.page} of {clientPagination.pages} (
                            {clientPagination.total} users)
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                              disabled={clientPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setClientPage((p) => Math.min(clientPagination.pages, p + 1))
                              }
                              disabled={clientPage === clientPagination.pages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {clientUsers.length === 0 && !clientError && selectedRestaurantId && (
                        <div className="text-center py-8 text-muted-foreground">
                          No client users found for this restaurant
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Users;
