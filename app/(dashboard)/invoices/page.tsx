import Link from 'next/link'
import { getInvoices } from '@/modules/invoices/queries'
import { STATUS_LABELS, STATUS_CLASSES } from '@/modules/invoices/schemas'
import { Receipt, Plus } from 'lucide-react'

function formatEUR(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  const totalOpen = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + Number(i.total_gross), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Rechnungen</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {invoices.length === 0
              ? 'Noch keine Rechnungen.'
              : `${invoices.length} Rechnung${invoices.length !== 1 ? 'en' : ''}${totalOpen > 0 ? ` · ${formatEUR(totalOpen)} offen` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices/recurring"
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Wiederkehrend
          </Link>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Neue Rechnung
          </Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <Receipt className="mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-600">Noch keine Rechnungen</p>
          <p className="mt-1 text-xs text-zinc-400">Erstelle deine erste Rechnung nach einer Sitzung.</p>
          <Link
            href="/invoices/new"
            className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Erste Rechnung erstellen
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Nr.</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Klient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Betrag</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Fällig</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                <th className="relative px-5 py-3"><span className="sr-only">Öffnen</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.map((inv) => {
                const clientName = inv.client?.personal_data?.name ?? inv.client?.display_label ?? '—'
                const dueDate = inv.due_date
                  ? new Date(inv.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : '—'
                return (
                  <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-zinc-600">{inv.invoice_number}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-900">
                      <Link href={`/clients/${inv.client_id}`} className="hover:underline">{clientName}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-zinc-900">
                      {formatEUR(Number(inv.total_gross))}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-zinc-500">{dueDate}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-zinc-900 hover:text-zinc-600">
                        Öffnen →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
