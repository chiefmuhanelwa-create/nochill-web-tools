export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, tags } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const GROUP_ID = '189168267230709259';

  try {
    const body = { email, groups: [GROUP_ID] };
    if (name) body.fields = { name };

    const resp = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => ({}));

    // Add tags if provided and we have the subscriber ID
    if (tags && tags.length > 0 && data.data && data.data.id) {
      await Promise.allSettled(tags.map(tag =>
        fetch(`https://connect.mailerlite.com/api/subscribers/${data.data.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}` },
          body: JSON.stringify({ tags: [tag] })
        }).catch(() => {})
      ));
    }

    const already = data.message && data.message.toLowerCase().includes('already');
    return res.status(200).json({ ok: true, already });

  } catch (error) {
    console.error('MailerLite subscribe error:', error);
    return res.status(200).json({ ok: true }); // non-blocking — never fail the user
  }
}
