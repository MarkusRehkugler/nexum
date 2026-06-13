'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GoalItem, MilestoneItem } from './types'

interface SaveData {
  goals: GoalItem[]
  methods: string
  milestones: MilestoneItem[]
  risks: string
}

export async function saveCarePlanAction(
  clientId: string,
  caseId: string | null,
  data: SaveData
): Promise<{ error?: string }> {
  const supabase = await createClient()

  let activeCaseId = caseId

  if (!activeCaseId) {
    const { data: cases } = await supabase
      .from('cases')
      .select('id')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)

    if (!cases || cases.length === 0) {
      return { error: 'Kein Fall für diesen Klienten gefunden. Bitte erst eine Sitzung anlegen.' }
    }
    activeCaseId = cases[0].id
  }

  const { data: existing } = await supabase
    .from('care_plans')
    .select('id')
    .eq('case_id', activeCaseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('care_plans')
      .update({
        goals: data.goals,
        methods: data.methods || null,
        milestones: data.milestones,
        risks: data.risks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return { error: 'Begleitplan konnte nicht gespeichert werden.' }
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    const { error } = await supabase
      .from('care_plans')
      .insert({
        case_id: activeCaseId,
        tenant_id: prof!.tenant_id,
        goals: data.goals,
        methods: data.methods || null,
        milestones: data.milestones,
        risks: data.risks || null,
      })

    if (error) return { error: 'Begleitplan konnte nicht angelegt werden.' }
  }

  revalidatePath(`/clients/${clientId}`)
  return {}
}
