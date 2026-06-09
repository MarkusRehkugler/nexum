import { z } from 'zod'

export const createCalendarEntrySchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(255),
  clientId: z.string().uuid('Ungültiger Klient').optional().nullable(),
  type: z.enum(['session', 'block', 'event', 'reminder']).default('session'),
  date: z.string().min(1, 'Datum ist erforderlich'),      // YYYY-MM-DD
  startTime: z.string().min(1, 'Uhrzeit ist erforderlich'), // HH:MM
  durationMinutes: z.coerce.number().int().min(15, 'Mind. 15 Minuten').max(480).default(60),
  description: z.string().max(2000).optional().nullable(),
})

export type CreateCalendarEntryInput = z.infer<typeof createCalendarEntrySchema>

export const TYPE_LABELS: Record<string, string> = {
  session:  'Sitzung',
  block:    'Geblockt',
  event:    'Termin',
  reminder: 'Erinnerung',
}

export const TYPE_COLORS: Record<string, string> = {
  session:  'bg-violet-100 text-violet-800 ring-violet-200',
  block:    'bg-zinc-100 text-zinc-600 ring-zinc-200',
  event:    'bg-blue-100 text-blue-800 ring-blue-200',
  reminder: 'bg-amber-100 text-amber-800 ring-amber-200',
}
