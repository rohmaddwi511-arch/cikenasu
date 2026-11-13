// Vercel Serverless Function: proxy RPC Helius. Key disimpan di Environment Variable HELIUS_API_KEY.
const ALLOWED = new Set([
  'getBalance',
  'getTokenAccountsByOwner',
  'getAccountInfo',
  'sendTransaction',
  'getSignatureStatuses',
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Hanya terima permintaan dari domain app sendiri
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) {}
    if (host !== req.headers.host) return res.status(403).json({ error: 'Forbidden origin' });
  }

  const key = process.env.HELIUS_API_KEY;
  if (!key) return res.status(500).json({ error: 'HELIUS_API_KEY belum diset di Vercel' });

  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || !ALLOWED.has(body.method)) {
    return res.status(400).json({ error: 'RPC method tidak diizinkan' });
  }

  try {
    const r = await fetch('https://mainnet.helius-rpc.com/?api-key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: body.id || 1, method: body.method, params: body.params || [] }),
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(502).json({ error: 'Gagal menghubungi RPC: ' + e.message });
  }
};
