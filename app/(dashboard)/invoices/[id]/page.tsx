import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, AlertTriangle, RefreshCw } from 'lucide-react'
import { getInvoiceById } from '@/modules/invoices/queries'
import { getTenantProfile } from '@/modules/settings/queries'
import { STATUS_LABELS, STATUS_CLASSES } from '@/modules/invoices/schemas'
import { buildInvoiceMailtoUrl } from '@/modules/email/compose'
import { InvoiceActions } from './invoice-actions'

interface Props {
  params: Promise<{ id: string }>
}

function formatEUR(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const [invoice, profile] = await Promise.all([
    getInvoiceById(id),
    getTenantProfile(),
  ])

  if (!invoice) notFound()

  const clientName    = invoice.client?.personal_data?.name ?? invoice.client?.display_label ?? '—'
  const clientEmail   = invoice.client?.personal_data?.email
  const clientAddress = invoice.client?.personal_data?.address

  const isPerItem  = invoice.tax_mode === 'per_item'
  const hasAnyTax  = invoice.tax_mode !== 'none'
  const isStorno   = Number(invoice.total_gross) < 0
  const isKleinunt = profile?.tax_mode === 'kleinunternehmer'
  const isHeilprak = profile?.tax_mode === 'steuerfrei_heilpraktiker'

  const taxGroups = isPerItem
    ? Array.from(
        invoice.line_items.reduce((map, item) => {
          const rate = item.taxRate ?? 0
          const existing = map.get(rate) ?? { base: 0, tax: 0 }
          map.set(rate, {
            base: existing.base + item.total,
            tax:  existing.tax + Math.round(item.total * (rate / 100) * 100) / 100,
          })
          return map
        }, new Map<number, { base: number; tax: number }>())
      ).sort(([a], [b]) => a - b)
    : []

  const hasExemptItems = isPerItem && taxGroups.some(([rate]) => rate === 0)

  const profileIncomplete = !profile?.company_name && !profile?.first_name
  const senderName = [
    profile?.company_name,
    profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null,
  ].filter(Boolean).join(' · ') || '—'
  const senderAddress = [
    profile?.street,
    profile?.zip && profile?.city ? `${profile.zip} ${profile.city}` : null,
  ].filter(Boolean).join(', ')
  const senderContact = [profile?.phone, profile?.email].filter(Boolean).join(' · ')

  const bankDetails = profile?.iban
    ? [profile.bank_name, profile.iban && `IBAN: ${profile.iban}`, profile.bic && `BIC: ${profile.bic}`]
        .filter(Boolean).join(' · ')
    : null

  const hasResend = !!process.env.RESEND_API_KEY

  const mailtoUrl = clientEmail ? buildInvoiceMailtoUrl({
    to:            clientEmail,
    clientName,
    invoiceNumber: invoice.invoice_number,
    totalGross:    formatEUR(Number(invoice.total_gross)),
    invoiceDate:   fmtDate(invoice.issued_date ?? invoice.created_at),
    dueDate:       invoice.due_date ? fmtDate(invoice.due_date) : null,
    senderName,
    bankDetails,
  }) : undefined

  const invoiceDate = invoice.issued_date ?? invoice.created_at

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/invoices" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Rechnungen
        </Link>
        <InvoiceActions
          invoiceId={id}
          status={invoice.status}
          mailtoUrl={mailtoUrl}
          hasResend={hasResend}
          clientEmail={clientEmail}
          reminder1SentAt={invoice.reminder_1_sent_at}
          reminder2SentAt={invoice.reminder_2_sent_at}
          finalNoticeSentAt={invoice.final_notice_sent_at}
        />
      </div>

      {/* Warnungen */}
      {profileIncomplete && (
        <div className="print:hidden flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Absenderadresse fehlt auf der Rechnung.{' '}
            <Link href="/settings/profile" className="underline font-medium">Stammdaten hinterlegen →</Link>
          </span>
        </div>
      )}

      {isStorno && (
        <div className="print:hidden flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Dies ist eine <strong>Stornorechnung</strong>.
            {invoice.canceled_invoice?.invoice_number && (
              <> Storniert wurde Rechnung{' '}
                <Link href={`/invoices?q=${invoice.cancels_invoice_id}`} className="underline font-medium">
                  {invoice.canceled_invoice.invoice_number}
                </Link>.
              </>
            )}
          </span>
        </div>
      )}

      {invoice.status === 'canceled' && !isStorno && (
        <div className="print:hidden flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <RefreshCw className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Diese Rechnung wurde storniert.
            {invoice.cancellation_reason && <> Grund: {invoice.cancellation_reason}</>}
          </span>
        </div>
      )}

      {/* Rechnungs-Dokument */}
      <div
        id="invoice-document"
        className="rounded-xl border border-zinc-200 bg-white p-10 shadow-sm print:shadow-none print:border-none print:rounded-none print:p-0 max-w-3xl mx-auto font-sans"
      >
        {/* Kopfzeile */}
        <div className="flex items-start justify-between mb-10">
          <div className="space-y-0.5">
            <p className="font-semibold text-zinc-900">{senderName}</p>
            {senderAddress && <p className="text-sm text-zinc-500">{senderAddress}</p>}
            {senderContact && <p className="text-sm text-zinc-500">{senderContact}</p>}
            {profile?.website && <p className="text-sm text-zinc-400">{profile.website}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {isStorno ? 'STORNORECHNUNG' : 'RECHNUNG'}
            </h1>
            <p className="font-mono text-sm text-zinc-500 mt-1">{invoice.invoice_number}</p>
            <span className={`print:hidden mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
        </div>

        {/* Empfänger + Metadaten */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">An</p>
            <p className="font-medium text-zinc-900">{clientName}</p>
            {clientEmail   && <p className="text-sm text-zinc-500">{clientEmail}</p>}
            {clientAddress && <p className="text-sm text-zinc-500 whitespace-pre-wrap">{clientAddress}</p>}
          </div>
          <div className="text-right space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Rechnungsdatum</span>
              <span className="text-zinc-700">{fmtDate(invoiceDate)}</span>
            </div>
            {invoice.service_period_from && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Leistungszeitraum</span>
                <span className="text-zinc-700">
                  {fmtDateShort(invoice.service_period_from)}
                  {invoice.service_period_to && ` – ${fmtDateShort(invoice.service_period_to)}`}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Fällig am</span>
              <span className="font-medium text-zinc-900">
                {invoice.due_date ? fmtDate(invoice.due_date) : '—'}
              </span>
            </div>
            {profile?.tax_id && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Steuernummer</span>
                <span className="text-zinc-700">{profile.tax_id}</span>
              </div>
            )}
            {profile?.vat_id && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">USt-IdNr</span>
                <span className="text-zinc-700">{profile.vat_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Positionen */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Beschreibung</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Menge</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Einzelpreis</th>
              {isPerItem && (
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">MwSt.</th>
              )}
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Gesamt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoice.line_items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-sm text-zinc-800">{item.description}</td>
                <td className="py-3 text-right text-sm text-zinc-600">{item.quantity}</td>
                <td className="py-3 text-right text-sm text-zinc-600">{formatEUR(item.unitPrice)}</td>
                {isPerItem && (
                  <td className="py-3 text-right text-sm text-zinc-500">
                    {(item.taxRate ?? 0) === 0 ? '0%*' : `${item.taxRate}%`}
                  </td>
                )}
                <td className="py-3 text-right text-sm font-medium text-zinc-900">{formatEUR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summen */}
        <div className="ml-auto w-72 space-y-1.5 border-t border-zinc-200 pt-4">
          {hasAnyTax && (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Nettobetrag</span>
              <span>{formatEUR(Number(invoice.subtotal_net))}</span>
            </div>
          )}
          {isPerItem && taxGroups.map(([rate, { tax }]) => rate > 0 && (
            <div key={rate} className="flex justify-between text-sm text-zinc-500">
              <span>MwSt. {rate}%</span>
              <span>{formatEUR(tax)}</span>
            </div>
          ))}
          {invoice.tax_mode === 'excluded' && (
            <div className="flex justify-between text-sm text-zinc-500">
              <span>MwSt. {Number(invoice.tax_rate)}%</span>
              <span>{formatEUR(Number(invoice.tax_amount))}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
            <span>Gesamtbetrag</span>
            <span>{formatEUR(Number(invoice.total_gross))}</span>
          </div>
          {(isKleinunt || invoice.tax_mode === 'none') && (
            <p className="text-xs text-zinc-400 pt-1">
              Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
            </p>
          )}
          {isHeilprak && invoice.tax_mode === 'none' && (
            <p className="text-xs text-zinc-400">
              Steuerbefreit gemäß §4 Nr. 14 UStG (Heilbehandlungen).
            </p>
          )}
          {hasExemptItems && (
            <p className="text-xs text-zinc-400 pt-1">
              * Gemäß §4 Nr. 14 UStG steuerbefreite Leistung.
            </p>
          )}
        </div>

        {/* Notizen */}
        {invoice.notes && (
          <div className="mt-8 border-t border-zinc-100 pt-5">
            <p className="text-sm text-zinc-500 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Bankverbindung */}
        {bankDetails && (
          <div className="mt-10 border-t border-zinc-100 pt-5 text-xs text-zinc-400 space-y-0.5">
            <p className="font-medium text-zinc-500">Bankverbindung</p>
            <p>{bankDetails}</p>
          </div>
        )}
      </div>
    </div>
  )
}
