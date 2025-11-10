import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface TierConfig {
  name: string;
  seats: number;
  rate: number;
  privileges: {
    transcripts: boolean;
    analytics: boolean;
    database: boolean;
    integrations: boolean;
    expenses: boolean;
    api: boolean;
    multiLocation: boolean;
    slaSupport: boolean;
  };
}

const initialTiers: Record<string, TierConfig> = {
  Free: {
    name: "Free",
    seats: 1,
    rate: 0.35,
    privileges: {
      transcripts: true,
      analytics: false,
      database: false,
      integrations: false,
      expenses: false,
      api: false,
      multiLocation: false,
      slaSupport: false,
    },
  },
  Standard: {
    name: "Standard",
    seats: 3,
    rate: 0.25,
    privileges: {
      transcripts: true,
      analytics: true,
      database: true,
      integrations: true,
      expenses: true,
      api: false,
      multiLocation: false,
      slaSupport: false,
    },
  },
  Pro: {
    name: "Pro",
    seats: 10,
    rate: 0.18,
    privileges: {
      transcripts: true,
      analytics: true,
      database: true,
      integrations: true,
      expenses: true,
      api: false,
      multiLocation: true,
      slaSupport: false,
    },
  },
  Enterprise: {
    name: "Enterprise",
    seats: 100,
    rate: 0.12,
    privileges: {
      transcripts: true,
      analytics: true,
      database: true,
      integrations: true,
      expenses: true,
      api: true,
      multiLocation: true,
      slaSupport: true,
    },
  },
};

const tierColors = {
  Free: "bg-tier-free",
  Standard: "bg-tier-standard",
  Pro: "bg-tier-pro",
  Enterprise: "bg-primary",
};

const Tiers = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tiers, setTiers] = useState(initialTiers);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleRateChange = (tierName: string, value: string) => {
    setEditingRates((prev) => ({
      ...prev,
      [tierName]: value,
    }));
  };

  const updateRate = async (tierName: string) => {
    const newRate = parseFloat(editingRates[tierName] || "0");

    if (isNaN(newRate) || newRate < 0) {
      toast({
        title: "Invalid rate",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    setTiers((prev) => ({
      ...prev,
      [tierName]: {
        ...prev[tierName],
        rate: newRate,
      },
    }));

    setEditingRates((prev) => {
      const updated = { ...prev };
      delete updated[tierName];
      return updated;
    });

    toast({
      title: "Rate updated",
      description: `${tierName} tier rate updated to $${newRate.toFixed(2)}/min`,
    });
  };

  const privilegeLabels = {
    transcripts: "Transcripts",
    analytics: "Analytics",
    database: "Database",
    integrations: "Integrations",
    expenses: "Expenses",
    api: "Api",
    multiLocation: "MultiLocation",
    slaSupport: "SlaSupport",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Header */}
        <div className="bg-background border-b border-border p-4 lg:p-6">
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
                Admin • Clients & Tiers
              </h1>
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Onboard clients, set privileges per tier or override per client, and allocate
              per-minute costs
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-6">
              Tier configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              {Object.entries(tiers).map(([tierName, config]) => (
                <div key={tierName} className="bg-card border border-border rounded-lg p-4 lg:p-6">
                  {/* Tier Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-semibold text-foreground">
                      {config.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${tierColors[tierName as keyof typeof tierColors]}`}
                    >
                      {config.name}
                    </span>
                  </div>

                  {/* Tier Info */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Seats: <span className="text-foreground font-medium">{config.seats}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Rate:{" "}
                      <span className="text-foreground font-medium">
                        ${config.rate.toFixed(2)}/min
                      </span>
                    </p>
                  </div>

                  {/* Privileges */}
                  <div className="space-y-2 mb-6">
                    {Object.entries(config.privileges).map(([privilege, enabled]) => (
                      <div key={privilege} className="flex items-center space-x-2">
                        <Checkbox
                          checked={enabled}
                          disabled
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span
                          className={`text-xs ${enabled ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {privilegeLabels[privilege as keyof typeof privilegeLabels]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rate Update */}
                  <div className="space-y-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={config.rate.toFixed(2)}
                      value={editingRates[tierName] || ""}
                      onChange={(e) => handleRateChange(tierName, e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRate(tierName)}
                      className="w-full"
                      disabled={!editingRates[tierName]}
                    >
                      Update rate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tiers;
