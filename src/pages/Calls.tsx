import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Phone, PhoneIncoming, PhoneOutgoing, Clock, FileText, Play } from "lucide-react";

// Placeholder data - will be replaced with API integration
const mockCalls = [
  {
    id: 1,
    restaurant_name: "Amici Italian Grill",
    caller_phone: "+1 (555) 123-4567",
    direction: "inbound",
    status: "completed",
    duration_seconds: 245,
    recording_url: "https://example.com/recording1.mp3",
    transcript_id: 1,
    started_at: "2025-12-12T14:30:00",
  },
  {
    id: 2,
    restaurant_name: "Biryani Lounge",
    caller_phone: "+1 (555) 234-5678",
    direction: "inbound",
    status: "completed",
    duration_seconds: 180,
    recording_url: null,
    transcript_id: 2,
    started_at: "2025-12-12T13:15:00",
  },
  {
    id: 3,
    restaurant_name: "Coco Rico Cafe",
    caller_phone: "+1 (555) 345-6789",
    direction: "outbound",
    status: "missed",
    duration_seconds: 0,
    recording_url: null,
    transcript_id: null,
    started_at: "2025-12-12T12:00:00",
  },
  {
    id: 4,
    restaurant_name: "House of Dosas",
    caller_phone: "+1 (555) 456-7890",
    direction: "inbound",
    status: "in-progress",
    duration_seconds: 60,
    recording_url: null,
    transcript_id: null,
    started_at: "2025-12-12T15:00:00",
  },
];

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "missed":
      return "destructive";
    case "in-progress":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

const Calls = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredCalls = mockCalls.filter((call) => {
    const matchesSearch =
      call.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.caller_phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && call.status === activeTab;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          title="Calls"
          description="View call history, recordings, and transcripts"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Call History</CardTitle>
                  <Badge variant="secondary">{mockCalls.length} total</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search calls..."
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
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="missed">Missed</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                </TabsList>
              </Tabs>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.id}</TableCell>
                      <TableCell>{call.restaurant_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {call.caller_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {call.direction === "inbound" ? (
                            <PhoneIncoming className="h-4 w-4 text-green-600" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                          )}
                          {call.direction}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(call.status) as "default"}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatDuration(call.duration_seconds)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(call.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {call.recording_url && (
                            <Button variant="ghost" size="icon" title="Play recording">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {call.transcript_id && (
                            <Button variant="ghost" size="icon" title="View transcript">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredCalls.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No calls found</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Calls;
