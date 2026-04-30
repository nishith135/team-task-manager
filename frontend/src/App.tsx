import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import AppLayout from "@/components/AppLayout";

import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Projects from "./pages/Projects.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import MyTasks from "./pages/MyTasks.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 0 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(240 16% 10%)",
              color: "hsl(210 40% 96%)",
              border: "1px solid hsl(0 0% 100% / 0.1)",
              fontSize: 14,
            },
            success: { iconTheme: { primary: "hsl(142 71% 45%)", secondary: "hsl(240 20% 5%)" } },
            error: { iconTheme: { primary: "hsl(0 84% 60%)", secondary: "hsl(240 20% 5%)" } },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route
              element={
                <PrivateRoute>
                  <AppLayout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/my-tasks" element={<MyTasks />} />
            </Route>
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
