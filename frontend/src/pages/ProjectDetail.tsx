import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Plus, Trash2, UserPlus, Settings as SettingsIcon, KanbanSquare, Users } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Avatar } from "@/components/TaskCard";
import { PriorityDot, RoleBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectById, addMember, removeMember } from "@/api/projects";
import { getTasksByProject, createTask, updateTask, deleteTask } from "@/api/tasks";

type Status = "todo" | "in_progress" | "done";
type Task = any;

const COLUMNS: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id as string),
    enabled: !!id,
  });

  const [tab, setTab] = useState<"board" | "members" | "settings">("board");

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (error || !project) return <div className="p-8 text-center text-danger">Project not found</div>;

  // Derive current user's project role from the members list
  const myMembership = (project.members || []).find(
    (m: any) => m.user_id === Number(user?.id) || m.user?.id === Number(user?.id)
  );
  const isProjectAdmin = myMembership?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">{project.name}</h2>
          {project.description && <p className="mt-1 text-sm text-muted-foreground max-w-xl">{project.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10">
        {[
          { id: "board" as const, label: "Board", icon: KanbanSquare },
          { id: "members" as const, label: "Members", icon: Users },
          { id: "settings" as const, label: "Settings", icon: SettingsIcon },
        ].map(({ id: t, label, icon: Icon }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {tab === t && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "board" && <BoardTab projectId={project.id} isProjectAdmin={isProjectAdmin} members={project.members || []} currentUserId={Number(user?.id)} />}
      {tab === "members" && <MembersTab projectId={project.id} initialMembers={project.members || []} isProjectAdmin={isProjectAdmin} currentUserId={Number(user?.id)} />}
      {tab === "settings" && <SettingsTab projectName={project.name} />}
    </div>
  );
}

function BoardTab({ projectId, isProjectAdmin, members, currentUserId }: { projectId: string; isProjectAdmin: boolean; members: any[]; currentUserId: number }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<Status | null>(null);
  const [draft, setDraft] = useState("");
  const [assignee, setAssignee] = useState<number | "">(currentUserId || "");

  const { data: tasksData = [], error: tasksError } = useQuery({
    queryKey: ["projectTasks", projectId],
    queryFn: () => getTasksByProject(projectId),
  });
  const tasks = tasksData as Task[];

  if (tasksError) {
    toast.error((tasksError as any)?.response?.data?.detail || "Failed to load tasks", { id: "board-tasks-error" });
  }

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) if (g[t.status]) g[t.status].push(t);
    return g;
  }, [tasks]);

  const updateTaskMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateTask(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projectTasks", projectId] }),
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to move task"),
  });

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("Task deleted");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to delete task"),
  });

  const createTaskMut = useMutation({
    mutationFn: (taskData: any) => createTask(projectId, taskData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("Task created");
      setDraft("");
      setAdding(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create task"),
  });

  function onDragEnd(res: DropResult) {
    if (!res.destination) return;
    const fromCol = res.source.droppableId as Status;
    const toCol = res.destination.droppableId as Status;
    const taskId = res.draggableId;
    if (fromCol !== toCol) {
      updateTaskMut.mutate({ id: taskId, updates: { status: toCol } });
    }
  }

  function addTask(col: Status) {
    if (!draft.trim()) { setAdding(null); return; }
    createTaskMut.mutate({
      title: draft.trim(),
      status: col,
      priority: "medium",
      assigned_to: assignee || currentUserId || null,
    });
  }

  function openAdding(col: Status) {
    setAdding(col);
    setDraft("");
    setAssignee(currentUserId || "");
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Role info chip */}
      <p className="mb-3 text-xs text-muted-foreground">
        Your role in this project:{" "}
        <span className={cn("font-semibold", isProjectAdmin ? "text-amber-400" : "text-blue-400")}>
          {isProjectAdmin ? "Admin" : "Member"}
        </span>
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = grouped[col.id];
          return (
            <div key={col.id} className="flex flex-col rounded-xl border border-white/10 bg-surface/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    col.id === "todo" && "bg-muted-foreground",
                    col.id === "in_progress" && "bg-primary",
                    col.id === "done" && "bg-success"
                  )} />
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{list.length}</span>
                </div>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[120px] flex-1 space-y-2 rounded-lg p-1 transition-colors",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {list.map((task, i) => (
                      <Draggable key={String(task.id)} draggableId={String(task.id)} index={i}>
                        {(p, snap) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={cn(
                              "surface p-3 cursor-grab active:cursor-grabbing transition-shadow group",
                              snap.isDragging && "shadow-elevated ring-1 ring-primary/40"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <PriorityDot priority={task.priority} />
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteTaskMut.mutate(String(task.id)); }}
                                  disabled={deleteTaskMut.isPending}
                                  className="ml-1 rounded p-0.5 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              {task.due_date ? (
                                <span className="font-mono">{format(new Date(task.due_date), "MMM d")}</span>
                              ) : <span />}
                              {task.assigned_to_name && (
                                <div className="flex items-center gap-1">
                                  <Avatar name={task.assigned_to_name} size={22} />
                                  <span className="hidden text-[10px] sm:inline truncate max-w-[70px]">{task.assigned_to_name.split(" ")[0]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {adding === col.id ? (
                <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-surface p-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTask(col.id); if (e.key === "Escape") setAdding(null); }}
                    placeholder="Task title…"
                    className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm outline-none"
                  />
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-md border border-white/10 bg-background px-2 py-1 text-xs outline-none focus:border-primary/60"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m: any) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.name || "Member"}{m.user_id === currentUserId ? " (You)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setAdding(null)} className="rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={() => addTask(col.id)} className="rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">Add</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openAdding(col.id)}
                  className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function MembersTab({ projectId, initialMembers, isProjectAdmin, currentUserId }: { projectId: string; initialMembers: any[]; isProjectAdmin: boolean; currentUserId?: number }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const addMut = useMutation({
    mutationFn: (e: string) => addMember(projectId, e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Member added");
      setEmail("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to add member")
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Member removed");
      setPendingRemove(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to remove member")
  });

  function add() {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    addMut.mutate(email);
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    removeMut.mutate(pendingRemove);
  }

  return (
    <div className="space-y-4">
      {isProjectAdmin && (
        <div className="surface flex flex-col gap-2 p-4 sm:flex-row">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email…"
            className="flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
          />
          <button onClick={add} className="press inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        </div>
      )}

      <div className="surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {isProjectAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {initialMembers.map((m) => {
              const memberName = m.user?.name || m.name;
              const memberEmail = m.user?.email || m.email;
              const memberId = m.user_id || m.id;
              const isMe = memberId === currentUserId;
              return (
                <tr key={m.id} className={cn("hover:bg-muted/20 transition-colors", isMe && "bg-white/5")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={memberName} size={32} />
                      <span className="font-medium">{memberName}</span>
                      {isMe && <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">You</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{memberEmail}</td>
                  <td className="px-4 py-3"><RoleBadge role={m.role} /></td>
                  {isProjectAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setPendingRemove(String(memberId))}
                        className="press inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access to this project immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-danger hover:bg-danger/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettingsTab({ projectName }: { projectName: string }) {
  return (
    <div className="surface max-w-xl space-y-6 p-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Project name</label>
        <input defaultValue={projectName} className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
        <textarea rows={4} className="w-full resize-none rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary/60" />
      </div>
      <div className="flex justify-end">
        <button onClick={() => toast.success("Settings saved")} className="press shimmer-btn rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          Save changes
        </button>
      </div>
    </div>
  );
}
