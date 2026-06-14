import { createClient } from '@supabase/supabase-js'

export interface DmcColor {
  id: number
  code: string
  name: string
  hex: string
  r: number
  g: number
  b: number
}

let dmcCache: DmcColor[] | null = null

export async function loadDmcColors(): Promise<DmcColor[]> {
  if (dmcCache) return dmcCache

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.from('dmc_colors').select('*').order('code')
  if (error || !data) throw new Error('Nu s-au putut încărca culorile DMC')

  dmcCache = data
  return dmcCache
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  // Distanță perceptuală ponderată (mai aproape de cum vede ochiul uman)
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db)
}

export function findNearestDmc(r: number, g: number, b: number, dmcColors: DmcColor[]): DmcColor {
  let nearest = dmcColors[0]
  let minDist = Infinity

  for (const color of dmcColors) {
    const dist = colorDistance(r, g, b, color.r, color.g, color.b)
    if (dist < minDist) {
      minDist = dist
      nearest = color
    }
  }

  return nearest
}
