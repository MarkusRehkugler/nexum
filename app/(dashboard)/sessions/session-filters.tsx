'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SESSION_TYPE_LABELS } from '@/modules/sessions/schemas'

interface Props {
  clients: Array<{ id: string; display_label: string; personal_data: { name?: string } | null }>
}

export function SessionFilters({ clients }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentType     = searchParams.get('type') ?? ''
  const currentClientId = searchParams.get('clientId') ?? ''
  const currentMonth    = searchParams.get('month') ?? ''

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/sessions?${params.toString()}`)
  }, [router, searchParams])

  const hasFilter = currentType || currentClientId || currentMonth

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Typ */}
      <select
        value={currentType}
        onChange={e => setParam('type', e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        <option value="">Alle Typen</option>
        {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Klient */}
      <select
        value={currentClientId}
        onChange={e => setParam('clientId', e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        <option value="">Alle Klienten</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>
            {c.personal_data?.name ?? c.display_label}
          </option>
        ))}
      </select>

      {/* Monat */}
      <input
        type="month"
        value={currentMonth}
        onChange={e => setParam('month', e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
      />

      {hasFilter && (
        <button
          onClick={() => router.push('/sessions')}
          className="text-xs text-zinc-400 hover:text-zinc-700 underline"
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  )
}
