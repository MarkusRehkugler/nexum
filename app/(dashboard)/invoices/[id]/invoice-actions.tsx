'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Printer, CheckCircle, Send, Loader2 } from 'lucide-react'
import { markInvoicePaidAction, markInvoiceSentAction } from '@/modules/invoices/actions'

interface Props {
  invoiceId: string
  status: string
}

export function InvoiceActions({ invoiceId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleMarkSent() {
    setLoading('sent')
    await markInvoiceSentAction(invoiceId)
    router.refresh()
    setLoading(null)
  }

  async function handleMarkPaid() {
    setLoading('paid')
    await markInvoicePaidAction(invoiceId)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Drucken / PDF */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm transition-all"
      >
        <Printer className="h-4 w-4" />
        Drucken / PDF
      </button>

      {/* Als versendet markieren */}
      {status === 'draft' && (
        <button
          onClick={handleMarkSent}
          disabled={loading === 'sent'}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm disabled:opacity-50 transition-all"
        >
          {loading === 'sent'
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />}
          Als versendet markieren
        </button>
      )}

      {/* Als bezahlt markieren */}
      {(status === 'draft' || status === 'sent' || status === 'overdue') && (
        <button
          onClick={handleMarkPaid}
          disabled={loading === 'paid'}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          {loading === 'paid'
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CheckCircle className="h-4 w-4" />}
          Als bezahlt markieren
        </button>
      )}
    </div>
  )
}
