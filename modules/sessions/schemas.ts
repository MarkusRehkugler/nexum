import { z } from 'zod'

export const createSessionSchema = z.object({
  clientId: z.string({ message: 'Klient ist erforderlich.' }).uuid({ message: 'Ungültiger Klient.' }),
  type: z.enum(['individual', 'group', 'online', 'phone', 'other'], {
    message: 'Ungültiger Sitzungstyp.',
  }),
  sessionDate: z.string({ message: 'Datum ist erforderlich.' }).min(1, { message: 'Datum ist erforderlich.' }),
  durationMinutes: z.coerce
    .number({ message: 'Dauer muss eine Zahl sein.' })
    .int()
    .min(1)
    .max(600)
    .optional()
    .or(z.literal(NaN).transform(() => undefined)),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export type CreateSessionFormData = z.infer<typeof createSessionSchema>

export const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: 'Einzelsitzung',
  group: 'Gruppensitzung',
  online: 'Online-Sitzung',
  phone: 'Telefon-Sitzung',
  other: 'Sonstige',
}
