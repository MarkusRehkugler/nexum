'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Printer, CheckCircle, Send, Mail, Loader2,
  XCircle, BellRing, AlertTriangle,
} from 'lucide-react'
import {
  markInvoicePaidAction,
  markInvoiceSentAction,
  cancelInvoiceAction,
  sendReminderAction,
} from '@/modules/invoices/actions'

interface Props {
  invoiceId: string
  status: string
  mailtoUrl?: string
  hasResend: boolean
  clientEmail?: string
  reminder1SentAt: string | null
  reminder2SentAt: string | null
  finalNoticeSentAt: string | null
}

export function InvoiceActions({
  invoiceId, status, mailtoUrl, hasResend, clientEmail,
  reminder1SentAt, reminder2SentAt, finalNoticeSentAt,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)

  async function handle(key: string, fn: () => Promise<{ error?: string } | void>) {
    setLoading(key)
    await fn()
    router.refresh()
    setLoading(null)
  }

  async function handleCancel() {
    setLoading('cancel')
    setCancelError(null)
    const fd = new FormData()
    fd.set('reason', cancelReason)
    const result = await cancelInvoiceAction(invoiceId, fd)
    if (result.error) {
      setCancelError(result.error)
      setLoading(null)
      return
    }
    setShowCancelModal(false)
    if (result.stornoId) {
      router.push(`/invoices/${result.stornoId}`)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  const btn = 'flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:shadow-sm disabled:opacity-50 transition-all'
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Drucken */}
        <button onClick={() => window.print()} className={btn}>
          <Printer className="h-4 w-4" />
          Drucken / PDF
        </button>

        {/* E-Mail versenden */}
        {clientEmail && hasResend ? (
          <button
            onClick={() => handle('email', async () => {
              const r = await fetch(`/api/invoices/${invoiceId}/send-email`, { method: 'POST' })
              const j = await r.json()
              if (j.error) alert(j.error)
            })}
            disabled={loading === 'email'}
            className={btn}
          >
            {loading === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Per E-Mail senden
          </button>
        ) : mailtoUrl ? (
          <a href={mailtoUrl} className={btn}>
            <Mail className="h-4 w-4" />
            Per E-Mail senden
          </a>
        ) : null}

        {/* Als versendet markieren */}
        {status === 'draft' && (
          <button
            onClick={() => handle('sent', () => markInvoiceSentAction(invoiceId))}
            disabled={loading === 'sent'}
            className={btn}
          >
            {loading === 'sent' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Als versendet markieren
          </button>
        )}

        {/* Als bezahlt markieren */}
        {(status === 'draft' || status === 'sent' || status === 'overdue') && (
          <button
            onClick={() => handle('paid', () => markInvoicePaidAction(invoiceId))}
            disabled={loading === 'paid'}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {loading === 'paid' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Als bezahlt markieren
          </button>
        )}

        {/* Mahnwesen */}
        {(status === 'sent' || status === 'overdue') && (
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 ml-1">
            {!reminder1SentAt && (
              <button
                title="1. Zahlungserinnerung vermerken"
                onClick={() => handle('r1', () => sendReminderAction(invoiceId, 1))}
                disabled={!!loading}
                className={`${btn} text-xs px-2.5`}
              >
                <BellRing className="h-3.5 w-3.5" />
                1. Mahnung
              </button>
            )}
            {reminder1SentAt && !reminder2SentAt && (
              <button
                title="2. Mahnung vermerken"
                onClick={() => handle('r2', () => sendReminderAction(invoiceId, 2))}
                disabled={!!loading}
                className={`${btn} text-xs px-2.5`}
              >
                <BellRing className="h-3.5 w-3.5" />
                2. Mahnung
              </button>
            )}
            {reminder1SentAt && reminder2SentAt && !finalNoticeSentAt && (
              <button
                title="Letztes Mahnschreiben vermerken"
                onClick={() => handle('final', () => sendReminderAction(invoiceId, 'final'))}
                disabled={!!loading}
                className={`${btn} text-xs px-2.5 text-red-600 border-red-200 hover:border-red-300`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Letzte Mahnung
              </button>
            )}
            {reminder1SentAt && (
              <span className="text-xs text-zinc-400 pl-1">
                {finalNoticeSentAt
                  ? `Letzte Mahnung: ${fmtDate(finalNoticeSentAt)}`
                  : reminder2SentAt
                  ? `2. Mahnung: ${fmtDate(reminder2SentAt)}`
                  : `1. Mahnung: ${fmtDate(reminder1SentAt)}`}
              </span>
            )}
          </div>
        )}

        {/* Stornieren */}
        {status !== 'canceled' && status !== 'paid' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <XCircle className="h-4 w-4" />
            Stornieren
          </button>
        )}
      </div>

      {/* Storno-Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Rechnung stornieren</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Es wird eine Storno-Rechnung mit negativen Beträgen erstellt. Die ursprüngliche Rechnung wird als „Storniert" markiert.
            </p>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Grund (optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="z. B. Doppelt erstellt, Klient hat storniert …"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
            />
            {cancelError && (
              <p className="mt-2 text-xs text-red-600">{cancelError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelError(null) }}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancel}
                disabled={loading === 'cancel'}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {loading === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" />}
                Storno erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
