'use client'

import { useActionState, useRef, useState } from 'react'
import { saveInvoiceDesignAction } from '@/modules/settings/actions'
import type { TenantProfile } from '@/modules/settings/types'
import { CheckCircle2, AlertCircle, Upload, X } from 'lucide-react'

const POSITIONS: { value: TenantProfile['logo_position']; label: string }[] = [
  { value: 'left',   label: 'Links' },
  { value: 'right',  label: 'Rechts' },
  { value: 'center', label: 'Zentriert' },
  { value: 'none',   label: 'Kein Logo' },
]

const ACCENT_COLORS = [
  { value: '#18181b', label: 'Schwarz' },
  { value: '#7c3aed', label: 'Violett' },
  { value: '#2563eb', label: 'Blau' },
  { value: '#059669', label: 'Grün' },
  { value: '#b45309', label: 'Amber' },
]

interface Props {
  profile: TenantProfile | null
  logoUrl: string | null
}

export function InvoiceDesignForm({ profile, logoUrl }: Props) {
  const [state, action, pending] = useActionState(saveInvoiceDesignAction, {})

  const [position, setPosition]     = useState<TenantProfile['logo_position']>(profile?.logo_position ?? 'left')
  const [accentColor, setAccentColor] = useState(profile?.invoice_accent_color ?? '#18181b')
  const [showFooter, setShowFooter]  = useState(profile?.invoice_show_footer ?? true)
  const [preview, setPreview]        = useState<string | null>(logoUrl)
  const [removeLogo, setRemoveLogo]  = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setRemoveLogo(false)
  }

  function handleRemove() {
    setPreview(null)
    setRemoveLogo(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {/* Hidden state fields */}
      <input type="hidden" name="logo_position"        value={position ?? 'left'} />
      <input type="hidden" name="invoice_accent_color" value={accentColor} />
      <input type="hidden" name="invoice_show_footer"  value={String(showFooter)} />
      <input type="hidden" name="remove_logo"          value={String(removeLogo)} />

      {state.success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Gespeichert
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Logo */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Logo</h2>
          <p className="mt-0.5 text-xs text-zinc-400">PNG, JPG, WebP oder SVG — max. 2 MB</p>
        </div>

        <div className="flex items-start gap-4">
          {preview ? (
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Logo-Vorschau" className="h-16 w-auto max-w-[140px] object-contain rounded-lg border border-zinc-200" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 rounded-full bg-white border border-zinc-200 p-0.5 text-zinc-500 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex-shrink-0 h-16 w-32 rounded-lg border-2 border-dashed border-zinc-200 flex items-center justify-center text-xs text-zinc-400">
              Kein Logo
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {preview ? 'Anderes Logo wählen' : 'Logo hochladen'}
          </button>
          <input
            ref={fileRef}
            type="file"
            name="logo"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Logo-Position */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Position auf der Rechnung</label>
          <div className="flex gap-2 flex-wrap">
            {POSITIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPosition(p.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  position === p.value
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Akzentfarbe */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Akzentfarbe</h2>
          <p className="mt-0.5 text-xs text-zinc-400">Wird für Überschrift, Gesamtbetrag und Fußzeilen-Linie verwendet</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setAccentColor(c.value)}
              className="h-8 w-8 rounded-full transition-all"
              style={{
                backgroundColor: c.value,
                outline: accentColor === c.value ? `3px solid ${c.value}` : 'none',
                outlineOffset: '3px',
              }}
            />
          ))}
        </div>
      </section>

      {/* Fußzeile */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Kontakt-Fußzeile</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Zeigt Name, Adresse, Telefon, E-Mail, Website, Steuernummer und IBAN am Seitenende
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={showFooter}
              onChange={e => setShowFooter(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-700">Anzeigen</span>
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Speichern…' : 'Speichern'}
      </button>
    </form>
  )
}
