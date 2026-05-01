import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { login as apiLogin, signup as apiSignup } from "@/api/auth";

type Mode = "login" | "signup";

function truncateToUtf8Bytes(input: string, maxBytes: number) {
  let result = "";
  let used = 0;
  for (const ch of input) {
    const size = new TextEncoder().encode(ch).length;
    if (used + size > maxBytes) break;
    result += ch;
    used += size;
  }
  return result;
}

function FloatingInput({
  id, label, type = "text", value, onChange, error, suffix,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string; suffix?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className={cn(
          "peer w-full rounded-lg border bg-surface px-3.5 pt-5 pb-2 text-sm outline-none transition-all",
          "border-white/10 focus:border-primary/60",
          error && "border-danger/60"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-3.5 top-3.5 text-sm text-muted-foreground transition-all",
          "peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-primary",
          value && "top-1.5 text-[11px] text-muted-foreground"
        )}
      >
        {label}
      </label>
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  function validate() {
    const e: Record<string, string> = {};
    if (mode === "signup" && !name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiLogin(email, password);
        login(data.access_token);
        toast.success("Welcome back!");
        navigate(from, { replace: true });
      } else {
        await apiSignup(name, email, password, role);
        toast.success("Account created! Please sign in.");
        setMode("login");
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || "Something went wrong";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left: animated mesh */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 mesh-bg">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-white">Nexus</span>
        </div>
        <div className="relative z-10 max-w-md animate-fade-up">
          <h2 className="font-display text-5xl font-bold leading-tight tracking-tight text-white">
            Collaborate.<br />Ship.<br />Repeat.
          </h2>
          <p className="mt-4 text-base text-white/70">
            The task manager for teams who actually ship. Plan, track, and deliver — all in one place.
          </p>
        </div>
        <div className="relative z-10 font-mono text-xs text-white/50">
          © 2026 Nexus
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Zap className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold">Nexus</span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to continue to Nexus." : "Start collaborating with your team in seconds."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <FloatingInput id="name" label="Full name" value={name} onChange={setName} error={errors.name} />
                {/* Role selector */}
                <div className="flex gap-2">
                  {(["member", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors",
                        role === r
                          ? r === "admin"
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                            : "border-blue-500/40 bg-blue-500/15 text-blue-400"
                          : "border-white/10 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      {r === "admin" ? "Admin" : "Member"}
                    </button>
                  ))}
                </div>
              </>
            )}
            <FloatingInput id="email" label="Email address" type="email" value={email} onChange={setEmail} error={errors.email} />
            <FloatingInput
              id="password"
              label="Password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(v) => {
                setPassword(truncateToUtf8Bytes(v, 72));
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={errors.password}
              suffix={
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn press group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode((m) => (m === "login" ? "signup" : "login"));
                setErrors({});
              }}
              className="font-medium text-primary hover:text-primary-glow transition-colors"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
