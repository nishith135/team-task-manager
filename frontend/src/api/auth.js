import { api } from "./client";

export const signup = (full_name, email, password, role) => 
  api.post("/auth/signup", { full_name, email, password, role }).then((r) => r.data);

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    if (error?.response?.status === 422) {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data;
    }
    throw error;
  }
};
