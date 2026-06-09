import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string({ message: 'Name ist erforderlich.' }).min(2, { message: 'Name muss mindestens 2 Zeichen haben.' }).max(100),
  email: z.string().email({ message: 'Ungültige E-Mail-Adresse.' }).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type CreateClientFormData = z.infer<typeof createClientSchema>
