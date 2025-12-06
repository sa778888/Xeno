// pages/api/auth/me.js
import { getUserFromRequest } from '../../../lib/auth'; // adjust path if your lib is elsewhere

export default async function handler(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    // return minimal safe user data
    const safe = {
      id: user.id,
      email: user.email || null,
      name: user.name || null
    };

    return res.status(200).json({ authenticated: true, user: safe });
  } catch (err) {
    console.error('api/auth/me error', err);
    return res.status(500).json({ authenticated: false, error: 'server_error' });
  }
}
