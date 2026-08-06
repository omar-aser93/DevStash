import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  iconFillClass?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  iconFillClass,
}: StatsCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 shadow-sm backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <div className={cn("p-2.5 rounded-lg", iconBgClass, iconColorClass)}>
        <Icon className={cn("size-5", iconFillClass)} />
      </div>
    </div>
  );
}
