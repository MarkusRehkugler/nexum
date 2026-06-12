'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { completeSessionAction } from '@/modules/sessions/actions'

interface Props {
  sessionId: string
}

export function CompleteSessionButton({ sessionId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await completeSessionAction(sessionId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {isPending
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <CheckCircle2 className="h-4 w-4" />}
      Sitzung abschließen
    </button>
  )
}
