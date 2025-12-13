import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRestaurants } from "@/services/restaurants";
import { getMenuItems } from "@/services/menu";
import type { Restaurant, MenuItem, PaginationInfo } from "@/types/api.types";

const Menu = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data.items);
        if (data.items.length > 0) {
          setSelectedRestaurantId(data.items[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load restaurants");
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch menu items when restaurant or page changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const fetchMenu = async () => {
      try {
        setIsLoadingMenu(true);
        setError(null);
        const data = await getMenuItems(selectedRestaurantId, { page: currentPage, limit: 20 });
        setMenuItems(data.items);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, [selectedRestaurantId, currentPage]);

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Menu"
          description="Manage menu items for each restaurant"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <CardTitle>Menu Items</CardTitle>
                <div className="flex items-center gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              {error && <div className="text-center py-8 text-destructive">{error}</div>}

              {isLoadingMenu ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Prep Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {item.item_desc && (
                                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {item.item_desc}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline">{item.category}</Badge>
                              {item.sub_category && (
                                <span className="text-xs text-muted-foreground">
                                  {item.sub_category}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">${item.price}</TableCell>
                          <TableCell className="text-sm">{item.avg_prep_time} min</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={item.is_available ? "default" : "secondary"}>
                                {item.is_available ? "Available" : "Unavailable"}
                              </Badge>
                              {item.is_special && <Badge variant="destructive">Special</Badge>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                          disabled={currentPage === pagination.pages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!isLoadingMenu && !error && menuItems.length === 0 && selectedRestaurantId && (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found for this restaurant
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Menu;
