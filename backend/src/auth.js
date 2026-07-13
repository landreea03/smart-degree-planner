import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const COOKIE_NAME = "sdp_token";
const TOKEN_TTL = "30d";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️  JWT_SECRET is not set — using an insecure default. Set it in your environment before deploying.");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role || "student" }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function setAuthCookie(res, token) {
  const crossSite = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: crossSite, // required for SameSite=None; fine for local http dev when false
    sameSite: crossSite ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

/** Reads the session cookie, verifies it, and attaches `req.user` if valid. Never blocks the request. */
export function attachUser(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  req.user = payload ? { id: payload.sub, email: payload.email, role: payload.role || "student" } : null;
  next();
}

/** Blocks the request with 401 unless `attachUser` found a valid session. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  next();
}

/** Blocks the request with 403 unless the signed-in user has the "advisor" role. */
export function requireAdvisor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in required" });
  if (req.user.role !== "advisor") return res.status(403).json({ error: "Advisor access required" });
  next();
}

export { COOKIE_NAME };
