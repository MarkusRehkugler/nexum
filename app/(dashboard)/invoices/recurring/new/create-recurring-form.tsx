'use client'

import { useActionState, useState } from 'react'
import { createRecurringInvoiceAction, type CreateRecurringState } from '@/modules/invoices/actions'
import type { ClientRecord } from '@/modules/clients/types'
import type { ServiceItem, TenantProfile } from '@/modules/settings/types'
import type { GebuhPosition } from '@/modules/invoices/types'
import { Plus, Trash2, BookOpen, Stethoscope, ChevronDown } from 'lucide-react'

const initialState: CreateRecurringState = {}

interface LineItemRow {
  description: string
  quantity:    string
  unitPrice:   string
  taxRate:     string
}

interface Props {
  clients:        ClientRecord[]
  serviceItems:   ServiceItem[]
  tenantProfile:  TenantProfile | null
  gebuhPositions: GebuhPosition[]
}

function formatEUR(val: string) {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function initTaxMode(profile: TenantProfile | null): string {
  if (!profile) return 'none'
  if (profile.tax_mode === 'regelbesteuerung_19' || profile.tax_mode === 'regelbesteuerung_7') return 'excluded'
  if (profile.tax_mode === 'steuerfrei_heilpraktiker') return 'per_item'
  return 'none'
}

export function CreateRecurringForm({ clients, serviceItems, tenantProfile, gebuhPositions }: Props) {
  const [state, action, pending] = useActionState(createRecurringInvoiceAction, initialState)
  const [items, setItems] = useState<LineItemRow[]>([
    { description: '', quantity: '1', unitPrice: '', taxRate: '0' },
  ])
  const [taxMode, setTaxMode]             = useState(() => initTaxMode(tenantProfile))
  const [taxRate, setTaxRate]             = useState('19')
  const [catalogOpenIdx, setCatalogOpenIdx] = useState<number | null>(null)
  const [catalogTab, setCatalogTab]       = useState<'service' | 'gebuh'>('service')
  const [gebuhExpanded, setGebuhExpanded] = useState<string | null>(null)

  function addItem() { setItems((p) => [...p, { description: '', quantity: '1', unitPrice: '', taxRate: '0' }]) }
  function removeItem(idx: number) { setItems((p) => p.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, f: keyof LineItemRow, v: string) {
    setItems((p) => p.map((item, i) => i === idx ? { ...item, [f]: v } : item))
  }
  function applyServiceItem(idx: number, si: ServiceItem) {
    setItems((p) => p.map((item, i) =>
      i === idx ? { ...item, description: si.name, unitPrice: si.unit_price.toFixed(2).replace('.', ','), taxRate: si.tax_rate.toString() } : item
    ))
    setCatalogOpenIdx(null)
  }
  function applyGebuhPosition(idx: number, pos: GebuhPosition) {
    setItems((p) => p.map((item, i) =>
      i === idx ? { ...item, description: `GebüH ${pos.ziffer} – ${pos.kurztext}`, unitPrice: pos.empfehlung_eur.toFixed(2).replace('.', ','), taxRate: '0' } : item
    ))
    setCatalogOpenIdx(null)
  }

  const isPerItem = taxMode === 'per_item'
  const subtotal  = items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * formatEUR(item.unitPrice), 0)
  const taxAmount = isPerItem
    ? items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * formatEUR(item.unitPrice) * ((parseFloat(item.taxRate) || 0) / 100), 0)
    : taxMode === 'none' ? 0 : subtotal * (parseFloat(taxRate) / 100)
  const total     = taxMode === 'excluded' || isPerItem ? subtotal + taxAmount : subtotal

  function fmtEUR(n: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  }

  const today    = new Date().toISOString().split('T')[0]
  const hasGebuh = gebuhPositions.length > 0 && (tenantProfile?.fee_schedules?.includes('gebuh') ?? false)
  const hasCatalog = serviceItems.length > 0 || hasGebuh

  const gebuhGroups = gebuhPositions.reduce<Record<string, GebuhPosition[]>>((acc, pos) => {
    const cat = pos.kategorie ?? 'Sonstiges'
    ;(acc[cat] ??= []).push(pos)
    return acc
  }, {})

  const inputCls = 'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

  return (
    <>
      {catalogOpenIdx !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setCatalogOpenIdx(null)} />
      )}

      <form action={action} className="space-y-6">
        {state.errors?.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.errors.general[0]}
          </div>
        )}

        {/* Klient */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Klient <span className="text-red-500">*</span>
          </label>
          <select name="clientId" required disabled={pending} className={`block w-full ${inputCls} px-3.5 py-2.5`}>
            <option value="" disabled>Klient wählen …</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.personal_data?.name || c.display_label}</option>
            ))}
          </select>
        </div>

        {/* Positionen */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">
              Positionen <span className="text-red-500">*</span>
            </label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
              <Plus className="h-3.5 w-3.5" />Position hinzufügen
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid gap-2 text-xs font-medium text-zinc-400 px-1 grid-cols-12">
              <span className={isPerItem ? 'col-span-4' : 'col-span-6'}>Beschreibung</span>
              <span className="col-span-2">Menge</span>
              <span className={isPerItem ? 'col-span-2' : 'col-span-3'}>Preis (€)</span>
              {isPerItem && <span className="col-span-3">MwSt.</span>}
              <span className="col-span-1" />
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className={`relative flex gap-1 ${isPerItem ? 'col-span-4' : 'col-span-6'}`}>
                  <input
                    type="text" name="item_description"
                    value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="z. B. Coaching-Sitzung 60 min"
                    required disabled={pending} className={`flex-1 min-w-0 ${inputCls}`}
                  />
                  {hasCatalog && (
                    <div className="relative z-50">
                      <button
                        type="button"
                        onClick={() => setCatalogOpenIdx(catalogOpenIdx === idx ? null : idx)}
                        className="h-full px-2 rounded-lg border border-zinc-300 bg-white text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        {hasGebuh ? <Stethoscope className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                      </button>
                      {catalogOpenIdx === idx && (
                        <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-zinc-200 bg-white shadow-xl py-1 z-50">
                          {serviceItems.length > 0 && hasGebuh && (
                            <div className="flex border-b border-zinc-100 px-2 pt-1 pb-0 gap-1">
                              <button type="button" onClick={() => setCatalogTab('service')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${catalogTab === 'service' ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}>
                                <BookOpen className="inline h-3 w-3 mr-1" />Katalog
                              </button>
                              <button type="button" onClick={() => setCatalogTab('gebuh')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${catalogTab === 'gebuh' ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-700'}`}>
                                <Stethoscope className="inline h-3 w-3 mr-1" />GebüH
                              </button>
                            </div>
                          )}
                          <div className="max-h-72 overflow-y-auto py-1">
                            {(catalogTab === 'service' || !hasGebuh) && serviceItems.map((si) => (
                              <button key={si.id} type="button" onClick={() => applyServiceItem(idx, si)}
                                className="flex w-full flex-col px-3 py-2 text-left hover:bg-zinc-50">
                                <span className="text-sm font-medium text-zinc-900">{si.name}</span>
                                <span className="text-xs text-zinc-400">
                                  {si.unit_price.toFixed(2).replace('.', ',')} € / {si.unit}
                                  {si.tax_rate === 0 ? ' · steuerbefreit' : ` · ${si.tax_rate}% MwSt.`}
                                </span>
                              </button>
                            ))}
                            {(catalogTab === 'gebuh' || !serviceItems.length) && hasGebuh && Object.entries(gebuhGroups).map(([kat, positions]) => (
                              <div key={kat}>
                                <button type="button" onClick={() => setGebuhExpanded(gebuhExpanded === kat ? null : kat)}
                                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 uppercase tracking-wide">
                                  {kat}
                                  <ChevronDown className={`h-3 w-3 transition-transform ${gebuhExpanded === kat ? 'rotate-180' : ''}`} />
                                </button>
                                {gebuhExpanded === kat && positions.map((pos) => (
                                  <button key={pos.id} type="button" onClick={() => applyGebuhPosition(idx, pos)}
                                    className="flex w-full flex-col px-4 py-2 text-left hover:bg-zinc-50">
                                    <span className="text-sm font-medium text-zinc-900">{pos.ziffer} – {pos.kurztext}</span>
                                    <span className="text-xs text-zinc-400">Empfehlung: {pos.empfehlung_eur.toFixed(2).replace('.', ',')} € · steuerbefreit</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input type="number" name="item_quantity" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  min={0.1} step="any" required disabled={pending} className={`col-span-2 ${inputCls}`} />
                <input type="text" name="item_unitPrice" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  placeholder="0,00" required disabled={pending} className={`${isPerItem ? 'col-span-2' : 'col-span-3'} ${inputCls}`} />
                {isPerItem && (
                  <>
                    <input type="hidden" name="item_taxRate" value={item.taxRate} />
                    <select value={item.taxRate} onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                      disabled={pending} className={`col-span-3 ${inputCls} text-xs`}>
                      <option value="0">0% – §4 Nr. 14</option>
                      <option value="7">7% MwSt.</option>
                      <option value="19">19% MwSt.</option>
                    </select>
                  </>
                )}
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)}
                    className="col-span-1 flex items-center justify-center text-zinc-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Nettobetrag</span><span className="font-medium">{fmtEUR(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1 font-semibold text-zinc-900">
              <span>Gesamt</span><span>{fmtEUR(total)}</span>
            </div>
          </div>
        </div>

        {/* Steuer */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Umsatzsteuer</label>
          <select name="taxMode" value={taxMode} onChange={(e) => setTaxMode(e.target.value)} disabled={pending}
            className={`block w-full ${inputCls} px-3.5 py-2.5`}>
            <option value="none">Keine – Kleinunternehmer §19 UStG</option>
            <option value="excluded">19% MwSt. zzgl.</option>
            <option value="included">MwSt. inklusive</option>
            <option value="per_item">Teilweise §4 Nr. 14 – je Position</option>
          </select>
          <input type="hidden" name="taxRate" value={isPerItem || taxMode === 'none' ? '0' : taxRate} />
        </div>

        {/* Wiederholungseinstellungen */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Wiederholungseinstellungen</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Rhythmus</label>
              <select name="interval" defaultValue="monthly" disabled={pending}
                className={`block w-full ${inputCls} px-3.5 py-2.5`}>
                <option value="monthly">Monatlich</option>
                <option value="quarterly">Vierteljährlich</option>
                <option value="yearly">Jährlich</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Tag im Monat
              </label>
              <input type="number" name="dayOfMonth" defaultValue="1" min={1} max={28} disabled={pending}
                className={`block w-full ${inputCls} px-3.5 py-2.5`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Erste Rechnung am <span className="text-red-500">*</span>
              </label>
              <input type="date" name="nextInvoiceDate" defaultValue={today} required disabled={pending}
                className={`block w-full ${inputCls} px-3.5 py-2.5`} />
            </div>
          </div>
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Notizen <span className="ml-1.5 text-xs font-normal text-zinc-400">(erscheinen auf der Rechnung)</span>
          </label>
          <textarea name="notes" rows={2} placeholder="z. B. Monatliches Coaching-Honorar" disabled={pending}
            className={`block w-full ${inputCls} px-3.5 py-2.5 resize-none`} />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {pending ? 'Wird gespeichert…' : 'Vorlage speichern'}
          </button>
          <a href="/invoices/recurring" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Abbrechen
          </a>
        </div>
      </form>
    </>
  )
}
