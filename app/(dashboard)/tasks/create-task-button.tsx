'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTaskForm } from './create-task-form'

interface Client {
  id: string
  display_label: string
  personal_data: { name?: string } | null
}

interface Props {
  clients: Client[]
}

export function CreateTaskButton({ clients }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neue Aufgabe
        </button>
      )}
      {open && <CreateTaskForm clients={clients} onClose={() => setOpen(false)} />}
    </div>
  )
}
