module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const q = req.query.q;
  if (!q) return res.status(400).end();

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).end();

  const params = new URLSearchParams({
    center: q,
    zoom: '15',
    size: '640x280',
    scale: '2',
    maptype: 'roadmap',
    markers: `color:red|${q}`,
    style: 'feature:poi|element:labels|visibility:off',
    key,
  });

  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${params}`);
    if (!r.ok) return res.status(r.status).end();
    const buffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buffer));
  } catch {
    res.status(500).end();
  }
};
