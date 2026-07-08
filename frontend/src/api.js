const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive the session cookie
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getPrograms: () => request("/api/programs"),
  getProgramCatalog: (programId) => request(`/api/programs/${programId}/courses`),

  getMinors: () => request("/api/minors"),
  getMinorCatalog: (minorId) => request(`/api/minors/${minorId}/courses`),

  listPlans: (programId) => request(`/api/plans?programId=${programId}`),
  getPlan: (id) => request(`/api/plans/${id}`),
  createPlan: (plan) => request("/api/plans", { method: "POST", body: JSON.stringify(plan) }),
  updatePlan: (id, plan) => request(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(plan) }),
  deletePlan: (id) => request(`/api/plans/${id}`, { method: "DELETE" }),

  signup: (email, password, name) => request("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
};

export default api;
