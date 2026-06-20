import jwt from "jsonwebtoken";

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, "secretkey");

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;