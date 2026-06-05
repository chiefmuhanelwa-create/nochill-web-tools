export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { field, context } = req.body;
  if (!field) return res.status(400).json({ error: 'Field type required' });

  let systemPrompt = '';
  let userPrompt = '';

  switch (field) {
    case 'bio':
      systemPrompt = 'You are a professional bio writer for African content creator media kits. Write compelling, concise bios that emphasise transformation and value to potential brand partners. Always write in second person (describing the creator). Use SA context where relevant — ZAR prices, SA platforms, SA audience signals.';
      userPrompt = `Write a professional, compelling bio (2-3 sentences, 200-350 characters) for a content creator's media kit.

Context:
- Name: ${context.name || 'the creator'}
- Title: ${context.title || 'Content Creator'}
- Niche: ${context.niche || 'their niche'}
- Target audience: ${context.targetAudience || 'their audience'}
- Key transformation: ${context.transformation || 'the value they provide'}

Rules:
- Start with the transformation they provide (NOT "I'm a creator who...")
- Use active, powerful language
- Include credibility markers if provided
- Keep it concise and punchy
- Make it brand-friendly and professional
- Focus on the value they bring to brand partners

Write ONLY the bio text, no quotes, no formatting.`;
      break;

    case 'positioning':
      systemPrompt = 'You are a brand positioning specialist for African content creators. Write a one-line positioning statement that a brand manager reads on the cover of a media kit and immediately understands the creator\'s unique value.';
      userPrompt = `Write a one-line positioning statement (max 100 characters) for a content creator's media kit cover.

Context:
- Niche: ${context.niche || 'their niche'}
- Target audience: ${context.targetAudience || 'their audience'}
- Key transformation: ${context.transformation || 'the value they provide'}
- Location: ${context.location || 'South Africa'}

Rules:
- Format: "I help [WHO] [ACHIEVE WHAT] through [HOW]"
- Be specific — name the audience type and the result
- Make it brand-relevant
- Keep it under 100 characters

Write ONLY the positioning statement.`;
      break;

    case 'marketOpportunity':
      systemPrompt = 'You are a market analyst helping African content creators articulate their niche\'s commercial potential for brand partnerships. Use SA-specific data where relevant.';
      userPrompt = `Write a compelling market opportunity statement (2-3 sentences) for a content creator's media kit.

Context:
- Niche: ${context.niche || 'their niche'}
- Followers: ${context.followers ? Number(context.followers).toLocaleString() : 'growing audience'}
- Engagement rate: ${context.engagementRate || 'strong engagement'}
- Location: ${context.location || 'South Africa'}

Rules:
- Lead with market size or growth signal relevant to the niche
- Mention their positioning (engagement vs SA average of 3.39%)
- Quantify reach and engagement impact
- Make it data-driven and strategic
- Show why brands should care about this niche right now

Write ONLY the market opportunity text, no quotes.`;
      break;

    case 'uniqueSellingPoints':
      systemPrompt = 'You are a strategic positioning consultant helping African content creators articulate what makes them uniquely valuable to brands. Focus on competitive advantages and data-backed claims.';
      userPrompt = `Generate 3-5 unique selling points for a content creator's media kit.

Context:
- Niche: ${context.niche || 'content creation'}
- Experience: ${context.experience || 'content creation'}
- Key achievements: ${context.achievements || 'building engaged community'}
- Engagement rate: ${context.engagementRate || 'strong engagement'}
- Special skills: ${context.skills || 'content creation and storytelling'}

Rules:
- Each point: one clear, powerful statement
- Use bullet points (•)
- Include specific data or credentials where possible
- Focus on competitive advantages
- Make each point brand-relevant
- Format: • [Credential/metric + why it matters to brands]

Examples:
• 8% engagement rate (2.4x SA average) — proves authentic audience connection
• Certified financial expert — ensures accurate, trustworthy content that protects brand reputation

Write 3-5 bullet points ONLY.`;
      break;

    case 'audiencePainPoints':
      systemPrompt = 'You are an audience insights specialist helping African content creators articulate the problems their content solves — for use in media kits targeting brand partners.';
      userPrompt = `Generate 3-5 audience pain points that this content creator's work addresses.

Context:
- Niche: ${context.niche || 'their niche'}
- Target audience: ${context.targetAudience || 'their audience'}
- Transformation: ${context.transformation || 'the value they provide'}

Rules:
- Each pain point: SPECIFIC and EMOTIONAL
- Use bullet points (•)
- Frame as problems the audience actively experiences
- Include SA market context where relevant
- Connect pain points to brand relevance (solving this = brand ROI)
- Format: • [Specific problem/frustration + market context if relevant]

Examples:
• Overwhelmed by conflicting financial advice from unqualified social media voices
• Struggling with debt cycles — 70% of SA households have unsecured debt

Write 3-5 bullet points ONLY.`;
      break;

    case 'transformationOutcome':
      systemPrompt = 'You are an ROI storyteller helping African content creators demonstrate the transformation they create and the commercial value for brand partners.';
      userPrompt = `Write a transformation and outcomes statement (2-3 sentences) for a content creator's media kit.

Context:
- Niche: ${context.niche || 'their niche'}
- Audience pain points: ${context.painPoints || 'challenges their audience faces'}
- Key results: ${context.results || 'positive impact on their community'}
- Brand value: ${context.brandValue || 'authentic recommendations that convert'}

Rules:
- Start with the transformation journey ("I transform X into Y")
- Include quantifiable outcomes where possible
- Connect audience transformation to brand ROI
- Use powerful action words
- Make it inspiring but realistic — no fake claims

Write ONLY the transformation statement, no quotes.`;
      break;

    case 'serviceDescription':
      systemPrompt = 'You are a service package writer helping African content creators describe their offerings in a brand-friendly, value-focused way for media kits.';
      userPrompt = `Write a compelling service description (1-2 sentences, 100-200 characters) for this content creator offering.

Service details:
- Service name: ${context.serviceName || 'Content Partnership'}
- Deliverables: ${context.deliverables || 'sponsored content'}
- Platforms: ${context.platforms || 'social media'}
- Unique value: ${context.uniqueValue || 'authentic storytelling'}

Rules:
- Focus on OUTCOMES and VALUE, not just deliverables
- Mention specific formats briefly
- Highlight what makes this package unique
- Keep it concise and professional
- Make it sound premium but accessible

Write ONLY the description, no quotes.`;
      break;

    case 'pricingRationale':
      systemPrompt = 'You are a pricing strategist helping African content creators justify their rates with data and value-based reasoning. Always use ZAR (R) pricing.';
      userPrompt = `Write a pricing rationale (1-2 sentences) explaining why this service is priced as it is.

Context:
- Service: ${context.serviceName || 'Content Creation'}
- Price: R${context.price || 'X,XXX'}
- Engagement rate: ${context.engagementRate || 'strong engagement'}
- Production value: ${context.productionValue || 'professional content creation'}

Rules:
- Lead with value-based reasoning (CPM/CPE rates, engagement, ROI)
- Mention production investment and time
- Compare to SA industry benchmarks where relevant
- Keep it factual and professional
- Make brands understand the pricing is data-driven

Write ONLY the rationale, no quotes.`;
      break;

    case 'nichePerformance':
      systemPrompt = 'You are a performance analyst helping African content creators position their metrics within their niche\'s SA market context.';
      userPrompt = `Write a niche performance context statement (2-3 sentences) showing how this creator's metrics compare to benchmarks.

Context:
- Niche: ${context.niche || 'their niche'}
- Engagement rate: ${context.engagementRate || 'X%'}
- Followers: ${context.followers || 'X'}
- SA average ER: 3.39% (vs global 1.49%)

Rules:
- Compare their metrics to SA/industry benchmarks
- Use specific percentages and multipliers (e.g., "2.4x SA average")
- Mention what this means for brand ROI
- Keep it data-driven and confident
- Frame as competitive advantage

Write ONLY the performance context, no quotes.`;
      break;

    default:
      return res.status(400).json({ error: 'Invalid field type. Supported: bio, positioning, marketOpportunity, uniqueSellingPoints, audiencePainPoints, transformationOutcome, serviceDescription, pricingRationale, nichePerformance' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    const suggestion = data.content?.[0]?.text?.trim() || '';

    if (!suggestion) {
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    return res.status(200).json({ ok: true, suggestion });
  } catch (error) {
    console.error('AI suggest error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
