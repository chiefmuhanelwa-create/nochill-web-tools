export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: 'Reference required' });

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ ok: false, error: data.message });
    }

    const txn = data.data;
    const paid = txn.status === 'success';

    return res.status(200).json({
      ok: paid,
      status: txn.status,
      email: txn.customer?.email || '',
      amount: txn.amount
    });

  } catch (error) {
    console.error('Paystack verify error:', error);
    return res.status(500).json({ ok: false, error: 'Verification failed' });
  }
}
