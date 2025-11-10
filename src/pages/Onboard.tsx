import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const onboardSchema = z.object({
  clientId: z
    .string()
    .trim()
    .min(1, "Client ID is required")
    .max(50, "Client ID must be less than 50 characters"),
  businessName: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(100, "Business name must be less than 100 characters"),
  contactEmail: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  tier: z.enum(["Free", "Standard", "Pro", "Enterprise"]),
  customRate: z.string().optional(),
});

type OnboardFormData = z.infer<typeof onboardSchema>;

const privilegeOptions = [
  { id: "transcripts", label: "Transcripts", tiers: ["Free", "Standard", "Pro", "Enterprise"] },
  { id: "analytics", label: "Analytics", tiers: ["Standard", "Pro", "Enterprise"] },
  { id: "database", label: "Database", tiers: ["Standard", "Pro", "Enterprise"] },
  { id: "integrations", label: "Integrations", tiers: ["Pro", "Enterprise"] },
  { id: "expenses", label: "Expenses", tiers: ["Standard", "Pro", "Enterprise"] },
  { id: "api", label: "Api", tiers: ["Enterprise"] },
  { id: "multiLocation", label: "MultiLocation", tiers: ["Pro", "Enterprise"] },
  { id: "slaSupport", label: "SlaSupport", tiers: ["Enterprise"] },
];

const Onboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"Free" | "Standard" | "Pro" | "Enterprise">(
    "Standard"
  );
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<OnboardFormData>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      tier: "Standard",
    },
  });

  const onSubmit = async (data: OnboardFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Client onboarded successfully",
        description: `${data.businessName} has been added to the system.`,
      });

      console.log("Onboard data:", data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to onboard client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTierChange = (tier: string) => {
    const tierValue = tier as "Free" | "Standard" | "Pro" | "Enterprise";
    setSelectedTier(tierValue);
    setValue("tier", tierValue);
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
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h2 className="text-lg lg:text-xl font-semibold text-foreground">Onboard client</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fields with <span className="text-destructive">*</span> are required
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="clientId" className="text-foreground">
                      Client ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="clientId"
                      placeholder="e.g., acme-bistro"
                      className="mt-2"
                      {...register("clientId")}
                    />
                    {errors.clientId && (
                      <p className="text-sm text-destructive mt-1">{errors.clientId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="businessName" className="text-foreground">
                      Business name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Acme Bistro"
                      className="mt-2"
                      {...register("businessName")}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-destructive mt-1">{errors.businessName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactEmail" className="text-foreground">
                      Contact email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="owner@example.com"
                      className="mt-2"
                      {...register("contactEmail")}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-foreground">
                      Tier <span className="text-destructive">*</span>
                    </Label>
                    <Select value={selectedTier} onValueChange={handleTierChange}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Free">Free</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customRate" className="text-foreground">
                      Custom rate (optional)
                    </Label>
                    <div className="flex items-center mt-2 gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="customRate"
                        type="number"
                        step="0.01"
                        placeholder="0.25"
                        className="flex-1"
                        {...register("customRate")}
                      />
                      <span className="text-muted-foreground whitespace-nowrap">per minute</span>
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
                    {isSubmitting ? "Saving..." : "Save client"}
                  </Button>
                </form>
              </div>

              {/* Privileges Preview */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4">
                    Privileges preview
                  </h3>

                  <div className="space-y-3">
                    {privilegeOptions.map((privilege) => {
                      const isEnabled = privilege.tiers.includes(selectedTier);
                      return (
                        <div key={privilege.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={isEnabled}
                            disabled
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label
                            className={`text-sm ${isEnabled ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {privilege.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Onboard;
