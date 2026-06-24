export type PlanType = 'free_trial' | 'starter' | 'pro'

export type CraftType = 'cross_stitch' | 'goblene' | 'diamond'

export type CanvasType = '11CT' | '14CT' | '16CT' | '18CT' | '2.5mm' | '2.8mm' | '3.0mm'

export interface DmcColor {
  id: number
  code: string
  name: string
  hex: string
  r: number
  g: number
  b: number
}

export interface SchemaSettings {
  craftType: CraftType
  canvasType: CanvasType
  width: number
  height: number
  maxColors: number
  threadStrands: number
}

export interface ColorUsage {
  dmcColor: DmcColor
  symbol: string
  count: number
  skeins: number
  unit: 'skeins' | 'packets' // skeins = ață, packets = diamante
}

export interface GeneratedSchema {
  grid: number[][]
  colors: ColorUsage[]
  widthStitches: number
  heightStitches: number
  widthCm: number
  heightCm: number
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanType
  status: 'active' | 'expired' | 'cancelled'
  schemas_remaining: number | null
  trial_ends_at: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
}
