import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

const GOLD      = '#C9A84C';
const DARK      = '#1C1C1C';
const WHITE     = '#FFFFFF';
const PAPER     = '#F8F8F8';
const GRAY      = '#888888';
const BORDER    = '#E0E0E0';
const GOLD_TINT = '#FDF8EE';
const GOLD_BDR  = '#D4B26A';

function hexToRGB(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function fill(doc, hex)   { const [r,g,b] = hexToRGB(hex); doc.fillColor([r,g,b]); }
function stroke(doc, hex) { const [r,g,b] = hexToRGB(hex); doc.strokeColor([r,g,b]); }

function generatePDF(rateData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [794, 1123],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: { Title: 'Creator Rate Card — NOCHILL' }
    });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W   = 794;
    const PAD = 56;
    const COL = W - PAD * 2; // 682

    // Parse "Instagram · Parenting & Family · Reel / Short Video"
    const parts       = (rateData.platform || '').split(' · ');
    const platformName = parts[0] || '';
    const niche        = parts[1] || '';
    const contentType  = parts[2] || '';
    const handle       = (rateData.handle || '').trim();
    const er           = parseFloat(rateData.er) || 0;
    const xSA          = (er / 3.39).toFixed(1);
    const xGlobal      = (er / 1.49).toFixed(1);

    // ── 1. FULL PAGE PAPER BACKGROUND ─────────────────────────
    fill(doc, PAPER);
    doc.rect(0, 0, W, 1123).fill();

    // ── 2. HEADER BAND (dark) ──────────────────────────────── Y: 0–92
    fill(doc, DARK);
    doc.rect(0, 0, W, 92).fill();

    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('CREATOR RATE CARD  ·  NOCHILL', PAD, 22, { characterSpacing: 2.2, lineBreak: false });

    fill(doc, WHITE);
    doc.font('Helvetica-Bold').fontSize(26)
       .text((rateData.creatorName || 'Creator').toUpperCase(), PAD, 36, { lineBreak: false });

    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(10)
       .text(rateData.tier || '', 0, 26, { width: W - PAD, align: 'right', lineBreak: false });
    fill(doc, WHITE); doc.opacity(0.6);
    doc.font('Helvetica').fontSize(9)
       .text(`${platformName}${niche ? ' · ' + niche : ''}`, 0, 42, { width: W - PAD, align: 'right', lineBreak: false });
    doc.opacity(1);

    // ── 3. GOLD STRIPE ─────────────────────────────────────── Y: 92–96
    fill(doc, GOLD);
    doc.rect(0, 92, W, 4).fill();

    // ── 4. CREATOR STATS STRIP (dark) ─────────────────────── Y: 96–180
    fill(doc, DARK);
    doc.rect(0, 96, W, 84).fill();

    const stats = [
      { label: 'PLATFORM',         value: platformName || '—' },
      { label: 'FOLLOWERS',        value: rateData.followers || '—' },
      { label: 'ENGAGEMENT RATE',  value: `${rateData.er || '0'}%` },
      { label: 'CONTENT TYPE',     value: contentType || '—' }
    ];
    const cellW = W / 4;
    stats.forEach((stat, i) => {
      const cx = i * cellW;
      if (i > 0) {
        fill(doc, '#333333');
        doc.rect(cx, 108, 1, 56).fill();
      }
      fill(doc, GRAY);
      doc.font('Helvetica-Bold').fontSize(7).text(stat.label, cx, 110, { width: cellW, align: 'center', characterSpacing: 1.5, lineBreak: false });
      fill(doc, GOLD);
      doc.font('Helvetica-Bold').fontSize(16).text(stat.value, cx, 127, { width: cellW, align: 'center', lineBreak: false });
    });
    // ER label (Exceptional / Strong / etc.)
    if (rateData.erLabel) {
      fill(doc, WHITE); doc.opacity(0.4);
      doc.font('Helvetica').fontSize(8).text(rateData.erLabel, cellW * 2, 148, { width: cellW, align: 'center', lineBreak: false });
      doc.opacity(1);
    }

    // ── 5. BOTTOM GOLD STRIPE ──────────────────────────────── Y: 180–184
    fill(doc, GOLD);
    doc.rect(0, 180, W, 4).fill();

    // ── 6. RATE SECTION LABEL ──────────────────────────────── Y: 208
    const lblY = 208;
    fill(doc, GOLD); doc.opacity(0.2);
    doc.rect(PAD, lblY - 10, COL, 1).fill();
    doc.opacity(1);
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('YOUR RATES — BACKED BY 2024 SA CPM DATA', PAD, lblY, { characterSpacing: 1.5, lineBreak: false });

    // ── 7. THREE RATE BOXES ────────────────────────────────── Y: 230–350
    const boxY = 230;
    const boxH = 120;
    const boxW = (COL - 20) / 3; // ~220px each

    // Floor
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(PAD, boxY, boxW, boxH, 6).fillAndStroke();
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5).text('FLOOR RATE', PAD, boxY + 14, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(22).text(rateData.floor || 'R 0', PAD, boxY + 38, { width: boxW, align: 'center' });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Minimum — non-negotiable', PAD, boxY + 94, { width: boxW, align: 'center' });

    // Standard (recommended) — gold hero
    const recX = PAD + boxW + 10;
    fill(doc, GOLD_TINT); stroke(doc, GOLD_BDR);
    doc.roundedRect(recX, boxY, boxW, boxH, 6).fillAndStroke();
    fill(doc, GOLD);
    doc.rect(recX, boxY, boxW, 18).fill();
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(7).text('RECOMMENDED', recX, boxY + 5, { width: boxW, align: 'center', characterSpacing: 1 });
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('STANDARD RATE', recX, boxY + 24, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(36).text(rateData.standard || 'R 0', recX, boxY + 38, { width: boxW, align: 'center' });
    fill(doc, DARK); doc.opacity(0.5);
    doc.font('Helvetica').fontSize(9).text('Your opening quote to brands', recX, boxY + 98, { width: boxW, align: 'center' });
    doc.opacity(1);

    // Premium
    const premX = recX + boxW + 10;
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(premX, boxY, boxW, boxH, 6).fillAndStroke();
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5).text('PREMIUM RATE', premX, boxY + 14, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(22).text(rateData.ceiling || 'R 0', premX, boxY + 38, { width: boxW, align: 'center' });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Full rights + exclusivity', premX, boxY + 94, { width: boxW, align: 'center' });

    // ── 8. DIVIDER ─────────────────────────────────────────── Y: 370
    const div1Y = boxY + boxH + 20;
    fill(doc, BORDER);
    doc.rect(PAD, div1Y, COL, 1).fill();

    // ── 9. CREATOR PROFILE  /  CONTACT & BOOKING ─────────── Y: 398
    const detY = div1Y + 28;
    const half = COL / 2 - 10;
    const ROW  = 34;

    // LEFT: CREATOR PROFILE
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('CREATOR PROFILE', PAD, detY, { characterSpacing: 1.5 });

    const profileRows = [
      ['Platform',         platformName || '—'],
      ['Niche',            niche        || '—'],
      ['Content Type',     contentType  || '—'],
      ['Followers',        rateData.followers || '—'],
      ['Engagement Rate',  `${rateData.er || '0'}% (${rateData.erLabel || ''})`]
    ];
    profileRows.forEach(([label, value], i) => {
      const ry = detY + 20 + i * ROW;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(10.5).text(label, PAD, ry, { lineBreak: false });
      fill(doc, DARK);
      doc.font('Helvetica-Bold').fontSize(10.5).text(value, PAD, ry, { width: half, align: 'right', lineBreak: false });
      if (i < profileRows.length - 1) {
        fill(doc, '#F0F0F0');
        doc.rect(PAD, ry + 26, half, 0.5).fill();
      }
    });

    // RIGHT: CONTACT & BOOKING
    const col2X = PAD + half + 20;
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('CONTACT & BOOKING', col2X, detY, { characterSpacing: 1.5 });

    const contactRows = [
      ['Name',      rateData.creatorName || '—'],
      ['Handle',    handle ? handle : `DM via ${platformName || 'social media'}`],
      ['Date',      rateData.date || ''],
      ...(rateData.brand ? [['Prepared for', rateData.brand]] : []),
      ['Status',    'Available for brand collaborations'],
      ['Next step', 'Reply to this email to start']
    ];
    contactRows.forEach(([label, value], i) => {
      const ry = detY + 20 + i * ROW;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(10.5).text(label, col2X, ry, { lineBreak: false });
      const isHandle = label === 'Handle';
      const isBrand  = label === 'Prepared for';
      fill(doc, isHandle || isBrand ? GOLD : DARK);
      doc.font('Helvetica-Bold').fontSize(10.5).text(value, col2X, ry, { width: half, align: 'right', lineBreak: false });
      if (i < contactRows.length - 1) {
        fill(doc, '#F0F0F0');
        doc.rect(col2X, ry + 26, half, 0.5).fill();
      }
    });

    // ── 10. DIVIDER 2 ──────────────────────────────────────────
    const profileBottom = detY + 20 + Math.max(profileRows.length, contactRows.length) * ROW;
    const div2Y = profileBottom + 14;
    fill(doc, BORDER);
    doc.rect(PAD, div2Y, COL, 1).fill();

    // ── 11. STANDARD TERMS (dark panel) ───────────────────── ~Y: 630
    const termsY  = div2Y + 18;
    const termsH  = 204;
    const tPad    = 20;
    const tHalfW  = COL / 2 - tPad * 2;
    const tLeft   = PAD + tPad;
    const tRight  = PAD + COL / 2 + tPad;

    fill(doc, DARK);
    doc.rect(PAD, termsY, COL, termsH).fill();
    fill(doc, GOLD);
    doc.rect(PAD, termsY, COL, 3).fill();

    // Left: Delivery & Revisions
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('DELIVERY & REVISIONS', tLeft, termsY + 16, { characterSpacing: 1.5 });
    const leftTerms = [
      ['Turnaround',     '5–7 business days'],
      ['Revisions',      '2 rounds included per deliverable'],
      ['Approval',       'Content shared before going live'],
      ['Brief required', 'Written brief needed to proceed']
    ];
    leftTerms.forEach(([label, value], i) => {
      const ty = termsY + 36 + i * 38;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(8.5).text(label, tLeft, ty, { lineBreak: false });
      fill(doc, WHITE);
      doc.font('Helvetica-Bold').fontSize(9.5).text(value, tLeft, ty + 13, { width: tHalfW, lineBreak: false });
    });

    // Right: Usage & Payment
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('USAGE & PAYMENT', tRight, termsY + 16, { characterSpacing: 1.5 });
    const rightTerms = [
      ['Usage rights',         '6 months (standard) / 12 months (premium)'],
      ['Gifted products',      'Additional to the quoted rate'],
      ['Exclusivity',          'Premium rate only — agreed in writing'],
      ['Payment',              '50% deposit upfront · 50% on delivery']
    ];
    rightTerms.forEach(([label, value], i) => {
      const ty = termsY + 36 + i * 38;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(8.5).text(label, tRight, ty, { lineBreak: false });
      fill(doc, WHITE);
      doc.font('Helvetica-Bold').fontSize(9.5).text(value, tRight, ty + 13, { width: tHalfW });
    });

    // ── 12. ENGAGEMENT ADVANTAGE PANEL ─────────────────────── Y: ~852
    const erPanelY = termsY + termsH + 18;
    const erPanelH = 124;
    fill(doc, GOLD_TINT); stroke(doc, GOLD_BDR);
    doc.rect(PAD, erPanelY, COL, erPanelH).fillAndStroke();
    fill(doc, GOLD);
    doc.rect(PAD, erPanelY, 4, erPanelH).fill();

    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('YOUR ENGAGEMENT ADVANTAGE', PAD + 18, erPanelY + 14, { characterSpacing: 1.5, lineBreak: false });

    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(13)
       .text(`${rateData.er || '0'}% ER — ${xSA}× the SA average  ·  ${xGlobal}× the global average`, PAD + 18, erPanelY + 30, { width: COL - 22, lineBreak: false });

    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(10).lineGap(2)
       .text(
         `Brands pay for engagement, not just reach. Your audience is significantly more engaged than the SA average of 3.39% — that means lower cost-per-engaged-viewer for the brand. When they push back on your rate, this document is your evidence.`,
         PAD + 18, erPanelY + 52, { width: COL - 22 }
       );

    // ── 13. FOOTER ─────────────────────────────────────────── Y: 1060
    const footerY = 1060;
    fill(doc, GOLD); doc.opacity(0.25);
    doc.rect(PAD, footerY - 12, COL, 2).fill();
    doc.opacity(1);
    fill(doc, DARK); doc.opacity(0.5);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('CONTENTCREATORHUB.ONLINE  ·  @NOCHILL_GOD', PAD, footerY, { characterSpacing: 1.5, lineBreak: false });
    if (handle) {
      fill(doc, GOLD); doc.opacity(0.85);
      doc.font('Helvetica-Bold').fontSize(8)
         .text(handle, 0, footerY, { width: W - PAD, align: 'right', lineBreak: false });
    }
    doc.opacity(1);

    doc.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, brand, rateData } = req.body;
  if (!email || !rateData) return res.status(400).json({ ok: false, error: 'Email and rate data required' });
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD) {
    console.error('Missing ZOHO_EMAIL or ZOHO_APP_PASSWORD env vars');
    return res.status(500).json({ ok: false, error: 'Email service not configured — env vars missing.' });
  }

  const displayName = name || 'Creator';
  const filename = `rate-card-${(name || 'creator').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.pdf`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;color:#111;">
      <div style="border-bottom:3px solid #C9A84C;padding-bottom:14px;margin-bottom:24px;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#C9A84C;">NOCHILL Rate Calculator</span>
      </div>
      <p style="font-size:16px;font-weight:700;margin:0 0 12px;">Hey ${displayName},</p>
      <p style="font-size:14px;color:#444;line-height:1.75;margin:0 0 16px;">Your creator rate card is attached. Forward this PDF directly to any brand you're pitching — your rate is backed by real 2024 SA CPM data. When they push back on your price, this document is your evidence.</p>
      ${brand ? `<p style="font-size:13px;color:#888;margin:0 0 16px;">Prepared for: <strong style="color:#111;">${brand}</strong></p>` : ''}
      <div style="background:#F5F5F5;border-left:3px solid #C9A84C;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="font-size:13px;color:#444;margin:0;line-height:1.65;"><strong>Floor rate = your absolute minimum.</strong> Never go below it. The premium rate is your ceiling for usage rights, exclusivity, or urgent turnarounds. The standard rate is what you quote first.</p>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.75;margin:24px 0 0;">Ready to close? The <a href="https://contentcreatorhub.online/products/first-brand-deal-script" style="color:#C9A84C;font-weight:600;">Brand Deal Pitch Script (R149)</a> gives you word-for-word scripts — including exactly what to say when a brand pushes back on your rate.</p>
      <div style="border-top:1px solid #eee;margin-top:32px;padding-top:14px;">
        <p style="font-size:11px;color:#aaa;margin:0;">contentcreatorhub.online &nbsp;&middot;&nbsp; Generated by NOCHILL Rate Calculator</p>
      </div>
    </div>
  `;

  try {
    const pdfBuffer = await generatePDF(rateData);

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      authMethod: 'LOGIN',
      auth: { type: 'login', user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_APP_PASSWORD },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"NOCHILL Rate Calculator" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: `${displayName} — your creator rate card is ready`,
      html: emailHtml,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }]
    });

    // Subscribe to MailerLite (non-blocking)
    if (process.env.MAILERLITE_API_KEY) {
      fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}` },
        body: JSON.stringify({ email, fields: { name: displayName }, groups: ['189168267230709259'], tags: ['rate_card_pdf'] })
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('send-rate-card error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
