import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

const GOLD   = '#C9A84C';
const DARK   = '#1C1C1C';
const WHITE  = '#FFFFFF';
const PAPER  = '#F8F8F8';
const GRAY   = '#888888';
const BORDER = '#E0E0E0';
const GOLD_TINT = '#FDF8EE';
const GOLD_BORDER = '#D4B26A';

function hexToRGB(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function fill(doc, hex) { const [r,g,b] = hexToRGB(hex); doc.fillColor([r,g,b]); }
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

    const W = 794;
    const PAD = 56;
    const COL = W - PAD * 2;

    // ── HEADER BAND ────────────────────────────────────────────
    fill(doc, DARK);
    doc.rect(0, 0, W, 92).fill();

    // Label
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('CREATOR RATE CARD  ·  NOCHILL', PAD, 22, { characterSpacing: 2.2 });

    // Creator name
    fill(doc, WHITE);
    const displayName = (rateData.creatorName || 'Creator').toUpperCase();
    doc.font('Helvetica-Bold').fontSize(26)
       .text(displayName, PAD, 36, { lineBreak: false });

    // Tier badge (right side)
    const tier = rateData.tier || '';
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(10)
       .text(tier, 0, 28, { width: W - PAD, align: 'right' });
    fill(doc, WHITE);
    doc.font('Helvetica').fontSize(9).opacity(0.6)
       .text(rateData.platform || '', 0, 44, { width: W - PAD, align: 'right' });
    doc.opacity(1);

    // ── GOLD STRIPE ───────────────────────────────────────────
    fill(doc, GOLD);
    doc.rect(0, 92, W, 4).fill();

    // ── PAPER BACKGROUND ──────────────────────────────────────
    fill(doc, PAPER);
    doc.rect(0, 96, W, 1027).fill();

    // ── ER BOX ────────────────────────────────────────────────
    const erY = 128;
    const erBoxW = 170;
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(PAD, erY, erBoxW, 78, 6).fillAndStroke();

    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5).text('ENGAGEMENT RATE', PAD + 12, erY + 12, { characterSpacing: 1.5, width: erBoxW - 24 });
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(28).text(`${rateData.er || '0.00'}%`, PAD + 12, erY + 24, { lineBreak: false });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text(rateData.erLabel || '', PAD + 12, erY + 55);

    // ER context box
    const ctxX = PAD + erBoxW + 14;
    const ctxW = COL - erBoxW - 14;
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(ctxX, erY, ctxW, 78, 6).fillAndStroke();
    fill(doc, DARK);
    doc.font('Helvetica').fontSize(10)
       .text('SA average: ', ctxX + 14, erY + 14, { continued: true, lineBreak: false });
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').text('3.39%');
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(10)
       .text('Global average: 1.49%', ctxX + 14, erY + 30)
       .text('Your ER is your negotiation leverage.', ctxX + 14, erY + 46)
       .text('Brands pay more for engaged audiences.', ctxX + 14, erY + 60);

    // ── RATE SECTION LABEL ────────────────────────────────────
    const lblY = erY + 100;
    fill(doc, GOLD); doc.opacity(0.25);
    doc.rect(PAD, lblY - 12, COL, 1).fill();
    doc.opacity(1);
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('YOUR RATES — BACKED BY 2024 SA CPM DATA', PAD, lblY, { characterSpacing: 1.5 });

    // ── THREE RATE BOXES ──────────────────────────────────────
    const boxY = lblY + 18;
    const boxH = 92;
    const boxW = (COL - 20) / 3;

    // Floor
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(PAD, boxY, boxW, boxH, 6).fillAndStroke();
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5).text('FLOOR RATE', PAD, boxY + 12, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(21).text(rateData.floor || 'R 0', PAD, boxY + 28, { width: boxW, align: 'center' });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Never go below this', PAD, boxY + 64, { width: boxW, align: 'center' });

    // Standard (recommended) — gold tint
    const recX = PAD + boxW + 10;
    fill(doc, GOLD_TINT); stroke(doc, GOLD_BORDER);
    doc.roundedRect(recX, boxY, boxW, boxH, 6).fillAndStroke();
    // Badge strip
    fill(doc, GOLD);
    doc.rect(recX, boxY, boxW, 16).fill();
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(7).text('RECOMMENDED', recX, boxY + 4, { width: boxW, align: 'center', characterSpacing: 1 });
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('STANDARD RATE', recX, boxY + 22, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(24).text(rateData.standard || 'R 0', recX, boxY + 35, { width: boxW, align: 'center' });
    fill(doc, DARK); doc.opacity(0.5);
    doc.font('Helvetica').fontSize(9).text('Quote this first', recX, boxY + 68, { width: boxW, align: 'center' });
    doc.opacity(1);

    // Ceiling
    const premX = recX + boxW + 10;
    fill(doc, WHITE); stroke(doc, BORDER);
    doc.roundedRect(premX, boxY, boxW, boxH, 6).fillAndStroke();
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(7.5).text('PREMIUM RATE', premX, boxY + 12, { width: boxW, align: 'center', characterSpacing: 1.5 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(21).text(rateData.ceiling || 'R 0', premX, boxY + 28, { width: boxW, align: 'center' });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Exclusivity & usage rights', premX, boxY + 64, { width: boxW, align: 'center' });

    // ── DIVIDER ───────────────────────────────────────────────
    const divY = boxY + boxH + 20;
    fill(doc, BORDER);
    doc.rect(PAD, divY, COL, 1).fill();

    // ── DETAILS TABLE ─────────────────────────────────────────
    const detY = divY + 20;
    const half = COL / 2 - 10;

    // Rate basis (left)
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('RATE BASIS', PAD, detY, { characterSpacing: 1.5 });

    const basisRows = [
      ['CPM Rate', rateData.cpmRate || '-'],
      ['CPE Rate', rateData.cpeRate || '-'],
      ['Followers', rateData.followers || '-'],
      ['Add-ons Multiplier', rateData.addonsMult || '×1.00']
    ];
    basisRows.forEach(([label, value], i) => {
      const ry = detY + 18 + i * 28;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(11).text(label, PAD, ry);
      fill(doc, DARK);
      doc.font('Helvetica-Bold').fontSize(11).text(value, PAD, ry, { width: half, align: 'right' });
      if (i < basisRows.length - 1) {
        fill(doc, '#F0F0F0');
        doc.rect(PAD, ry + 22, half, 0.5).fill();
      }
    });

    // Document info (right)
    const col2X = PAD + half + 20;
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(7.5).text('DOCUMENT INFO', col2X, detY, { characterSpacing: 1.5 });

    const infoRows = [
      ['Prepared', rateData.date || ''],
      ...(rateData.brand ? [['Prepared for', rateData.brand]] : []),
      ['Data source', '2024 SA CPM Rates']
    ];
    infoRows.forEach(([label, value], i) => {
      const ry = detY + 18 + i * 28;
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(11).text(label, col2X, ry);
      fill(doc, label === 'Prepared for' ? GOLD : DARK);
      doc.font('Helvetica-Bold').fontSize(11).text(value, col2X, ry, { width: half, align: 'right' });
      if (i < infoRows.length - 1) {
        fill(doc, '#F0F0F0');
        doc.rect(col2X, ry + 22, half, 0.5).fill();
      }
    });

    // ── DISCLAIMER ────────────────────────────────────────────
    const discY = detY + 18 + Math.max(basisRows.length, infoRows.length) * 28 + 20;
    fill(doc, DARK); doc.opacity(0.08);
    doc.rect(PAD, discY, COL, 0.5).fill();
    doc.opacity(0.55);
    fill(doc, DARK);
    doc.font('Helvetica').fontSize(8.5)
       .text('These rates are calculated using verified 2024 SA CPM and CPE data. They represent market-backed benchmarks, not minimums. Use your standard rate as your opening quote — negotiate from here.', PAD, discY + 12, { width: COL, lineGap: 2 });
    doc.opacity(1);

    // ── FOOTER ────────────────────────────────────────────────
    const footerY = 1075;
    fill(doc, GOLD); doc.opacity(0.3);
    doc.rect(PAD, footerY, COL, 2).fill();
    doc.opacity(1);
    fill(doc, DARK); doc.opacity(0.55);
    doc.font('Helvetica-Bold').fontSize(7.5)
       .text('CONTENTCREATORHUB.ONLINE  ·  @NOCHILL_GOD', PAD, footerY + 10, { characterSpacing: 1.5, lineBreak: false });
    doc.font('Helvetica').fontSize(8).opacity(0.5)
       .text('NOCHILL Rate Calculator', 0, footerY + 10, { width: W - PAD, align: 'right' });
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
      <p style="font-size:14px;color:#444;line-height:1.75;margin:0 0 16px;">Your creator rate card is attached. Forward this PDF to any brand you're pitching — your rate is backed by real 2024 SA CPM data. When they push back on your price, this document is your evidence.</p>
      ${brand ? `<p style="font-size:13px;color:#888;margin:0 0 16px;">Prepared for: <strong style="color:#111;">${brand}</strong></p>` : ''}
      <div style="background:#F5F5F5;border-left:3px solid #C9A84C;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="font-size:13px;color:#444;margin:0;line-height:1.65;"><strong>Floor rate = your absolute minimum.</strong> Never go below it. The premium rate is your ceiling for usage rights, exclusivity, or urgent turnarounds. The standard rate is what you quote first.</p>
      </div>
      <p style="font-size:13px;color:#888;line-height:1.75;margin:24px 0 0;">Ready to pitch? The <a href="https://contentcreatorhub.online/products/first-brand-deal-script" style="color:#C9A84C;font-weight:600;">Brand Deal Pitch Script (R149)</a> gives you word-for-word scripts to close the deal once you've sent this rate card — including exactly what to say when they push back on price.</p>
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
      auth: {
        type: 'login',
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_APP_PASSWORD
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"NOCHILL Rate Calculator" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: `${displayName} — your creator rate card is ready`,
      html: emailHtml,
      attachments: [{
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    // Subscribe to MailerLite (non-blocking)
    fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}` },
      body: JSON.stringify({ email, fields: { name: displayName }, groups: ['189168267230709259'], tags: ['rate_card_pdf'] })
    }).catch(() => {});

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('send-rate-card error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
