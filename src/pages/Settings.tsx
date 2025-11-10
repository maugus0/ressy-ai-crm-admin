import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
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
              <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
            {/* Account Settings */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <h2 className="text-base lg:text-lg font-semibold text-foreground mb-4">
                Account Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" placeholder="Ressy Admin" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="admin@ressy.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="mt-1.5" />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <h2 className="text-base lg:text-lg font-semibold text-foreground mb-4">
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive email updates about new clients
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Billing Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified about billing changes
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Weekly Reports</p>
                    <p className="text-xs text-muted-foreground">Receive weekly summary reports</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <h2 className="text-base lg:text-lg font-semibold text-foreground mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
