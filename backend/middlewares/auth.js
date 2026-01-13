import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Missing Authorization" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ message: "Invalid Authorization format" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
export const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    req.user = null;
    return next();
  }
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    req.user = null;
    return next();
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};
// Simplified role system: only customer and admin
const ROLE_LEVEL = {
  customer: 0,
  admin: 1,
};

const roleIdToLevel = (roleId) => {
  switch (roleId) {
    case 1:
      return 1; // admin
    case 2:
      return 0; // customer
    default:
      return -1;
  }
};
export const requireRole = (...allowedRoles) => {
  const levels = allowedRoles
    .map((r) => String(r || "").toLowerCase())
    .map((name) =>
      typeof ROLE_LEVEL[name] === "number" ? ROLE_LEVEL[name] : -1
    );
  const minLevel = levels.length ? Math.min(...levels) : 0;
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    let userLevel = -1;
    if (user.role_id !== undefined && user.role_id !== null) {
      userLevel = roleIdToLevel(user.role_id);
    }
    if (userLevel === -1) {
      const userRoleName = (user.role || user.role_name || user.role_type || "")
        .toString()
        .toLowerCase();
      userLevel =
        typeof ROLE_LEVEL[userRoleName] === "number"
          ? ROLE_LEVEL[userRoleName]
          : -1;
    }
    if (userLevel >= minLevel) return next();
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  };
};
