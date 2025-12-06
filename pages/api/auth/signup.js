// pages/api/auth/signup.js
import bcrypt from 'bcryptjs';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash } });
    return res.status(201).json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'server error' });
  }
}
