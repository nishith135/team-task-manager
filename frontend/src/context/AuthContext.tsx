import { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role?: "admin" | "member" } | null;

type Ctx = {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (token: string) => void;
  signup: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({ id: payload.id || payload.sub, name: payload.name, email: payload.email, role: payload.role });
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem("token");
    } finally {
      setReady(true);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    const payload = JSON.parse(atob(newToken.split('.')[1]));
    setUser({ id: payload.id || payload.sub, name: payload.name, email: payload.email, role: payload.role });
    setToken(newToken);
  };

  const signup = (newToken: string) => {
    login(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  if (!ready) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
