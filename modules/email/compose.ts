function mailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildInvoiceMailtoUrl(params: {
  to: string
  clientName: string
  invoiceNumber: string
  totalGross: string
  invoiceDate: string
  dueDate: string | null
  senderName: string
  bankDetails: string | null
}): string {
  const { to, clientName, invoiceNumber, totalGross, invoiceDate, dueDate, senderName, bankDetails } = params

  const body = [
    `Guten Tag ${clientName},`,
    '',
    `anbei erhalten Sie Rechnung ${invoiceNumber} vom ${invoiceDate} über ${totalGross}.`,
    '',
    dueDate ? `Zahlungsziel: ${dueDate}` : null,
    bankDetails ?? null,
    '',
    'Bitte fügen Sie die PDF-Rechnung als Anhang bei.',
    '(Rechnung öffnen → „Drucken / PDF" → Als PDF speichern → E-Mail anhängen)',
    '',
    'Bei Fragen stehe ich Ihnen gerne zur Verfügung.',
    '',
    'Mit freundlichen Grüßen',
    senderName,
  ].filter((l): l is string => l !== null).join('\n')

  return mailto(to, `Rechnung ${invoiceNumber}`, body)
}

export function buildAppointmentConfirmationMailtoUrl(params: {
  to: string
  clientName: string
  title: string
  typeLabel: string
  dateTime: string
  endTime: string
  durationMinutes: number
  senderName: string
}): string {
  const { to, clientName, title, typeLabel, dateTime, endTime, durationMinutes, senderName } = params

  const body = [
    `Guten Tag ${clientName},`,
    '',
    'hiermit bestätige ich Ihren Termin:',
    '',
    `${typeLabel}: ${title}`,
    `Datum/Uhrzeit: ${dateTime} – ${endTime} Uhr`,
    `Dauer: ${durationMinutes} Minuten`,
    '',
    'Bitte teilen Sie mir rechtzeitig mit, falls Sie den Termin nicht wahrnehmen können.',
    '',
    'Mit freundlichen Grüßen',
    senderName,
  ].join('\n')

  return mailto(to, `Terminbestätigung: ${title}`, body)
}

export function buildAppointmentReminderMailtoUrl(params: {
  to: string
  clientName: string
  title: string
  dateTime: string
  endTime: string
  senderName: string
}): string {
  const { to, clientName, title, dateTime, endTime, senderName } = params

  const body = [
    `Guten Tag ${clientName},`,
    '',
    'ich möchte Sie an Ihren bevorstehenden Termin erinnern:',
    '',
    title,
    `Datum/Uhrzeit: ${dateTime} – ${endTime} Uhr`,
    '',
    'Bei Fragen oder falls Sie den Termin nicht wahrnehmen können, melden Sie sich bitte.',
    '',
    'Mit freundlichen Grüßen',
    senderName,
  ].join('\n')

  return mailto(to, `Terminerinnerung: ${title}`, body)
}
