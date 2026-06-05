export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, amount, plan } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Monthly: R99 = 9900 kobo | Annual: R799 = 79900 kobo
  const payAmount  = amount === 79900 ? 79900 : 9900;
  const planLabel  = plan === 'annual' ? 'creator_dashboard_annual_r799' : 'creator_dashboard_monthly_r99';
  const CALLBACK_URL = 'https://nochill-creator-dashboard.vercel.app/';

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: payAmount,
        currency: 'ZAR',
        callback_url: CALLBACK_URL,
        metadata: {
          custom_fields: [
            { display_name: 'Tool',  variable_name: 'tool',  value: 'creator_dashboard' },
            { display_name: 'Plan',  variable_name: 'plan',  value: planLabel }
          ]
        }
      })
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ ok: false, error: data.message || 'Paystack error' });
    }

    return res.status(200).json({
      ok: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });

  } catch (error) {
    console.error('Paystack create-payment error:', error);
    return res.status(500).json({ ok: false, error: 'Payment initialization failed' });
  }
}
