const ALLOWED = [
  'getBalance',
  'getTokenAccountsByOwner',
  'getAccountInfo',
  'sendTransaction',
  'getSignatureStatuses',
];

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = process.env.HELIUS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'HELIUS_API_KEY belum diset di Vercel' });
    }

    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || !ALLOWED.includes(body.method)) {
      return res.status(400).json({ error: 'RPC method tidak diizinkan' });
    }

    const r = await fetch('https://mainnet.helius-rpc.com/?api-key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: body.id || 1,
        method: body.method,
        params: body.params || [],
      }),
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error: ' + e.message });
  }
};
