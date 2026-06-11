'use server'

import { Resend } from 'resend'

interface SendInvoiceEmailParams {
  to: string
  clientName: string
  invoiceNumber: string
  totalGross: string
  invoiceDate: string
  dueDate: string | null
  senderName: string
  senderAddress?: string
  bankDetails?: string | null
  invoiceUrl: string
  lineItems: { description: string; quantity: number; total: number }[]
}

function buildInvoiceHtml(p: SendInvoiceEmailParams): string {
  const itemRows = p.lineItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151">${item.description}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right">${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.total)}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#18181b;padding:24px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:600">${p.senderName}</p>
      ${p.senderAddress ? `<p style="margin:4px 0 0;color:#a1a1aa;font-size:13px">${p.senderAddress}</p>` : ''}
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Guten Tag ${p.clientName},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#111827">anbei erhalten Sie Ihre <strong>Rechnung ${p.invoiceNumber}</strong>.</p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;padding-bottom:8px">Beschreibung</th>
              <th style="text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;padding-bottom:8px">Menge</th>
              <th style="text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;padding-bottom:8px">Betrag</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid #e5e7eb;margin-top:4px">
          <span style="font-size:15px;font-weight:700;color:#111827">Gesamtbetrag</span>
          <span style="font-size:15px;font-weight:700;color:#111827">${p.totalGross}</span>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding:4px 0">Rechnungsdatum</td>
          <td style="font-size:13px;color:#374151;text-align:right;padding:4px 0">${p.invoiceDate}</td>
        </tr>
        ${p.dueDate ? `<tr><td style="font-size:13px;color:#6b7280;padding:4px 0">Zahlungsziel</td><td style="font-size:13px;font-weight:600;color:#111827;text-align:right;padding:4px 0">${p.dueDate}</td></tr>` : ''}
      </table>

      ${p.bankDetails ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px"><p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.05em">Bankverbindung</p><p style="margin:0;font-size:13px;color:#374151">${p.bankDetails}</p></div>` : ''}

      <a href="${p.invoiceUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Rechnung anzeigen & drucken →</a>

      <p style="margin:24px 0 0;font-size:13px;color:#6b7280">Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
      <p style="margin:4px 0 0;font-size:13px;color:#374151">Mit freundlichen Grüßen<br><strong>${p.senderName}</strong></p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">Diese E-Mail wurde mit Nexum erstellt und versendet.</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { error: 'RESEND_API_KEY nicht konfiguriert. E-Mail-Versand nicht möglich.' }

  const resend = new Resend(apiKey)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  const { error } = await resend.emails.send({
    from:    `${params.senderName} <${fromEmail}>`,
    to:      [params.to],
    subject: `Rechnung ${params.invoiceNumber}`,
    html:    buildInvoiceHtml(params),
  })

  if (error) {
    console.error('Resend error:', error)
    return { error: 'E-Mail konnte nicht versendet werden.' }
  }

  return {}
}
