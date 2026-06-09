import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getInvoiceById } from '@/modules/invoices/queries'
import { STATUS_LABELS, STATUS_CLASSES } from '@/modules/invoices/schemas'
import { InvoiceActions } from './invoice-actions'

interface Props {
  params: Promise<{ id: string }>
}

function formatEUR(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const invoice = await getInvoiceById(id)

  if (!invoice) notFound()

  const clientName = invoice.client?.personal_data?.name ?? invoice.client?.display_label ?? '—'
  const clientEmail = invoice.client?.personal_data?.email
  const clientAddress = invoice.client?.personal_data?.address

  const createdAt = new Date(invoice.created_at).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <div className="space-y-6">
      {/* Nav — wird beim Drucken ausgeblendet */}
      <div className="print:hidden flex items-center justify-between">
        <Link href="/invoices" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Rechnungen
        </Link>
        <InvoiceActions invoiceId={id} status={invoice.status} />
      </div>

      {/* Rechnungs-Dokument */}
      <div
        id="invoice-document"
        className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm print:shadow-none print:border-none print:rounded-none print:p-0"
      >
        {/* Kopfzeile */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">RECHNUNG</h1>
            <p className="mt-1 font-mono text-sm text-zinc-500">{invoice.invoice_number}</p>
          </div>
          <span className={`print:hidden inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
        </div>

        {/* Rechnungsdetails */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">An</p>
            <p className="font-medium text-zinc-900">{clientName}</p>
            {clientEmail && <p className="text-sm text-zinc-500">{clientEmail}</p>}
            {clientAddress && <p className="text-sm text-zinc-500 whitespace-pre-wrap">{clientAddress}</p>}
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Datum</span>
                <span className="text-zinc-700">{createdAt}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Fällig am</span>
                <span className="font-medium text-zinc-900">{dueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Positionen */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">Beschreibung</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Menge</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Einzelpreis</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-zinc-400">Gesamt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoice.line_items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-sm text-zinc-800">{item.description}</td>
                <td className="py-3 text-right text-sm text-zinc-600">{item.quantity}</td>
                <td className="py-3 text-right text-sm text-zinc-600">{formatEUR(item.unitPrice)}</td>
                <td className="py-3 text-right text-sm font-medium text-zinc-900">{formatEUR(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summen */}
        <div className="ml-auto w-64 space-y-1.5 border-t border-zinc-200 pt-4">
          {invoice.tax_mode !== 'none' && (
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Nettobetrag</span>
              <span>{formatEUR(Number(invoice.subtotal_net))}</span>
            </div>
          )}
          {invoice.tax_mode !== 'none' && (
            <div className="flex justify-between text-sm text-zinc-500">
              <span>MwSt. {Number(invoice.tax_rate)}%</span>
              <span>{formatEUR(Number(invoice.tax_amount))}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
            <span>Gesamtbetrag</span>
            <span>{formatEUR(Number(invoice.total_gross))}</span>
          </div>
          {invoice.tax_mode === 'none' && (
            <p className="text-xs text-zinc-400">
              Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
            </p>
          )}
        </div>

        {/* Notizen */}
        {invoice.notes && (
          <div className="mt-8 border-t border-zinc-100 pt-5">
            <p className="text-sm text-zinc-500 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
