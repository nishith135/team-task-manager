import { Calendar } from "lucide-react";
import { PriorityDot } from "./Badges";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  dueDate?: string;
  assignee?: { name: string; avatar?: string };
  projectName?: string;
}

function initials(name?: string) {
  if (!name) return "U";
  const str = name.trim();
  if (!str) return "?";
  return str.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

export function Avatar({ name, size = 28 }: { name?: string; size?: number }) {
  const colors = ["bg-primary", "bg-success", "bg-warning", "bg-danger", "bg-purple-500"];
  const safeName = name?.trim() || "User";
  const idx = safeName.charCodeAt(0) % colors.length;
  return (
    <div
      className={cn("inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card", colors[idx])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(safeName)}
    </div>
  );
}

export default function TaskCard({ task, onClick, compact }: { task: Task; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "surface surface-hover w-full text-left p-4 group",
        compact ? "min-w-[260px]" : ""
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{task.title}</h4>
        <PriorityDot priority={task.priority} />
      </div>
      {task.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
        {task.assignee && <Avatar name={task.assignee?.name} size={24} />}
      </div>
    </button>
  );
}
