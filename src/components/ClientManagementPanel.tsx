import { useState } from "react";
import { X } from "lucide-react";
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
import { TierBadge } from "./TierBadge";

interface Client {
  id: string;
  name: string;
  slug: string;
  tier: "Standard" | "Pro" | "Free";
  rate: string;
  privileges: string;
  contact: string;
}

interface ClientManagementPanelProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const privilegeOptions = [
  { id: "transcripts", label: "Transcripts", defaultChecked: true },
  { id: "analytics", label: "Analytics", defaultChecked: true },
  { id: "database", label: "Database", defaultChecked: true },
  { id: "integrations", label: "Integrations", defaultChecked: true },
  { id: "expenses", label: "Expenses", defaultChecked: true },
  { id: "api", label: "Api", defaultChecked: false },
  { id: "multiLocation", label: "MultiLocation", defaultChecked: false },
  { id: "slaSupport", label: "SlaSupport", defaultChecked: false },
];

export function ClientManagementPanel({ client, isOpen, onClose }: ClientManagementPanelProps) {
  const [selectedTier, setSelectedTier] = useState(client?.tier || "Standard");
  const [customRate, setCustomRate] = useState(client?.rate.replace(/[/$min]/g, "") || "0.25");
  const [privileges, setPrivileges] = useState(
    privilegeOptions.reduce(
      (acc, privilege) => ({
        ...acc,
        [privilege.id]: privilege.defaultChecked,
      }),
      {}
    )
  );

  if (!isOpen || !client) return null;

  const handlePrivilegeChange = (privilegeId: string, checked: boolean) => {
    setPrivileges((prev) => ({
      ...prev,
      [privilegeId]: checked,
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">{client.name}</h2>
            <p className="text-sm text-gray-400">{client.slug}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Tier Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Tier</Label>
              <Select
                value={selectedTier}
                onValueChange={(value) => setSelectedTier(value as "Standard" | "Pro" | "Free")}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Custom rate</Label>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white flex-1"
                />
                <span className="text-gray-400 ml-2">/min</span>
              </div>
            </div>
          </div>

          {/* Privileges */}
          <div>
            <Label className="text-sm text-gray-300 mb-4 block">Privileges</Label>
            <div className="grid grid-cols-2 gap-3">
              {privilegeOptions.map((privilege) => (
                <div key={privilege.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={privilege.id}
                    checked={privileges[privilege.id]}
                    onCheckedChange={(checked) =>
                      handlePrivilegeChange(privilege.id, checked as boolean)
                    }
                    className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor={privilege.id} className="text-sm text-gray-300 cursor-pointer">
                    {privilege.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Effective Cost */}
          <div className="flex items-center justify-between py-4 border-t border-gray-700">
            <span className="text-sm text-gray-300">Effective per-minute cost</span>
            <span className="font-semibold">${customRate}/min</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button className="bg-white text-gray-900 hover:bg-gray-100">Save</Button>
        </div>
      </div>
    </>
  );
}
