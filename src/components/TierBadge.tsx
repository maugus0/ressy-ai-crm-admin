import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: "Standard" | "Pro" | "Free";
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const variants = {
    Standard: "bg-tier-standard text-white",
    Pro: "bg-tier-pro text-white",
    Free: "bg-tier-free text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        variants[tier],
        className
      )}
    >
      {tier}
    </span>
  );
}