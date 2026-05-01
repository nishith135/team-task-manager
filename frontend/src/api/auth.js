import { api } from "./client";

const debugLog = (hypothesisId, location, message, data, runId = "pre-fix") => {
  // #region agent log
  fetch("http://127.0.0.1:7439/ingest/b1554cae-0bf0-4177-9bf5-37afebc6f16f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0a3a35" },
    body: JSON.stringify({
      sessionId: "0a3a35",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

export const signup = async (full_name, email, password, role) => {
  debugLog("H6", "frontend/src/api/auth.js:22", "signup request payload info", {
    password_char_len: password.length,
    password_byte_len: new TextEncoder().encode(password).length,
    role,
  });
  try {
    const response = await api.post("/auth/signup", { full_name, email, password, role });
    debugLog("H7", "frontend/src/api/auth.js:29", "signup success", { status: response.status });
    return response.data;
  } catch (error) {
    debugLog("H8", "frontend/src/api/auth.js:32", "signup failure", {
      status: error?.response?.status ?? null,
      detail: error?.response?.data?.detail ?? null,
      base_url: api.defaults.baseURL,
    });
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    debugLog("H9", "frontend/src/api/auth.js:42", "login request payload info", {
      password_char_len: password.length,
      password_byte_len: new TextEncoder().encode(password).length,
    });
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
