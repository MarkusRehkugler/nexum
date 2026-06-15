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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht authentifiziert.' }

  const { data: prof } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!prof?.tenant_id) return { error: 'Kein Mandant gefunden.' }

  let activeCaseId = caseId

  if (!activeCaseId) {
    const { data: cases } = await supabase
      .from('cases')
      .select('id')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(1)

    if (cases && cases.length > 0) {
      activeCaseId = cases[0].id
    } else {
      // Kein Fall vorhanden — automatisch anlegen
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          tenant_id:       prof.tenant_id,
          client_id:       clientId,
          owner_user_id:   user.id,
          profession_type: 'coaching',
          status:          'active',
        })
        .select('id')
        .single()

      if (caseError || !newCase) return { error: 'Fall konnte nicht angelegt werden.' }
      activeCaseId = newCase.id
    }
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
    const { error } = await supabase
      .from('care_plans')
      .insert({
        case_id:   activeCaseId,
        tenant_id: prof.tenant_id,
        goals:     data.goals,
        methods:   data.methods || null,
        milestones: data.milestones,
        risks:     data.risks || null,
      })

    if (error) return { error: 'Begleitplan konnte nicht angelegt werden.' }
  }

  revalidatePath(`/clients/${clientId}`)
  return {}
}
