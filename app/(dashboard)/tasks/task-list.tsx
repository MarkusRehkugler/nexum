'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, RotateCcw, User, Calendar } from 'lucide-react'
import { updateTaskStatusAction } from '@/modules/tasks/actions'
import type { ClientTask } from '@/modules/tasks/types'

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-50 text-red-700 ring-red-200',
  medium: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  low:    'bg-zinc-50 text-zinc-500 ring-zinc-200',
}

const PRIORITY_LABEL: Record<string, string> = {
  high:   'Hoch',
  medium: 'Mittel',
  low:    'Niedrig',
}

interface Props {
  tasks: ClientTask[]
}

export function TaskList({ tasks }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(task: ClientTask) {
    setToggling(task.id)
    const newStatus = task.status === 'completed' ? 'open' : 'completed'
    await updateTaskStatusAction(task.id, newStatus)
    router.refresh()
    setToggling(null)
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const isDone = task.status === 'completed'
        const clientName =
          task.client?.personal_data?.name ?? task.client?.display_label
        const sessionDate = task.session?.session_date
          ? new Date(task.session.session_date).toLocaleDateString('de-DE', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : null

        return (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-opacity ${
              isDone ? 'opacity-60' : ''
            }`}
          >
            {/* Toggle-Button */}
            <button
              onClick={() => handleToggle(task)}
              disabled={toggling === task.id}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isDone
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-zinc-300 bg-white text-transparent hover:border-violet-400'
              }`}
              title={isDone ? 'Als offen markieren' : 'Als erledigt markieren'}
            >
              {isDone
                ? <Check className="h-3 w-3" />
                : toggling === task.id
                ? <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-300" />
                : null
              }
            </button>

            {/* Inhalt */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm text-zinc-900 leading-relaxed ${isDone ? 'line-through text-zinc-400' : ''}`}>
                {task.content}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Priorität */}
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium}`}>
                  {PRIORITY_LABEL[task.priority] ?? task.priority}
                </span>

                {/* Status */}
                {isDone && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-200">
                    Erledigt
                  </span>
                )}

                {/* Klient */}
                {clientName && (
                  <Link
                    href={`/clients/${task.client_id}`}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
                  >
                    <User className="h-3 w-3" />
                    {clientName}
                  </Link>
                )}

                {/* Sitzungsdatum */}
                {sessionDate && (
                  <Link
                    href={`/sessions/${task.session_id}`}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
                  >
                    <Calendar className="h-3 w-3" />
                    {sessionDate}
                  </Link>
                )}
              </div>
            </div>

            {/* Wiederherstellen-Icon bei erledigten Tasks */}
            {isDone && (
              <button
                onClick={() => handleToggle(task)}
                className="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors"
                title="Wieder öffnen"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
