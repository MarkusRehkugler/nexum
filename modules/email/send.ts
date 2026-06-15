'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'Nexum <noreply@getnexum.app>'

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:-apple-system,Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
  <div style="background:#0F172A;padding:20px 28px;">
    <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.02em;">NEXUM</span>
  </div>
  <div style="padding:28px 32px 32px;">
    ${body}
  </div>
</div>
<p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px;">
  Diese E-Mail wurde automatisch von Nexum generiert.
</p>
</body>
</html>`
}

export async function sendAppointmentConfirmation(params: {
  to: string
  clientName: string
  title: string
  typeLabel: string
  dateTime: string
  endTime: string
  durationMinutes: number
  senderName: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { to, clientName, title, typeLabel, dateTime, endTime, durationMinutes, senderName } = params

  const html = emailLayout(
    `Terminbestätigung: ${title}`,
    `<h1 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 20px;">Terminbestätigung</h1>
    <p style="color:#334155;font-size:15px;margin:0 0 8px;">Guten Tag ${clientName},</p>
    <p style="color:#334155;font-size:15px;margin:0 0 24px;">hiermit bestätige ich Ihren Termin:</p>
    <div style="background:#f1f5f9;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:14px;color:#64748b;">${typeLabel}</p>
      <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0F172A;">${title}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#334155;">📅 ${dateTime} – ${endTime} Uhr</p>
      <p style="margin:0;font-size:14px;color:#334155;">⏱ ${durationMinutes} Minuten</p>
    </div>
    <p style="color:#334155;font-size:14px;margin:0 0 24px;">
      Bitte teilen Sie mir rechtzeitig mit, falls Sie den Termin nicht wahrnehmen können.
    </p>
    <p style="color:#334155;font-size:15px;margin:0;">Mit freundlichen Grüßen<br>
    <strong>${senderName}</strong></p>`
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Terminbestätigung: ${title}`,
    html,
  })

  if (error) console.error('[email] sendAppointmentConfirmation:', error)
}

export async function sendAppointmentReminder(params: {
  to: string
  clientName: string
  title: string
  dateTime: string
  endTime: string
  senderName: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { to, clientName, title, dateTime, endTime, senderName } = params

  const html = emailLayout(
    `Erinnerung: ${title}`,
    `<h1 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 20px;">Terminerinnerung</h1>
    <p style="color:#334155;font-size:15px;margin:0 0 8px;">Guten Tag ${clientName},</p>
    <p style="color:#334155;font-size:15px;margin:0 0 24px;">ich möchte Sie an Ihren bevorstehenden Termin erinnern:</p>
    <div style="background:#f1f5f9;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0F172A;">${title}</p>
      <p style="margin:0;font-size:14px;color:#334155;">📅 ${dateTime} – ${endTime} Uhr</p>
    </div>
    <p style="color:#334155;font-size:14px;margin:0 0 24px;">
      Bei Fragen oder falls Sie den Termin nicht wahrnehmen können, melden Sie sich bitte.
    </p>
    <p style="color:#334155;font-size:15px;margin:0;">Mit freundlichen Grüßen<br>
    <strong>${senderName}</strong></p>`
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Erinnerung: ${title} morgen`,
    html,
  })

  if (error) console.error('[email] sendAppointmentReminder:', error)
}

export async function sendInvoiceNotification(params: {
  to: string
  clientName: string
  invoiceNumber: string
  totalGross: string
  invoiceDate: string
  dueDate: string | null
  senderName: string
  bankDetails: string | null
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { to, clientName, invoiceNumber, totalGross, invoiceDate, dueDate, senderName, bankDetails } = params

  const html = emailLayout(
    `Rechnung ${invoiceNumber}`,
    `<h1 style="font-size:20px;font-weight:700;color:#0F172A;margin:0 0 20px;">Rechnung ${invoiceNumber}</h1>
    <p style="color:#334155;font-size:15px;margin:0 0 8px;">Guten Tag ${clientName},</p>
    <p style="color:#334155;font-size:15px;margin:0 0 24px;">
      anbei erhalten Sie Rechnung <strong>${invoiceNumber}</strong> vom ${invoiceDate} über <strong>${totalGross}</strong>.
    </p>
    ${dueDate ? `<p style="color:#334155;font-size:14px;margin:0 0 8px;">Zahlungsziel: <strong>${dueDate}</strong></p>` : ''}
    ${bankDetails ? `<p style="color:#334155;font-size:14px;margin:0 0 24px;white-space:pre-line;">${bankDetails}</p>` : ''}
    <p style="color:#64748b;font-size:13px;background:#f1f5f9;border-radius:6px;padding:12px 16px;margin:0 0 24px;">
      Bitte fügen Sie die PDF-Rechnung als Anhang bei.<br>
      (Rechnung öffnen → „Drucken / PDF" → Als PDF speichern → E-Mail anhängen)
    </p>
    <p style="color:#334155;font-size:15px;margin:0;">Mit freundlichen Grüßen<br>
    <strong>${senderName}</strong></p>`
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Rechnung ${invoiceNumber}`,
    html,
  })

  if (error) console.error('[email] sendInvoiceNotification:', error)
}
