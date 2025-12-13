import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getFAQs } from "@/services/faq";
import type { Restaurant, FAQ as FAQType, PaginationInfo } from "@/types/api.types";

const FAQ = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(data.restaurants);
        if (data.restaurants.length > 0) {
          setSelectedRestaurantId(data.restaurants[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load restaurants");
      } finally {
        setIsLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Fetch FAQs when restaurant or page changes
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const fetchFAQs = async () => {
      try {
        setIsLoadingFAQs(true);
        setError(null);
        const data = await getFAQs(selectedRestaurantId, { page: currentPage, limit: 20 });
        setFaqs(data.items);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load FAQs");
      } finally {
        setIsLoadingFAQs(false);
      }
    };
    fetchFAQs();
  }, [selectedRestaurantId, currentPage]);

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurantId(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <CardTitle>FAQs</CardTitle>
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

              {isLoadingFAQs ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead className="w-[120px]">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id}>
                          <TableCell className="font-medium">{faq.id}</TableCell>
                          <TableCell className="font-medium">{faq.question}</TableCell>
                          <TableCell className="text-muted-foreground">{faq.answer}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(faq.created_at).toLocaleDateString()}
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

              {!isLoadingFAQs && !error && faqs.length === 0 && selectedRestaurantId && (
                <div className="text-center py-8 text-muted-foreground">
                  No FAQs found for this restaurant
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default FAQ;
