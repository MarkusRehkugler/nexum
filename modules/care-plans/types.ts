export type GoalStatus = 'active' | 'achieved'

export interface GoalItem {
  id: string
  text: string
  status: GoalStatus
}

export interface MilestoneItem {
  id: string
  text: string
  done: boolean
}

export interface CarePlan {
  id: string
  case_id: string
  goals: GoalItem[]
  methods: string | null
  milestones: MilestoneItem[]
  risks: string | null
  signed_at: string | null
}
