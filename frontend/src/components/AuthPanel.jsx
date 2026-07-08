import { useState } from "react";

export default function AuthPanel({ user, onLogin, onSignup, onLogout, busy }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  };

  const closeAndReset = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, name);
      }
      closeAndReset();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="muted" style={{ fontSize: "13px" }}>👤 {user.name || user.email}</span>
        <button className="btn btn-ghost" onClick={onLogout} disabled={busy}>Log out</button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
        Sign in
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "280px",
            zIndex: 30,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="tabs" style={{ marginBottom: "12px", width: "100%" }}>
            <button
              type="button"
              className={`tab-btn ${mode === "login" ? "active" : ""}`}
              style={{ flex: 1 }}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === "signup" ? "active" : ""}`}
              style={{ flex: 1 }}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <input
                className="input"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder={mode === "signup" ? "Password (min. 8 characters)" : "Password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div style={{ fontSize: "12px", color: "var(--danger)", marginBottom: "8px" }}>{error}</div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
