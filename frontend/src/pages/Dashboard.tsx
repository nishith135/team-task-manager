import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { FolderKanban, CheckSquare, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import StatCard from "@/components/StatCard";
import TaskCard from "@/components/TaskCard";
import { mockActivity } from "@/lib/mockData";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/api/dashboard";
import { getMyTasks } from "@/api/tasks";
import toast from "react-hot-toast";
import { CardSkeleton } from "@/components/Skeleton";
import { RoleBadge } from "@/components/Badges";

export default function Dashboard() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  });

  const { data: tasksData = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: getMyTasks,
  });
  const stats = statsData as any;
  const tasks = tasksData as any[];

  if (statsError || tasksError) {
    const errorMsg = (statsError as any)?.response?.data?.detail || (tasksError as any)?.response?.data?.detail || "Failed to load dashboard data";
    toast.error(errorMsg, { id: "dashboard-error" });
  }

  const todays = tasks.slice(0, 6);
  const completedCount = stats?.tasks_by_status?.done || 0;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {greet}, {user?.name?.split(" ")[0] || "there"} <span className="inline-block animate-fade-in">👋</span>
          </h2>
          <RoleBadge role={user?.role || "member"} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Projects" value={stats?.total_projects || 0} icon={<FolderKanban className="h-5 w-5" />} trend={{ value: 0, positive: true }} delay={0} />
          <StatCard label="My Tasks" value={stats?.my_tasks_count || 0} icon={<CheckSquare className="h-5 w-5" />} trend={{ value: 0, positive: true }} delay={80} />
          <StatCard label="Overdue" value={stats?.overdue_count || 0} icon={<AlertTriangle className="h-5 w-5" />} trend={{ value: 0, positive: false }} tint="danger" delay={160} />
          <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} trend={{ value: 0, positive: true }} tint="success" delay={240} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's tasks */}
        <section className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">My Tasks Today</h3>
            <span className="font-mono text-xs text-muted-foreground">{todays.length} tasks</span>
          </div>
          {tasksLoading ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              <CardSkeleton /><CardSkeleton />
            </div>
          ) : todays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks for today.</p>
          ) : (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {todays.map((t: any) => (
                <div key={t.id} className="w-[280px] shrink-0">
                  <TaskCard task={t} compact />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="surface p-5 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold">Recent Activity</h3>
          </div>
          <ol className="relative space-y-4 border-l border-white/10 pl-5">
            {mockActivity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <p className="text-sm leading-snug">{a.text}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
