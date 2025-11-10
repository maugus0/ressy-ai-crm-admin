import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const BillingRules = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-6">Billing rules</h2>

            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-sm sm:text-base font-medium text-foreground">
                  Default per-minute rate
                </h3>
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  $0.25/min
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Edit tier rates in the Tiers tab. You can still override per-client rates in the
                client drawer.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BillingRules;
