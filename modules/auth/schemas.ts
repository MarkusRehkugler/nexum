import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Gültige E-Mail-Adresse erforderlich').trim(),
  password: z.string().min(1, 'Passwort erforderlich'),
})

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').trim(),
  practiceName: z
    .string()
    .min(2, 'Praxisname muss mindestens 2 Zeichen lang sein')
    .trim(),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich').trim(),
  password: z
    .string()
    .min(8, 'Mindestens 8 Zeichen')
    .regex(/[a-zA-Z]/, 'Muss mindestens einen Buchstaben enthalten')
    .regex(/[0-9]/, 'Muss mindestens eine Zahl enthalten'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['passwordConfirm'],
})

export const ResetPasswordSchema = z.object({
  email: z.string().email('Gültige E-Mail-Adresse erforderlich').trim(),
})

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mindestens 8 Zeichen')
    .regex(/[a-zA-Z]/, 'Muss mindestens einen Buchstaben enthalten')
    .regex(/[0-9]/, 'Muss mindestens eine Zahl enthalten'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['passwordConfirm'],
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
