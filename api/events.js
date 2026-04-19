module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const r = await fetch('https://hub166.turnstone.ltd/api/events/public');
    if (!r.ok) throw new Error('Hub error');
    const data = await r.json();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ items: [] });
  }
};
