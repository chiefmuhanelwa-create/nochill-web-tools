export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const PLAN_CODE    = 'PLN_ympikrhxsznbpio'; // R49/month — shared NOCHILL tools plan
  const CALLBACK_URL = 'https://nochill-whatsapp-generator.vercel.app/';

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: 4900,
        currency: 'ZAR',
        plan: PLAN_CODE,
        callback_url: CALLBACK_URL,
        metadata: {
          custom_fields: [
            { display_name: 'Tool', variable_name: 'tool', value: 'whatsapp_message_generator' }
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
