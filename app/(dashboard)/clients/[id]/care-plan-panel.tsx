'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, Check, X, Target, BookOpen, ListChecks, AlertTriangle } from 'lucide-react'
import { saveCarePlanAction } from '@/modules/care-plans/actions'
import type { CarePlan, GoalItem, MilestoneItem } from '@/modules/care-plans/types'

interface Props {
  clientId: string
  caseId: string | null
  initialPlan: CarePlan | null
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function CarePlanPanel({ clientId, caseId, initialPlan }: Props) {
  const [plan, setPlan] = useState<CarePlan | null>(initialPlan)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [goals, setGoals] = useState<GoalItem[]>([])
  const [methods, setMethods] = useState('')
  const [milestones, setMilestones] = useState<MilestoneItem[]>([])
  const [risks, setRisks] = useState('')
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setGoals(plan?.goals ?? [])
    setMethods(plan?.methods ?? '')
    setMilestones(plan?.milestones ?? [])
    setRisks(plan?.risks ?? '')
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  function save() {
    startTransition(async () => {
      const result = await saveCarePlanAction(clientId, caseId, { goals, methods, milestones, risks })
      if (result.error) {
        setError(result.error)
        return
      }
      setPlan({
        id: plan?.id ?? '',
        case_id: caseId ?? '',
        goals,
        methods: methods || null,
        milestones,
        risks: risks || null,
        signed_at: plan?.signed_at ?? null,
      })
      setEditing(false)
    })
  }

  const isEmpty = !plan || (
    plan.goals.length === 0 && !plan.methods && plan.milestones.length === 0 && !plan.risks
  )

  if (!editing) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700">Begleitplan</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Ziele, Methoden, Meilensteine</p>
          </div>
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            {isEmpty ? 'Anlegen' : 'Bearbeiten'}
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <p className="text-sm text-zinc-400">Noch kein Begleitplan angelegt.</p>
            <button onClick={startEdit} className="text-xs text-zinc-500 underline hover:text-zinc-800 transition-colors">
              Jetzt anlegen
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {plan.goals.length > 0 && (
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">
                  <Target className="h-3.5 w-3.5" />
                  Ziele
                </p>
                <ul className="space-y-2">
                  {plan.goals.map(g => (
                    <li key={g.id} className="flex items-center gap-2.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${g.status === 'achieved' ? 'bg-green-500' : 'bg-violet-400'}`} />
                      <span className={`text-sm flex-1 ${g.status === 'achieved' ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                        {g.text}
                      </span>
                      {g.status === 'achieved' && (
                        <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                          Erreicht
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.methods && (
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  Methoden & Vorgehen
                </p>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{plan.methods}</p>
              </div>
            )}

            {plan.milestones.length > 0 && (
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">
                  <ListChecks className="h-3.5 w-3.5" />
                  Meilensteine
                </p>
                <ul className="space-y-2">
                  {plan.milestones.map(m => (
                    <li key={m.id} className="flex items-center gap-2.5">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-white text-[9px] font-bold ${m.done ? 'bg-green-500 border-green-500' : 'border-zinc-300'}`}>
                        {m.done ? '✓' : ''}
                      </span>
                      <span className={`text-sm ${m.done ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                        {m.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.risks && (
              <div className="px-5 py-4">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Risiken & Kontraindikationen
                </p>
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{plan.risks}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Bearbeiten-Modus
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-700">Begleitplan bearbeiten</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={cancelEdit}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Abbrechen
          </button>
          <button
            onClick={save}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {isPending ? 'Speichert …' : 'Speichern'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="divide-y divide-zinc-100">
        {/* Ziele */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            <Target className="h-3.5 w-3.5" />
            Ziele
          </p>
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={g.id} className="flex items-center gap-2">
                <button
                  type="button"
                  title={g.status === 'achieved' ? 'Als aktiv markieren' : 'Als erreicht markieren'}
                  onClick={() => setGoals(goals.map((x, j) => j === i ? { ...x, status: x.status === 'achieved' ? 'active' : 'achieved' } : x))}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold text-white transition-colors ${g.status === 'achieved' ? 'bg-green-500 border-green-500' : 'border-zinc-300 hover:border-green-400'}`}
                >
                  {g.status === 'achieved' ? '✓' : ''}
                </button>
                <input
                  type="text"
                  value={g.text}
                  onChange={e => setGoals(goals.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                  placeholder="Ziel beschreiben …"
                  className={`flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-zinc-400 focus:outline-none ${g.status === 'achieved' ? 'text-zinc-400' : 'text-zinc-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                  className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setGoals([...goals, { id: uid(), text: '', status: 'active' }])}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Ziel hinzufügen
            </button>
          </div>
        </div>

        {/* Methoden */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Methoden & Vorgehen
          </p>
          <textarea
            value={methods}
            onChange={e => setMethods(e.target.value)}
            rows={3}
            placeholder="z. B. EMDR, kognitive Verhaltenstherapie, systemische Arbeit …"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none resize-none"
          />
        </div>

        {/* Meilensteine */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            <ListChecks className="h-3.5 w-3.5" />
            Meilensteine
          </p>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMilestones(milestones.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[9px] font-bold text-white transition-colors ${m.done ? 'bg-green-500 border-green-500' : 'border-zinc-300 hover:border-green-400'}`}
                >
                  {m.done ? '✓' : ''}
                </button>
                <input
                  type="text"
                  value={m.text}
                  onChange={e => setMilestones(milestones.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                  placeholder="Meilenstein …"
                  className={`flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-zinc-400 focus:outline-none ${m.done ? 'text-zinc-400' : 'text-zinc-700'}`}
                />
                <button
                  type="button"
                  onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                  className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMilestones([...milestones, { id: uid(), text: '', done: false }])}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Meilenstein hinzufügen
            </button>
          </div>
        </div>

        {/* Risiken */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risiken & Kontraindikationen
          </p>
          <textarea
            value={risks}
            onChange={e => setRisks(e.target.value)}
            rows={2}
            placeholder="Kontraindikationen, Vorsichtsmaßnahmen …"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}
