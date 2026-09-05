import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createErrorResponse } from "../lib/http.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt || req.headers?.authorization?.replace(/^Bearer\s+/i, "");
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "dev_jwt_secret";

    if (!token) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Authentication required"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Invalid or expired token"));
    }

    if (!decoded?.userId) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "Invalid token payload"));
    }

    let user = await User.findById(decoded.userId);
    if (typeof user?.select === "function") {
      user = await user.select("-password");
    }

    if (!user) {
      return res.status(401).json(createErrorResponse("UNAUTHORIZED", "User not found"));
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json(createErrorResponse("AUTH_ERROR", "Internal server error"));
  }
};