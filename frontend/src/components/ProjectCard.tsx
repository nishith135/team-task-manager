import { Link } from "react-router-dom";
import { Avatar } from "./TaskCard";
import { RoleBadge } from "./Badges";
import { useAuth } from "@/context/AuthContext";

export interface ProjectMember {
  id: number;
  user_id: number;
  role: string;
  user?: { id: number; name: string; email: string };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  members: ProjectMember[];
  tasksTotal: number;
  tasksDone: number;
  color?: string;
}

const colors = ["#4f8ef7", "#22c55e", "#f59e0b", "#a855f7", "#ec4899", "#06b6d4"];

export function colorFor(id?: string) {
  if (!id) return colors[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
        <circle
          cx="24"
          cy="24"
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (percent / 100) * c}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold">
        {percent}%
      </span>
    </div>
  );
}

export default function ProjectCard({ project, delay = 0 }: { project: Project; delay?: number }) {
  const { user } = useAuth();
  const color = project.color || colorFor(project.id);
  const percent = project.tasksTotal ? Math.round((project.tasksDone / project.tasksTotal) * 100) : 0;

  // Derive the current user's role in THIS project from the members array
  const myMembership = project.members?.find((m) => m.user_id === Number(user?.id) || m.user?.id === Number(user?.id));
  const projectRole = myMembership?.role === "admin" ? "project_admin" : "project_member";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="surface surface-hover relative block overflow-hidden p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base truncate">{project.name}</h3>
            <RoleBadge role={projectRole} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {project.description || "No description"}
          </p>
        </div>
        <ProgressRing percent={percent} color={color} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((m, i) => (
            <Avatar key={i} name={m.user?.name} size={26} />
          ))}
          {project.members.length > 4 && (
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-muted text-[10px] ring-2 ring-card text-muted-foreground">
              +{project.members.length - 4}
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {project.tasksDone}/{project.tasksTotal}
        </span>
      </div>
    </Link>
  );
}
