import { Menu, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-background border-b border-border p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-accent rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
            Admin • Clients & Tiers
          </h1>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block ml-0 lg:ml-0">
          Onboard clients, set privileges per tier or override per client, and allocate per-minute
          costs
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <h2 className="text-lg lg:text-xl font-semibold text-foreground">Clients</h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search clients..." className="pl-10 w-full sm:w-64 lg:w-80" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 sm:flex-initial">
              Bulk actions
            </Button>
            <Button className="flex-1 sm:flex-initial">Onboard new</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
