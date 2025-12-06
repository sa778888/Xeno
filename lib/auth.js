// lib/auth.js
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.COOKIE_NAME || 'xeno_auth';

export async function getUserFromRequest(req) {
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie || '') : {};
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return user;
  } catch (e) {
    return null;
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    // attach user to req
    req.user = user;
    return handler(req, res);
  };
}
