module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const r = await fetch('https://turnstonestorage.blob.core.windows.net/hubblob/public-photos.json');
    if (!r.ok) throw new Error('Blob error');
    const data = await r.json();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ events: [] });
  }
};
