import { useMemo, useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { Check, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar } from "@/components/TaskCard";
import { PriorityBadge, StatusBadge, RoleBadge } from "@/components/Badges";
import SlideDrawer from "@/components/SlideDrawer";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyTasks, updateTask } from "@/api/tasks";
import { CardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";

type Task = any;

const STATUS = ["all", "todo", "in_progress", "done"] as const;
const PRIORITY = ["all", "low", "medium", "high"] as const;

export default function MyTasks() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<(typeof STATUS)[number]>("all");
  const [priority, setPriority] = useState<(typeof PRIORITY)[number]>("all");
  const [project, setProject] = useState<string>("all");
  const [open, setOpen] = useState<Task | null>(null);

  const { data: tasksData = [], isLoading, error } = useQuery({
    queryKey: ["myTasks"],
    queryFn: getMyTasks,
  });
  
  const tasks = tasksData as Task[];

  if (error) {
    toast.error((error as any)?.response?.data?.detail || "Failed to load tasks", { id: "mytasks-error" });
  }

  const updateTaskMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateTask(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myTasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "tasks"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update task"),
  });

  const projects = useMemo(() => Array.from(new Set(tasks.map((t) => String(t.project_id)).filter(Boolean))), [tasks]);

  const filtered = tasks.filter((t) =>
    (status === "all" || t.status === status) &&
    (priority === "all" || t.priority === priority) &&
    (project === "all" || String(t.project_id) === project)
  );

  function toggleDone(task: Task) {
    updateTaskMut.mutate({ id: task.id, updates: { status: task.status === "done" ? "todo" : "done" } });
  }

  function saveEdit(updated: Task) {
    updateTaskMut.mutate(
      { id: updated.id, updates: { title: updated.title, priority: updated.priority, status: updated.status } },
      { onSuccess: () => { toast.success("Task updated"); setOpen(null); } }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with global role */}
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight">My Tasks</h2>
        <RoleBadge role={user?.role || "member"} />
        {tasks.length > 0 && (
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {tasks.length} total
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="surface space-y-3 p-4">
        <FilterRow label="Status" value={status} setValue={setStatus} options={STATUS as readonly string[]} />
        <FilterRow label="Priority" value={priority} setValue={setPriority} options={PRIORITY as readonly string[]} />
        <FilterRow label="Project" value={project} setValue={setProject} options={["all", ...projects]} />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={<Inbox className="h-7 w-7" />} title="No tasks yet" description="Create tasks in your projects — they'll all appear here." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="h-7 w-7" />} title="No tasks match your filters" description="Try widening your filters or selecting All." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const overdue = t.due_date && t.status !== "done" && isBefore(new Date(t.due_date), startOfDay(new Date()));
            return (
              <li
                key={t.id}
                className={cn(
                  "surface surface-hover relative flex items-center gap-3 p-3 cursor-pointer",
                  overdue && "border-l-2 border-l-danger"
                )}
                onClick={() => setOpen(t)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDone(t); }}
                  disabled={updateTaskMut.isPending}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    t.status === "done" ? "border-success bg-success text-background" : "border-white/20 hover:border-primary",
                    updateTaskMut.isPending && "opacity-50"
                  )}
                  aria-label="Toggle done"
                >
                  {t.status === "done" && <Check className="h-3 w-3" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium truncate", t.status === "done" && "text-muted-foreground line-through")}>
                    {t.title}
                  </p>
                </div>

                {t.project_id && (
                  <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
                    Project #{t.project_id}
                  </span>
                )}
                <PriorityBadge priority={t.priority} />
                {t.due_date && (
                  <span className={cn("hidden font-mono text-xs sm:inline", overdue ? "text-danger" : "text-muted-foreground")}>
                    {format(new Date(t.due_date), "MMM d")}
                  </span>
                )}
                {t.assigned_to_name && <Avatar name={t.assigned_to_name} size={26} />}
              </li>
            );
          })}
        </ul>
      )}

      <SlideDrawer open={!!open} onClose={() => setOpen(null)} title="Task details" description={open?.projectName}>
        {open && <TaskEditForm task={open} onSave={saveEdit} />}
      </SlideDrawer>
    </div>
  );
}

function FilterRow({
  label, value, setValue, options,
}: { label: string; value: string; setValue: (v: any) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => setValue(o)}
          className={cn(
            "press rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
            value === o ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {o.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

function TaskEditForm({ task, onSave }: { task: Task; onSave: (t: Task) => void }) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {task.due_date && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Due date</label>
          <p className="font-mono text-sm">{format(new Date(task.due_date), "EEEE, MMM d, yyyy")}</p>
        </div>
      )}

      {task.assigned_to_name && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Assignee</label>
          <div className="flex items-center gap-2">
            <Avatar name={task.assigned_to_name} size={28} />
            <span className="text-sm">{task.assigned_to_name}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={() => onSave({ ...task, title, priority, status })}
          className="press shimmer-btn rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
