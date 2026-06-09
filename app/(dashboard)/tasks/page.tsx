import Link from 'next/link'
import { ListChecks } from 'lucide-react'
import { getTasksByStatus } from '@/modules/tasks/queries'
import { TaskList } from './task-list'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TasksPage({ searchParams }: Props) {
  const { status } = await searchParams
  const activeTab = (status === 'completed' || status === 'all') ? status : 'open'

  const tasks = await getTasksByStatus(activeTab as 'open' | 'completed' | 'all')

  const tabs = [
    { key: 'open',      label: 'Offen' },
    { key: 'completed', label: 'Erledigt' },
    { key: 'all',       label: 'Alle' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Aufgaben</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Aufgaben aus KI-Sitzungsprotokollen und manuell erstellte Klient-Aufgaben
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === 'open' ? '/tasks' : `/tasks?status=${tab.key}`}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-16 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-zinc-300" />
          <h3 className="mt-4 text-sm font-medium text-zinc-900">
            {activeTab === 'open' ? 'Keine offenen Aufgaben' : 'Keine Aufgaben'}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Aufgaben werden aus dem KI-Sitzungsprotokoll übernommen.
          </p>
        </div>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  )
}
