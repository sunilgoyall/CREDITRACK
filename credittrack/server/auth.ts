import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'credittrack_nexus_jwt_secret_dev_key_2026';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  businessId: string;
  role?: 'OWNER' | 'STAFF';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign({ ...payload, role: payload.role || 'OWNER' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    if (!decoded.role) decoded.role = 'OWNER';
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.userId || !payload.businessId) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    return;
  }

  req.user = payload;
  next();
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role === 'STAFF') {
    res.status(403).json({
      error: 'Permission Denied: Staff accounts are restricted from modifying store profiles, deleting records, or viewing overarching analytics.',
      restricted: true,
    });
    return;
  }
  next();
}
