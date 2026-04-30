import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: "low" | "medium" | "high"; className?: string }) {
  const map = {
    low: { dot: "bg-success", text: "text-success", bg: "bg-success/10", label: "Low" },
    medium: { dot: "bg-warning", text: "text-warning", bg: "bg-warning/10", label: "Medium" },
    high: { dot: "bg-danger", text: "text-danger", bg: "bg-danger/10", label: "High" },
  } as const;
  const c = map[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", c.bg, c.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: "todo" | "in_progress" | "done" }) {
  const map = {
    todo: { label: "To Do", cls: "bg-muted text-muted-foreground" },
    in_progress: { label: "In Progress", cls: "bg-primary/15 text-primary" },
    done: { label: "Done", cls: "bg-success/15 text-success" },
  } as const;
  const c = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", c.cls)}>{c.label}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    admin:          { cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30", label: "Admin" },
    member:         { cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20",   label: "Member" },
    project_admin:  { cls: "bg-amber-500/20 text-amber-400 border border-amber-500/30", label: "Project Admin" },
    project_member: { cls: "bg-blue-500/15 text-blue-400 border border-blue-500/20",   label: "Member" },
  };
  const c = map[role] ?? { cls: "bg-muted text-muted-foreground", label: role };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", c.cls)}>
      {c.label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: "low" | "medium" | "high" }) {
  const c = priority === "high" ? "bg-danger" : priority === "medium" ? "bg-warning" : "bg-success";
  return <span className={cn("inline-block h-2 w-2 rounded-full", c)} />;
}
