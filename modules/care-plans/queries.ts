import { createClient } from '@/lib/supabase/server'
import type { CarePlan, GoalItem, MilestoneItem } from './types'

export async function getCarePlanForClient(clientId: string): Promise<{
  carePlan: CarePlan | null
  caseId: string | null
}> {
  const supabase = await createClient()

  const { data: cases } = await supabase
    .from('cases')
    .select('id')
    .eq('client_id', clientId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)

  if (!cases || cases.length === 0) return { carePlan: null, caseId: null }

  const caseId = cases[0].id

  const { data: plan } = await supabase
    .from('care_plans')
    .select('*')
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!plan) return { carePlan: null, caseId }

  return {
    carePlan: {
      id: plan.id,
      case_id: plan.case_id,
      goals: (plan.goals as GoalItem[]) ?? [],
      methods: plan.methods ?? null,
      milestones: (plan.milestones as MilestoneItem[]) ?? [],
      risks: plan.risks ?? null,
      signed_at: plan.signed_at ?? null,
    },
    caseId,
  }
}
