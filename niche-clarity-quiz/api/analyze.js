const _rl = new Map();
const RL_MAX = 20;
const RL_WIN = 3600000;
function _ip(req) { return ((req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.headers['x-real-ip']||'unknown'); }
function _check(ip) {
  const now = Date.now();
  if (_rl.size > 500) { for (const [k,v] of _rl) if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + RL_WIN }); return true; }
  if (e.c >= RL_MAX) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!_check(_ip(req))) return res.status(429).json({ ok: false, error: 'Too many requests — try again in an hour.' });

    const { name, answers } = req.body;

    if (!answers || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const answersText = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${Array.isArray(a) ? a.join(', ') : a}`)
        .join('\n\n');

    const prompt = `You are the AI niche assessment engine for NOCHILL PTY LTD, a South African digital business platform for content creators and professionals, founded by Ndivhuwo Muhanelwa (@nochillgod).

A user named ${name} has completed a 24-question Niche Clarity Assessment. Study their answers carefully and produce a complete, highly personalised niche assessment. Be specific — reference what they actually said, not generic statements.

USER ANSWERS:
${answersText}

AVAILABLE NOCHILL PRODUCTS TO RECOMMEND FROM:
1. Niche Clarity Workbook — R199 (deep structured workbook for those who need to define and validate their niche)
2. The Influencer's Code — R299 (complete business guide for creators building from scratch)
3. Tax For Content Creators — R299 (SARS compliance guide — for anyone earning or planning to earn online in SA)
4. Build Your Personal Brand Course — R599 (full personal brand system for those ready to build authority)
5. PAIDS Framework Workbook — R899 (5 income stream framework — for those ready to monetize seriously)
6. Creator Starter Bundle — R499 (complete starter kit combining core products — best for beginners)
7. CHKPLT Premium Program — Application required (exclusive program for credentialed professionals 30–55 who have deep expertise and want a system to monetize it — NOT for beginners)

CALLED EXPERT SIGNAL — set to true if the user:
- Has professional credentials (nursing, law, finance, engineering, teaching, psychology, accounting, HR, etc.)
- Appears to be 30+ based on experience described
- Is currently employed in a professional role
- Has 5+ years in their field
- Their niche is about monetizing professional expertise, NOT building a social media following

IMPORTANT:
- All prices in ZAR (Rands). Never use USD.
- The niche statement MUST use the specific words and context from their answers — no generic "I help people improve their lives" statements.
- Strengths and gaps must reference what they specifically said.
- Product recommendations must be logically justified by their answers.
- Tone: mentor, not robot. Direct, warm, South African context.

Respond with ONLY valid JSON — no markdown fences, no explanation before or after, just the JSON object:

{
  "nicheScore": [integer 0-100 based on specificity of niche, expertise level, audience clarity, and market readiness],
  "nicheStatement": "[Complete sentence: 'I help [their specific WHO from their answers] go from [their specific Point A] to [their specific Point B] through [their specific method/expertise]']",
  "scoreBreakdown": {
    "passion": [0-100],
    "expertise": [0-100],
    "audience": [0-100],
    "market": [0-100],
    "content": [0-100],
    "vision": [0-100]
  },
  "strengths": [
    "[Specific strength 1 — reference their actual answer]",
    "[Specific strength 2 — reference their actual answer]",
    "[Specific strength 3 — reference their actual answer]"
  ],
  "gaps": [
    "[Specific gap 1 — what is unclear or weak and WHY it matters]",
    "[Specific gap 2 — what is unclear or weak and WHY it matters]"
  ],
  "biggestOpportunity": "[2-3 sentences about their SINGLE biggest opportunity based on their specific answers. Be concrete — name the opportunity, the audience, and why now]",
  "calledExpertSignal": [true or false],
  "productRecommendations": [
    {
      "product": "[exact product name from list above]",
      "price": "[exact price e.g. R199]",
      "reason": "[1 specific sentence connecting THEIR answers to why this product serves them right now]",
      "priority": "START HERE"
    },
    {
      "product": "[exact product name from list above]",
      "price": "[exact price]",
      "reason": "[1 specific sentence]",
      "priority": "THEN THIS"
    }
  ],
  "nextSteps": [
    "[Specific, actionable step 1 they can do this week — concrete, not vague]",
    "[Specific, actionable step 2 — references their situation]",
    "[Specific, actionable step 3 — references their situation]"
  ]
}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1800,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Anthropic error:', err);
            return res.status(500).json({ error: 'AI service error' });
        }

        const data = await response.json();
        const rawText = data.content[0].text.trim();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', rawText);
            return res.status(500).json({ error: 'Invalid AI response format' });
        }

        const result = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ result });

    } catch (error) {
        console.error('Analyze error:', error);
        return res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
}
