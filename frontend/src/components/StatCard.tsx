import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: { value: number; positive?: boolean };
  tint?: "default" | "danger" | "success" | "warning";
  delay?: number;
}

const sparkPath = "M0 22 L10 18 L20 20 L30 12 L40 16 L50 8 L60 14 L70 6 L80 10";

export default function StatCard({ label, value, icon, trend, tint = "default", delay = 0 }: StatCardProps) {
  const tintClass = {
    default: "from-primary/20 to-transparent",
    danger: "from-danger/25 to-transparent",
    success: "from-success/20 to-transparent",
    warning: "from-warning/20 to-transparent",
  }[tint];

  const iconBg = {
    default: "bg-primary/15 text-primary",
    danger: "bg-danger/15 text-danger",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
  }[tint];

  const sparkColor = {
    default: "stroke-primary",
    danger: "stroke-danger",
    success: "stroke-success",
    warning: "stroke-warning",
  }[tint];

  return (
    <div
      className="surface surface-hover relative overflow-hidden p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl bg-gradient-to-br", tintClass)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBg)}>{icon}</div>
      </div>
      <div className="relative mt-4 flex items-end justify-between">
        {trend && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trend.positive ? "text-success" : "text-danger")}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
        <svg viewBox="0 0 80 24" className="h-6 w-24" fill="none">
          <path d={sparkPath} className={cn(sparkColor)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
