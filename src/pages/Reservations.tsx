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
import { Search, Calendar, Clock, Users, Phone } from "lucide-react";

// Placeholder data - will be replaced with API integration
const mockReservations = [
  {
    id: 1,
    restaurant_name: "Amici Italian Grill",
    customer_name: "John Smith",
    customer_phone: "+1 (555) 123-4567",
    party_size: 4,
    reservation_date: "2025-12-15",
    reservation_time: "19:00",
    status: "confirmed",
    source: "phone",
  },
  {
    id: 2,
    restaurant_name: "Biryani Lounge",
    customer_name: "Jane Doe",
    customer_phone: "+1 (555) 234-5678",
    party_size: 2,
    reservation_date: "2025-12-14",
    reservation_time: "18:30",
    status: "pending",
    source: "web",
  },
  {
    id: 3,
    restaurant_name: "Coco Rico Cafe",
    customer_name: "Bob Wilson",
    customer_phone: "+1 (555) 345-6789",
    party_size: 6,
    reservation_date: "2025-12-16",
    reservation_time: "20:00",
    status: "seated",
    source: "opentable",
  },
  {
    id: 4,
    restaurant_name: "House of Dosas",
    customer_name: "Alice Brown",
    customer_phone: "+1 (555) 456-7890",
    party_size: 3,
    reservation_date: "2025-12-13",
    reservation_time: "12:30",
    status: "completed",
    source: "phone",
  },
  {
    id: 5,
    restaurant_name: "Ressy's Diner",
    customer_name: "Charlie Green",
    customer_phone: "+1 (555) 567-8901",
    party_size: 2,
    reservation_date: "2025-12-13",
    reservation_time: "19:30",
    status: "no-show",
    source: "manual",
  },
  {
    id: 6,
    restaurant_name: "Amici Italian Grill",
    customer_name: "Diana Prince",
    customer_phone: "+1 (555) 678-9012",
    party_size: 5,
    reservation_date: "2025-12-14",
    reservation_time: "20:30",
    status: "cancelled",
    source: "web",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "seated":
      return "default";
    case "completed":
      return "outline";
    case "cancelled":
      return "destructive";
    case "no-show":
      return "destructive";
    default:
      return "secondary";
  }
};

const getSourceBadge = (source: string) => {
  switch (source) {
    case "phone":
      return { label: "Phone", variant: "outline" as const };
    case "web":
      return { label: "Web", variant: "secondary" as const };
    case "opentable":
      return { label: "OpenTable", variant: "default" as const };
    case "manual":
      return { label: "Manual", variant: "outline" as const };
    default:
      return { label: source, variant: "outline" as const };
  }
};

const Reservations = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredReservations = mockReservations.filter((reservation) => {
    const matchesSearch =
      reservation.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.customer_phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && reservation.status === activeTab;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Reservations"
          description="Manage reservations across all restaurants"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>All Reservations</CardTitle>
                  <Badge variant="secondary">{mockReservations.length} total</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reservations..."
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
                  <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                  <TabsTrigger value="seated">Seated</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Party Size</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.id}</TableCell>
                      <TableCell>{reservation.restaurant_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.customer_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.customer_phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {reservation.party_size}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(reservation.reservation_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {reservation.reservation_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSourceBadge(reservation.source).variant}>
                          {getSourceBadge(reservation.source).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(reservation.status) as "default"}>
                          {reservation.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredReservations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No reservations found</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Reservations;
