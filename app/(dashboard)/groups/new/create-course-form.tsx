'use client'

import { useState, useActionState } from 'react'
import { Loader2, Calendar, CalendarDays, RefreshCw } from 'lucide-react'
import { createCourseAction, type CreateCourseState } from '@/modules/courses/actions'

type ScheduleType = 'single' | 'multi_day' | 'recurring'

const initialState: CreateCourseState = {}

const inputCls = 'block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50'

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export function CreateCourseForm() {
  const [state, action, pending] = useActionState(createCourseAction, initialState)
  const [scheduleType, setScheduleType] = useState<ScheduleType>('single')
  const [firstDate, setFirstDate] = useState('')

  const detectedWeekday = firstDate
    ? WEEKDAYS[new Date(firstDate + 'T12:00:00').getDay()]
    : null

  return (
    <form action={action} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {state.errors?.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.errors.general[0]}
        </div>
      )}

      <input type="hidden" name="scheduleType" value={scheduleType} />

      {/* ── Grunddaten ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="border-b border-zinc-100 pb-2 text-sm font-semibold text-zinc-700">Grunddaten</h2>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-zinc-700 mb-1.5">Typ</label>
          <select id="type" name="type" defaultValue="course" disabled={pending} className={inputCls}>
            <option value="course">Kurs</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
            <option value="group">Gruppe</option>
          </select>
          {state.errors?.type && <p className="mt-1.5 text-xs text-red-600">{state.errors.type[0]}</p>}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Titel <span className="text-red-500">*</span>
          </label>
          <input
            id="title" name="title" type="text" required disabled={pending}
            placeholder="z. B. Achtsamkeitskurs, Yoga-Seminar, Coaching-Gruppe"
            className={inputCls}
          />
          {state.errors?.title && <p className="mt-1.5 text-xs text-red-600">{state.errors.title[0]}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Beschreibung
            <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
          </label>
          <textarea
            id="description" name="description" rows={3} disabled={pending}
            placeholder="Inhalte, Zielgruppe, Voraussetzungen …"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Ort
              <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="location" name="location" type="text" disabled={pending}
              placeholder="z. B. Raum A, Online …"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Max. Teilnehmer
              <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="maxParticipants" name="maxParticipants" type="number"
              min={1} max={9999} placeholder="z. B. 12"
              disabled={pending} className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-zinc-700 mb-1.5">
              Preis €
              <span className="ml-1.5 text-xs font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="price" name="price" type="number"
              min={0} step="0.01" placeholder="0,00"
              disabled={pending} className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Terminstruktur ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="border-b border-zinc-100 pb-2 text-sm font-semibold text-zinc-700">Terminstruktur</h2>

        {/* Picker */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'single',    label: 'Einmalig',      Icon: Calendar,     sub: 'Ein einzelner Termin' },
            { value: 'multi_day', label: 'Mehrtägig',     Icon: CalendarDays, sub: 'z. B. Fr–So-Seminar' },
            { value: 'recurring', label: 'Wiederkehrend', Icon: RefreshCw,    sub: 'z. B. jeden Montag' },
          ] as const).map(({ value, label, Icon, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setScheduleType(value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                scheduleType === value
                  ? 'border-violet-400 bg-violet-50 text-violet-900'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${scheduleType === value ? 'text-violet-600' : 'text-zinc-400'}`} />
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-[10px] leading-tight text-zinc-400">{sub}</span>
            </button>
          ))}
        </div>

        {/* Einmalig */}
        {scheduleType === 'single' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Datum <span className="text-red-500">*</span>
              </label>
              <input id="date" name="date" type="date" required disabled={pending} className={inputCls} />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Von <span className="text-red-500">*</span>
              </label>
              <input id="startTime" name="startTime" type="time" defaultValue="09:00" required disabled={pending} className={inputCls} />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Bis <span className="text-red-500">*</span>
              </label>
              <input id="endTime" name="endTime" type="time" defaultValue="17:00" required disabled={pending} className={inputCls} />
            </div>
            {state.errors?.date && <p className="col-span-3 text-xs text-red-600">{state.errors.date[0]}</p>}
          </div>
        )}

        {/* Mehrtägig */}
        {scheduleType === 'multi_day' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Erster Tag <span className="text-red-500">*</span>
                </label>
                <input id="startDate" name="startDate" type="date" required disabled={pending} className={inputCls} />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Letzter Tag <span className="text-red-500">*</span>
                </label>
                <input id="endDate" name="endDate" type="date" required disabled={pending} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dailyStartTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Tägliche Startzeit <span className="text-red-500">*</span>
                </label>
                <input id="dailyStartTime" name="dailyStartTime" type="time" defaultValue="09:00" required disabled={pending} className={inputCls} />
              </div>
              <div>
                <label htmlFor="dailyEndTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Tägliche Endzeit <span className="text-red-500">*</span>
                </label>
                <input id="dailyEndTime" name="dailyEndTime" type="time" defaultValue="17:00" required disabled={pending} className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-zinc-400">Für jeden Tag wird automatisch ein Termin angelegt.</p>
            {state.errors?.date && <p className="text-xs text-red-600">{state.errors.date[0]}</p>}
          </div>
        )}

        {/* Wiederkehrend */}
        {scheduleType === 'recurring' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Erster Termin <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstDate" name="firstDate" type="date" required disabled={pending}
                  value={firstDate}
                  onChange={e => setFirstDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="lastDate" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Letzter Termin <span className="text-red-500">*</span>
                </label>
                <input id="lastDate" name="lastDate" type="date" required disabled={pending} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recurStartTime" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Uhrzeit <span className="text-red-500">*</span>
                </label>
                <input id="recurStartTime" name="recurStartTime" type="time" defaultValue="19:00" required disabled={pending} className={inputCls} />
              </div>
              <div>
                <label htmlFor="durationMinutes" className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Dauer
                </label>
                <select id="durationMinutes" name="durationMinutes" defaultValue="60" disabled={pending} className={inputCls}>
                  <option value="30">30 Min</option>
                  <option value="45">45 Min</option>
                  <option value="60">60 Min (1 Std)</option>
                  <option value="90">90 Min</option>
                  <option value="120">120 Min (2 Std)</option>
                </select>
              </div>
            </div>
            {detectedWeekday && (
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700">
                Die Termine werden wöchentlich jeden <strong>{detectedWeekday}</strong> angelegt.
              </div>
            )}
            <p className="text-xs text-zinc-400">
              Der Wochentag wird automatisch aus dem ersten Termin ermittelt.
            </p>
            {state.errors?.date && <p className="text-xs text-red-600">{state.errors.date[0]}</p>}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
        <button
          type="submit" disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Wird gespeichert…</>
            : 'Veranstaltung anlegen'}
        </button>
        <a href="/groups" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          Abbrechen
        </a>
      </div>
    </form>
  )
}
