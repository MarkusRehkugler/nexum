'use client'

import { useActionState, useState } from 'react'
import { createInvoiceAction, type CreateInvoiceState } from '@/modules/invoices/actions'
import type { ClientRecord } from '@/modules/clients/types'
import type { ServiceItem, TenantProfile } from '@/modules/settings/types'
import { Plus, Trash2, BookOpen } from 'lucide-react'

const initialState: CreateInvoiceState = {}

interface LineItemRow {
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

interface Props {
  clients: ClientRecord[]
  serviceItems: ServiceItem[]
  tenantProfile: TenantProfile | null
  defaultClientId?: string
  defaultDescription?: string
}

function formatEUR(val: string) {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function initTaxMode(profile: TenantProfile | null): string {
  if (!profile) return 'none'
  if (profile.tax_mode === 'regelbesteuerung_19') return 'excluded'
  if (profile.tax_mode === 'heilpraktiker_mix') return 'per_item'
  return 'none'
}

function initTaxRate(profile: TenantProfile | null): string {
  return '19'
}

export function CreateInvoiceForm({
  clients,
  serviceItems,
  tenantProfile,
  defaultClientId,
  defaultDescription,
}: Props) {
  const [state, action, pending] = useActionState(createInvoiceAction, initialState)
  const [items, setItems] = useState<LineItemRow[]>([
    { description: defaultDescription ?? '', quantity: '1', unitPrice: '', taxRate: '0' },
  ])
  const [taxMode, setTaxMode] = useState(() => initTaxMode(tenantProfile))
  const [taxRate, setTaxRate] = useState(() => initTaxRate(tenantProfile))
  const [catalogOpenIdx, setCatalogOpenIdx] = useState<number | null>(null)

  function addItem() {
    setItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '', taxRate: '0' }])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
    if (catalogOpenIdx === idx) setCatalogOpenIdx(null)
  }

  function updateItem(idx: number, field: keyof LineItemRow, val: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function applyServiceItem(idx: number, si: ServiceItem) {
    setItems((prev) => prev.map((item, i) =>
      i === idx
        ? {
            ...item,
            description: si.name,
            unitPrice: si.unit_price.toFixed(2).replace('.', ','),
            taxRate: si.tax_rate.toString(),
          }
        : item
    ))
    setCatalogOpenIdx(null)
  }

  const isPerItem = taxMode === 'per_item'

  // Live-Summe
  const subtotal = items.reduce((s, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = formatEUR(item.unitPrice)
    return s + qty * price
  }, 0)

  const taxAmount = isPerItem
    ? items.reduce((s, item) => {
        const qty = parseFloat(item.quantity) || 0
        const price = formatEUR(item.unitPrice)
        const rate = parseFloat(item.taxRate) || 0
        return s + qty * price * (rate / 100)
      }, 0)
    : taxMode === 'none'
      ? 0
      : subtotal * (parseFloat(taxRate) / 100)

  const total = taxMode === 'excluded' || isPerItem ? subtotal + taxAmount : subtotal

  function fmtEUR(n: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
  }

  const paymentDays = tenantProfile?.payment_terms_days ?? 14
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + paymentDays)
  const defaultDueStr = defaultDue.toISOString().split('T')[0]

  const defaultNotes = tenantProfile?.invoice_notes ?? ''

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
          <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Klient <span className="text-red-500">*</span>
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={defaultClientId ?? ''}
            required
            disabled={pending}
            className={`block w-full ${inputCls} px-3.5 py-2.5`}
          >
            <option value="" disabled>Klient wählen …</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.personal_data?.name || c.display_label}
              </option>
            ))}
          </select>
          {state.errors?.clientId && (
            <p className="mt-1.5 text-xs text-red-600">{state.errors.clientId[0]}</p>
          )}
        </div>

        {/* Positionen */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">
              Positionen <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Position hinzufügen
            </button>
          </div>

          <div className="space-y-2">
            {/* Header */}
            <div className={`grid gap-2 text-xs font-medium text-zinc-400 px-1 ${isPerItem ? 'grid-cols-12' : 'grid-cols-12'}`}>
              <span className={isPerItem ? 'col-span-4' : 'col-span-6'}>Beschreibung</span>
              <span className="col-span-2">Menge</span>
              <span className={isPerItem ? 'col-span-2' : 'col-span-3'}>Preis (€)</span>
              {isPerItem && <span className="col-span-3">MwSt.</span>}
              <span className="col-span-1" />
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                {/* Beschreibung + Katalog-Picker */}
                <div className={`relative flex gap-1 ${isPerItem ? 'col-span-4' : 'col-span-6'}`}>
                  <input
                    type="text"
                    name="item_description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="z. B. Coaching-Sitzung 60 min"
                    required
                    disabled={pending}
                    className={`flex-1 min-w-0 ${inputCls}`}
                  />
                  {serviceItems.length > 0 && (
                    <div className="relative z-50">
                      <button
                        type="button"
                        onClick={() => setCatalogOpenIdx(catalogOpenIdx === idx ? null : idx)}
                        title="Aus Leistungskatalog wählen"
                        className="h-full px-2 rounded-lg border border-zinc-300 bg-white text-zinc-400 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                      </button>
                      {catalogOpenIdx === idx && (
                        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 z-50">
                          <p className="px-3 py-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                            Leistungskatalog
                          </p>
                          {serviceItems.map((si) => (
                            <button
                              key={si.id}
                              type="button"
                              onClick={() => applyServiceItem(idx, si)}
                              className="flex w-full flex-col px-3 py-2 text-left hover:bg-zinc-50"
                            >
                              <span className="text-sm font-medium text-zinc-900">{si.name}</span>
                              <span className="text-xs text-zinc-400">
                                {si.unit_price.toFixed(2).replace('.', ',')} € / {si.unit}
                                {si.tax_rate === 0 ? ' · steuerbefreit' : ` · ${si.tax_rate}% MwSt.`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  name="item_quantity"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  min={0.1}
                  step="any"
                  required
                  disabled={pending}
                  className={`col-span-2 ${inputCls}`}
                />
                <input
                  type="text"
                  name="item_unitPrice"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  placeholder="0,00"
                  required
                  disabled={pending}
                  className={`${isPerItem ? 'col-span-2' : 'col-span-3'} ${inputCls}`}
                />

                {/* Per-item Steuersatz */}
                {isPerItem && (
                  <>
                    <input type="hidden" name="item_taxRate" value={item.taxRate} />
                    <select
                      value={item.taxRate}
                      onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                      disabled={pending}
                      className={`col-span-3 ${inputCls} text-xs`}
                    >
                      <option value="0">0% – §4 Nr. 14</option>
                      <option value="19">19% MwSt.</option>
                    </select>
                  </>
                )}

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-1 flex items-center justify-center text-zinc-300 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Live-Summe */}
          <div className="mt-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Nettobetrag</span>
              <span className="font-medium">{fmtEUR(subtotal)}</span>
            </div>
            {taxMode !== 'none' && (
              <div className="flex justify-between text-zinc-500 text-xs mt-0.5">
                <span>{isPerItem ? 'Umsatzsteuer (je Position)' : `MwSt. ${taxRate}%`}</span>
                <span>{fmtEUR(taxAmount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1 font-semibold text-zinc-900">
              <span>Gesamt</span>
              <span>{fmtEUR(total)}</span>
            </div>
          </div>
        </div>

        {/* Umsatzsteuer */}
        <div className="grid grid-cols-2 gap-4">
          <div className={isPerItem ? 'col-span-2' : 'col-span-1'}>
            <label htmlFor="taxMode" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Umsatzsteuer
            </label>
            <select
              id="taxMode"
              name="taxMode"
              value={taxMode}
              onChange={(e) => setTaxMode(e.target.value)}
              disabled={pending}
              className={`block w-full ${inputCls} px-3.5 py-2.5`}
            >
              <option value="none">Keine – Kleinunternehmer §19 UStG</option>
              <option value="excluded">19% MwSt. zzgl.</option>
              <option value="included">MwSt. inklusive</option>
              <option value="per_item">Teilweise §4 Nr. 14 – je Position</option>
            </select>
            {isPerItem && (
              <p className="mt-1 text-xs text-zinc-400">
                Steuersatz wird je Position festgelegt. Aus dem Katalog wird der Satz automatisch übernommen.
              </p>
            )}
          </div>
          {!isPerItem && taxMode !== 'none' && (
            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                MwSt.-Satz (%)
              </label>
              <input
                id="taxRate"
                name="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min={0}
                max={100}
                disabled={pending}
                className={`block w-full ${inputCls} px-3.5 py-2.5`}
              />
            </div>
          )}
          <input type="hidden" name="taxRate" value={isPerItem || taxMode === 'none' ? '0' : taxRate} />
        </div>

        {/* Fälligkeitsdatum */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Fällig am
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultDueStr}
            disabled={pending}
            className={`block w-full ${inputCls} px-3.5 py-2.5`}
          />
        </div>

        {/* Notizen */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Notizen
            <span className="ml-1.5 text-xs font-normal text-zinc-400">(erscheinen auf der Rechnung)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={defaultNotes}
            placeholder="z. B. Zahlbar per Überweisung. Vielen Dank!"
            disabled={pending}
            className={`block w-full ${inputCls} px-3.5 py-2.5 resize-none`}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Wird erstellt…' : 'Rechnung erstellen'}
          </button>
          <a href="/invoices" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Abbrechen
          </a>
        </div>
      </form>
    </>
  )
}
