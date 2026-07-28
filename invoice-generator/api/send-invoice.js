import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// This tool had NO invoice-emailing code anywhere — "Save as PDF" was just
// window.print(), and the only email-related code was an unrelated
// MailerLite lead-magnet capture. This endpoint is new, not a bugfix,
// following the exact PDFKit + nodemailer + Zoho pattern already proven
// working in the sibling rate-card-calculator tool.

const GOLD = '#C9A84C';
const DARK = '#1C1C1C';
const WHITE = '#FFFFFF';
const PAPER = '#F8F8F8';
const GRAY = '#888888';
const BORDER = '#E0E0E0';

function hexToRGB(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function fill(doc, hex) { const [r, g, b] = hexToRGB(hex); doc.fillColor([r, g, b]); }
function stroke(doc, hex) { const [r, g, b] = hexToRGB(hex); doc.strokeColor([r, g, b]); }

function generateInvoicePDF(inv) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [612, 792],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: { Title: `Invoice ${inv.invoiceNumber || ''}` },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 612;
    const PAD = 48;
    const COL = W - PAD * 2;

    fill(doc, PAPER);
    doc.rect(0, 0, W, 792).fill();

    // Header
    fill(doc, DARK);
    doc.rect(0, 0, W, 90).fill();
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(9).text('INVOICE', PAD, 24, { characterSpacing: 2 });
    fill(doc, WHITE);
    doc.font('Helvetica-Bold').fontSize(20).text(inv.creatorName || 'Your Name', PAD, 40);
    fill(doc, GOLD).opacity(0.85);
    doc.font('Helvetica-Bold').fontSize(11).text(inv.invoiceNumber || '', 0, 26, { width: W - PAD, align: 'right' });
    doc.opacity(1);

    let y = 116;
    // Bill to / dates
    fill(doc, GRAY);
    doc.font('Helvetica-Bold').fontSize(8).text('BILL TO', PAD, y, { characterSpacing: 1.2 });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(12).text(inv.agencyName || '—', PAD, y + 14);
    doc.font('Helvetica').fontSize(9).fillColor('#555').text(inv.billingContact || '', PAD, y + 30);

    const rightX = PAD + COL / 2;
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Invoice date', rightX, y, { width: COL / 2, align: 'right' });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(9).text(inv.invoiceDate || '', rightX, y + 12, { width: COL / 2, align: 'right' });
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(9).text('Due date', rightX, y + 28, { width: COL / 2, align: 'right' });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(9).text(inv.dueDate || '', rightX, y + 40, { width: COL / 2, align: 'right' });

    y += 70;
    if (inv.campaignName) {
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(9).text(`Re: ${inv.campaignName}`, PAD, y);
      y += 20;
    }

    // Line items table
    fill(doc, DARK);
    doc.rect(PAD, y, COL, 22).fill();
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(8).text('DESCRIPTION', PAD + 10, y + 7, { characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(8).text('AMOUNT', PAD, y + 7, { width: COL - 10, align: 'right', characterSpacing: 1 });
    y += 22;

    (inv.lineItems || []).forEach((item, i) => {
      const rowH = 26;
      if (i % 2 === 1) { fill(doc, '#F0EEE8'); doc.rect(PAD, y, COL, rowH).fill(); }
      fill(doc, DARK);
      doc.font('Helvetica').fontSize(10).text(item.desc || '', PAD + 10, y + 8, { width: COL - 140 });
      doc.font('Helvetica-Bold').fontSize(10).text(`R${Number(item.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, PAD, y + 8, { width: COL - 10, align: 'right' });
      y += rowH;
    });

    y += 10;
    fill(doc, BORDER);
    doc.rect(PAD, y, COL, 1).fill();
    y += 14;

    const totalsX = PAD + COL - 200;
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(10).text('Subtotal', totalsX, y, { width: 130, align: 'left' });
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(10).text(`R${Number(inv.subtotal || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, PAD, y, { width: COL - 10, align: 'right' });
    y += 18;
    if (inv.vatEnabled) {
      fill(doc, GRAY);
      doc.font('Helvetica').fontSize(10).text('VAT (15%)', totalsX, y, { width: 130, align: 'left' });
      fill(doc, DARK);
      doc.font('Helvetica-Bold').fontSize(10).text(`R${Number(inv.vat || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, PAD, y, { width: COL - 10, align: 'right' });
      y += 18;
    }
    fill(doc, GOLD);
    doc.rect(totalsX - 10, y, COL - (totalsX - PAD) + 10, 30).fill();
    fill(doc, DARK);
    doc.font('Helvetica-Bold').fontSize(12).text('TOTAL DUE', totalsX, y + 9, { width: 130 });
    doc.font('Helvetica-Bold').fontSize(14).text(`R${Number(inv.total || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, PAD, y + 7, { width: COL - 10, align: 'right' });
    y += 50;

    // Banking details
    fill(doc, DARK);
    doc.rect(PAD, y, COL, 90).fill();
    fill(doc, GOLD);
    doc.font('Helvetica-Bold').fontSize(8).text('BANKING DETAILS', PAD + 16, y + 14, { characterSpacing: 1.2 });
    const bankRows = [
      ['Account name', inv.accountName || '—'],
      ['Bank', inv.bankName || '—'],
      ['Account number', inv.accountNumber || '—'],
      ['Branch code', inv.branchCode || '—'],
    ];
    bankRows.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = PAD + 16 + col * (COL / 2);
      const by = y + 34 + row * 24;
      fill(doc, '#999');
      doc.font('Helvetica').fontSize(8.5).text(label, bx, by);
      fill(doc, WHITE);
      doc.font('Helvetica-Bold').fontSize(9.5).text(value, bx, by + 11);
    });

    y += 110;
    fill(doc, GRAY);
    doc.font('Helvetica').fontSize(8.5).text('Payment terms: End of Month (EOM). All amounts in South African Rand (ZAR). Please use the invoice number as payment reference.', PAD, y, { width: COL });

    fill(doc, GOLD).opacity(0.6);
    doc.font('Helvetica-Bold').fontSize(7.5).text('GENERATED BY NOCHILL INVOICE GENERATOR', PAD, 760, { characterSpacing: 1.2 });
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

  const { email, invoice } = req.body || {};
  if (!email || !invoice) return res.status(400).json({ ok: false, error: 'Email and invoice data required' });
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD) {
    console.error('Missing ZOHO_EMAIL or ZOHO_APP_PASSWORD env vars');
    return res.status(500).json({ ok: false, error: 'Email service not configured — env vars missing.' });
  }

  const displayName = invoice.creatorName || 'Creator';
  const filename = `invoice-${(invoice.invoiceNumber || 'draft').toLowerCase().replace(/[^a-z0-9-]/g, '')}.pdf`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;color:#111;">
      <div style="border-bottom:3px solid #C9A84C;padding-bottom:14px;margin-bottom:24px;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#C9A84C;">NOCHILL Invoice Generator</span>
      </div>
      <p style="font-size:16px;font-weight:700;margin:0 0 12px;">Hey ${displayName},</p>
      <p style="font-size:14px;color:#444;line-height:1.75;margin:0 0 16px;">Your invoice ${invoice.invoiceNumber ? `<strong>${invoice.invoiceNumber}</strong> ` : ''}is attached and ready to send to ${invoice.agencyName || 'your client'}.</p>
      <div style="border-top:1px solid #eee;margin-top:32px;padding-top:14px;">
        <p style="font-size:11px;color:#aaa;margin:0;">contentcreatorhub.online &nbsp;&middot;&nbsp; Generated by NOCHILL Invoice Generator</p>
      </div>
    </div>
  `;

  try {
    const pdfBuffer = await generateInvoicePDF(invoice);

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      authMethod: 'LOGIN',
      auth: { type: 'login', user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_APP_PASSWORD },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"NOCHILL Invoice Generator" <${process.env.ZOHO_EMAIL}>`,
      to: email,
      subject: `Invoice ${invoice.invoiceNumber || ''} — ready to send`.trim(),
      html: emailHtml,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    if (process.env.MAILERLITE_API_KEY) {
      fetch('https://connect.mailerlite.com/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}` },
        body: JSON.stringify({ email, fields: { name: displayName }, groups: ['189168267230709259'], tags: ['invoice_generator_pdf'] }),
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-invoice error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
