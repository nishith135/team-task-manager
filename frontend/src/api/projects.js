import { api } from "./client";

export const getProjects = () => api.get("/projects").then((r) => r.data);
export const createProject = (name, description) => api.post("/projects", { name, description }).then((r) => r.data);
export const getProjectById = (id) => api.get(`/projects/${id}`).then((r) => r.data);
export const addMember = (projectId, email) =>
  api.post(`/projects/${projectId}/members`, { email }).then((r) => r.data);
export const removeMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`).then((r) => r.data);
