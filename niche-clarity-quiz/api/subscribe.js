export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, email, nicheScore, calledExpert } = req.body;

    if (!email) return res.status(400).json({ error: 'Email required' });

    const tags = ['tool_niche_clarity'];
    if (calledExpert) tags.push('called_expert_signal');
    if (nicheScore >= 70) tags.push('niche_strong');
    else if (nicheScore >= 50) tags.push('niche_developing');
    else tags.push('niche_early');

    try {
        const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email,
                fields: {
                    name: name || '',
                    niche_score: nicheScore || 0
                },
                groups: [process.env.MAILERLITE_GROUP_ID],
                tags
            })
        });

        const data = await response.json();
        return res.status(200).json({ ok: true, data });

    } catch (error) {
        console.error('MailerLite error:', error);
        return res.status(200).json({ ok: false });
    }
}
