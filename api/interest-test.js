export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const payload = {
    event: 'granola_interest_test_clicked',
    receivedAt: new Date().toISOString(),
    userAgent: request.headers['user-agent'] || null,
    referer: request.headers.referer || null,
    body: request.body || null
  };

  if (process.env.INTEREST_WEBHOOK_URL) {
    const webhookResponse = await fetch(process.env.INTEREST_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      return response.status(502).json({ ok: false, error: 'webhook_failed' });
    }
  } else {
    console.log('Interest test clicked', payload);
  }

  return response.status(200).json({
    ok: true,
    notification: process.env.INTEREST_WEBHOOK_URL ? 'webhook' : 'vercel_logs'
  });
}
