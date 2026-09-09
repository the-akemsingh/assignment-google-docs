// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../types/errors";

/**
 * Middleware that validates a JWT from the Authorization header.
 * On success, attaches `req.user = { id, email }`.
 * Throws UnauthorizedError on missing/invalid token.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }
  const token = authHeader.split(" ")[1];
  try {
    // @ts-ignore
const payload = jwt.verify(token, env.JWT_SECRET!) as JwtPayload;
    // Attach user info to request (module augmentation provides typing)
    req.user = { id: payload.sub as string, email: payload.email as string };
    next();
  } catch (err) {
    throw new UnauthorizedError("Invalid token");
  }
};
