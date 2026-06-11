import Link from 'next/link'
import { Plus, RefreshCw, Pause, Play, Trash2 } from 'lucide-react'
import { getRecurringInvoices } from '@/modules/invoices/queries'
import { toggleRecurringInvoiceAction, deleteRecurringInvoiceAction } from '@/modules/invoices/actions'
import { INTERVAL_LABELS } from '@/modules/invoices/schemas'

export default async function RecurringInvoicesPage() {
  const templates = await getRecurringInvoices()

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function fmtEUR(n: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  }

  function calcTotal(template: (typeof templates)[0]) {
    const subtotal = template.line_items.reduce((s, i) => s + i.total, 0)
    if (template.tax_mode === 'none') return subtotal
    const taxAmount = template.tax_mode === 'per_item'
      ? template.line_items.reduce((s, i) => s + i.total * ((i.taxRate ?? 0) / 100), 0)
      : subtotal * (template.tax_rate / 100)
    return template.tax_mode === 'excluded' || template.tax_mode === 'per_item'
      ? subtotal + taxAmount
      : subtotal
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Wiederkehrende Rechnungen</h1>
          <p className="mt-1 text-sm text-zinc-500">Vorlagen für monatliche oder periodische Rechnungen</p>
        </div>
        <Link
          href="/invoices/recurring/new"
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neue Vorlage
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-500">Noch keine Vorlagen</p>
          <p className="mt-1 text-xs text-zinc-400">Erstelle eine Vorlage für regelmäßige Rechnungen, z. B. monatliches Coaching-Honorar.</p>
          <Link href="/invoices/recurring/new" className="mt-4 inline-block text-sm font-medium text-zinc-900 underline">
            Erste Vorlage erstellen →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 shadow-sm">
          {templates.map((t) => {
            const clientName = t.client?.personal_data?.name ?? t.client?.display_label ?? '—'
            const total = calcTotal(t)

            return (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{clientName}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.active ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {t.active ? 'Aktiv' : 'Pausiert'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {INTERVAL_LABELS[t.interval]} · {t.line_items.length} Position{t.line_items.length !== 1 ? 'en' : ''} ·{' '}
                    Nächste: {fmtDate(t.next_invoice_date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">{fmtEUR(total)}</span>
                <div className="flex items-center gap-1">
                  <form action={async () => {
                    'use server'
                    await toggleRecurringInvoiceAction(t.id, !t.active)
                  }}>
                    <button
                      type="submit"
                      title={t.active ? 'Pausieren' : 'Aktivieren'}
                      className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition-colors"
                    >
                      {t.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await deleteRecurringInvoiceAction(t.id)
                  }}>
                    <button
                      type="submit"
                      title="Vorlage löschen"
                      className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Wiederkehrende Rechnungen werden täglich geprüft und automatisch erstellt, sobald das Datum erreicht ist.
      </p>
    </div>
  )
}
