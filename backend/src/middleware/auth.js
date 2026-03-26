const jwt = require("jsonwebtoken");

/**
 * Express middleware that validates the JWT attached to every
 * protected request. Sets req.user = { walletAddress }.
 */
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { walletAddress: payload.walletAddress };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
