import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, DollarSign, Clock, ShoppingBag } from "lucide-react";

// Placeholder data - will be replaced with API integration
const mockOrders = [
  {
    id: 1,
    restaurant_name: "Amici Italian Grill",
    caller_phone: "+1 (555) 123-4567",
    status: "completed",
    total_amount: "45.99",
    items_count: 3,
    created_at: "2025-12-12T14:30:00",
  },
  {
    id: 2,
    restaurant_name: "Biryani Lounge",
    caller_phone: "+1 (555) 234-5678",
    status: "pending",
    total_amount: "32.50",
    items_count: 2,
    created_at: "2025-12-12T15:00:00",
  },
  {
    id: 3,
    restaurant_name: "Coco Rico Cafe",
    caller_phone: "+1 (555) 345-6789",
    status: "preparing",
    total_amount: "18.75",
    items_count: 1,
    created_at: "2025-12-12T15:15:00",
  },
  {
    id: 4,
    restaurant_name: "House of Dosas",
    caller_phone: "+1 (555) 456-7890",
    status: "cancelled",
    total_amount: "28.00",
    items_count: 2,
    created_at: "2025-12-12T13:00:00",
  },
  {
    id: 5,
    restaurant_name: "Ressy's Diner",
    caller_phone: "+1 (555) 567-8901",
    status: "ready",
    total_amount: "55.25",
    items_count: 4,
    created_at: "2025-12-12T14:45:00",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "preparing":
      return "outline";
    case "ready":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const Orders = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.caller_phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && order.status === activeTab;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Orders"
          description="View and manage orders across all restaurants"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Order History</CardTitle>
                  <Badge variant="secondary">{mockOrders.length} total</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed border-amber-500 bg-amber-50 p-4 mb-4">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> This page uses placeholder data. API integration pending.
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="preparing">Preparing</TabsTrigger>
                  <TabsTrigger value="ready">Ready</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.restaurant_name}</TableCell>
                      <TableCell>{order.caller_phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          {order.items_count} items
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {order.total_amount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status) as "default"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No orders found</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Orders;
