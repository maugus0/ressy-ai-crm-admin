import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Phone, Mail, Calendar } from "lucide-react";

// Placeholder data - will be replaced with API integration
const mockCallers = [
  {
    id: 1,
    phone_number: "+1 (555) 123-4567",
    name: "John Smith",
    email: "john.smith@email.com",
    total_calls: 12,
    total_orders: 5,
    last_call_at: "2025-12-12T14:30:00",
  },
  {
    id: 2,
    phone_number: "+1 (555) 234-5678",
    name: "Jane Doe",
    email: "jane.doe@email.com",
    total_calls: 8,
    total_orders: 3,
    last_call_at: "2025-12-11T18:45:00",
  },
  {
    id: 3,
    phone_number: "+1 (555) 345-6789",
    name: null,
    email: null,
    total_calls: 2,
    total_orders: 0,
    last_call_at: "2025-12-10T12:00:00",
  },
];

const Callers = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCallers = mockCallers.filter(
    (caller) =>
      caller.phone_number.includes(searchQuery) ||
      caller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caller.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Callers"
          description="View caller information and call history"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>All Callers</CardTitle>
                  <Badge variant="secondary">{mockCallers.length} total</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search callers..."
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Calls</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Last Call</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCallers.map((caller) => (
                    <TableRow key={caller.id}>
                      <TableCell className="font-medium">{caller.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {caller.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>{caller.name || "-"}</TableCell>
                      <TableCell>
                        {caller.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {caller.email}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{caller.total_calls}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{caller.total_orders}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(caller.last_call_at).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredCallers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No callers found</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Callers;
