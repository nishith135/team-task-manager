import { api } from "./client";

export const getDashboardStats = () => api.get("/dashboard").then((r) => r.data);
