import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "./TierBadge";
import { ClientManagementPanel } from "./ClientManagementPanel";

interface Client {
  id: string;
  name: string;
  slug: string;
  tier: "Standard" | "Pro" | "Free";
  rate: string;
  privileges: string;
  contact: string;
}

const clients: Client[] = [
  {
    id: "1",
    name: "Acme Bistro",
    slug: "acme-bistro",
    tier: "Standard",
    rate: "$0.25/min",
    privileges: "transcripts, analytics, database...",
    contact: "alex@acme.com",
  },
  {
    id: "2",
    name: "North Ortho",
    slug: "north-ortho",
    tier: "Pro",
    rate: "$0.20/min",
    privileges: "transcripts, analytics, database...",
    contact: "ops@northortho.com",
  },
  {
    id: "3",
    name: "Blue Hotel",
    slug: "blue-hotel",
    tier: "Free",
    rate: "$0.35/min",
    privileges: "transcripts, analytics",
    contact: "gm@bluehotel.com",
  },
];

export function ClientsTable() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleManageClick = (client: Client) => {
    setSelectedClient(client);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="bg-background">
      {/* Mobile Card View */}
      <div className="lg:hidden p-4 space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-foreground">{client.name}</div>
                <div className="text-sm text-muted-foreground">{client.slug}</div>
              </div>
              <TierBadge tier={client.tier} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span className="text-foreground font-medium">{client.rate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Privileges:</span>
                <p className="text-foreground mt-1">{client.privileges}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact:</span>
                <span className="text-foreground">{client.contact}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleManageClick(client)}
            >
              Manage
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground bg-table-header">
                Client
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground bg-table-header">
                Tier
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground bg-table-header">
                Rate
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground bg-table-header">
                Privileges
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground bg-table-header">
                Contact
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground bg-table-header">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-border hover:bg-table-row-hover transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-foreground">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <TierBadge tier={client.tier} />
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{client.rate}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{client.privileges}</td>
                <td className="px-6 py-4 text-sm text-foreground">{client.contact}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => handleManageClick(client)}>
                    Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientManagementPanel
        client={selectedClient}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </div>
  );
}
