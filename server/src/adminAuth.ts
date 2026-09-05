import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_PASSCODE is not configured" });
  }

  const provided = req.header("X-Admin-Passcode");
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Invalid admin passcode" });
  }

  return next();
}
