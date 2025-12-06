// pages/api/auth/logout.js
export default async function handler(req, res) {
  // clear cookie
  const cookie = `${process.env.COOKIE_NAME || 'xeno_auth'}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
  res.setHeader('Set-Cookie', cookie);
  res.json({ ok: true });
  
}
