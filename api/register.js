module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { eventId, first_name, last_name, email, phone } = req.body || {};

  if (!eventId || !first_name || !last_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const r = await fetch(`https://hub166.turnstone.ltd/api/public/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, email, phone: phone || undefined }),
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : r.status).json(data);
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};
