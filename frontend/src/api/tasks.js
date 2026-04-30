import { api } from "./client";

export const getTasksByProject = (projectId, filters) =>
  api.get(`/projects/${projectId}/tasks`, { params: filters }).then((r) => r.data);
export const createTask = (projectId, taskData) => 
  api.post(`/projects/${projectId}/tasks`, taskData).then((r) => r.data);
export const updateTask = (taskId, updates) => 
  api.patch(`/tasks/${taskId}`, updates).then((r) => r.data);
export const deleteTask = (taskId) => 
  api.delete(`/tasks/${taskId}`).then((r) => r.data);
export const getMyTasks = () => api.get("/tasks/my").then((r) => r.data);
export const getOverdueTasks = () => api.get("/tasks/overdue").then((r) => r.data);
