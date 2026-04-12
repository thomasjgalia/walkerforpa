// api/_ingest.js
async function sendToHub(form_type, fields) {
  const url = process.env.CAMPAIGN_HUB_URL;
  const key = process.env.CAMPAIGN_HUB_API_KEY;
  if (!url || !key) return; // not configured in this environment

  try {
    await fetch(`${url}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
      body: JSON.stringify({ form_type, ...fields }),
    });
  } catch (err) {
    console.error('[ingest] hub call failed:', err);
    // intentionally swallowed — never break the form response
  }
}

module.exports = { sendToHub };
