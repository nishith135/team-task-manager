import { useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import ProjectCard from "@/components/ProjectCard";
import EmptyState from "@/components/EmptyState";
import SlideDrawer from "@/components/SlideDrawer";
import { CardSkeleton } from "@/components/Skeleton";
import { getProjects, createProject } from "@/api/projects";

export default function Projects() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qc = useQueryClient();
  
  const { data: projectsData = [], isLoading, error } = useQuery({
    queryKey: ["projects"],

    queryFn: getProjects,
  });
  const projects = projectsData as any[];

  if (error) {
    const errorMsg = (error as any)?.response?.data?.detail || "Failed to load projects";
    toast.error(errorMsg, { id: "projects-error" });
  }

  const create = useMutation({
    mutationFn: async (input: { name: string; description: string }) => {
      return await createProject(input.name, input.description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setDrawerOpen(false);
      setName(""); setDesc("");
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.detail || "Failed to create project";
      toast.error(errorMsg);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    create.mutate({ name: name.trim(), description: desc.trim() });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Manage and track all your team projects.</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="press shimmer-btn inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-7 w-7" />}
          title="No projects yet"
          description="Create your first project and start organizing tasks with your team."
          action={
            <button onClick={() => setDrawerOpen(true)} className="press inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4" /> Create project
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p: any, i: number) => (
            <ProjectCard key={p.id} project={p} delay={i * 60} />
          ))}
        </div>
      )}

      <SlideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New project" description="Set up a workspace for your team.">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-lg border border-white/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className="press rounded-lg border border-white/10 px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={create.isPending} className="press shimmer-btn rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
              {create.isPending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </SlideDrawer>
    </div>
  );
}
