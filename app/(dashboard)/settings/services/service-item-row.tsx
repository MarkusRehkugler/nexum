'use client'

import Link from 'next/link'
import { Star, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ServiceItem } from '@/modules/settings/types'
import { deleteServiceItemAction } from '@/modules/settings/actions'
import { formatCurrency } from '@/lib/utils'

export function ServiceItemRow({ item }: { item: ServiceItem }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`"${item.name}" wirklich löschen?`)) return
    await deleteServiceItemAction(item.id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 truncate">{item.name}</span>
          {item.is_default && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        {item.description && (
          <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-zinc-900">{formatCurrency(item.unit_price)}</p>
        <p className="text-xs text-zinc-400">
          {item.unit} · {item.tax_rate === 0 ? 'keine MwSt' : `${item.tax_rate}% MwSt`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/settings/services/${item.id}`}
          className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
          <Pencil className="h-4 w-4" />
        </Link>
        <button onClick={handleDelete}
          className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
