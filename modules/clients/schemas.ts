import { z } from 'zod'

export const createClientSchema = z.object({
  salutation:              z.string().max(20).optional().or(z.literal('')),
  first_name:              z.string().max(50).optional().or(z.literal('')),
  last_name:               z.string().min(1, { message: 'Nachname ist erforderlich.' }).max(100),
  birth_date:              z.string().max(10).optional().or(z.literal('')),
  email:                   z.string().email({ message: 'Ungültige E-Mail-Adresse.' }).optional().or(z.literal('')),
  phone_mobile:            z.string().max(30).optional().or(z.literal('')),
  phone_landline:          z.string().max(30).optional().or(z.literal('')),
  emergency_contact_name:  z.string().max(100).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(30).optional().or(z.literal('')),
  notes:                   z.string().max(1000).optional().or(z.literal('')),
})

export type CreateClientFormData = z.infer<typeof createClientSchema>
