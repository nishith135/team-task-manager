import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useMemo } from "react";

const titleMap: { pattern: RegExp; title: string }[] = [
  { pattern: /^\/$/, title: "Dashboard" },
  { pattern: /^\/projects\/[^/]+$/, title: "Project" },
  { pattern: /^\/projects$/, title: "Projects" },
  { pattern: /^\/my-tasks$/, title: "My Tasks" },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = useMemo(() => titleMap.find((t) => t.pattern.test(pathname))?.title || "Nexus", [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-60 transition-[margin] duration-300 max-[900px]:ml-16">
        <Topbar title={title} />
        <main key={pathname} className="animate-fade-in p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
