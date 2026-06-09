import { z } from 'zod'

export const lineItemSchema = z.object({
  description: z.string().min(1, { message: 'Beschreibung fehlt.' }).max(200),
  quantity: z.coerce.number().positive({ message: 'Menge muss > 0 sein.' }),
  unitPrice: z.coerce.number().min(0, { message: 'Preis darf nicht negativ sein.' }),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid({ message: 'Klient ist erforderlich.' }),
  lineItems: z.array(lineItemSchema).min(1, { message: 'Mindestens eine Position erforderlich.' }),
  taxMode: z.enum(['none', 'included', 'excluded']).default('none'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Versendet',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  canceled: 'Storniert',
}

export const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
  sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  canceled: 'bg-zinc-100 text-zinc-400 ring-zinc-400/20',
}
