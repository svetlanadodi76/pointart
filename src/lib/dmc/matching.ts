import { createClient } from '@supabase/supabase-js'
import { rgbToLab, ciede2000 } from './colorSpace'

export interface DmcColor {
  id: number
  code: string
  name: string
  hex: string
  r: number
  g: number
  b: number
}

export interface DmcColorWithLab extends DmcColor {
  lab: [number, number, number]
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

export function addLabToColors(colors: DmcColor[]): DmcColorWithLab[] {
  return colors.map(c => ({ ...c, lab: rgbToLab(c.r, c.g, c.b) }))
}

// Căutare CIEDE2000 cu LAB precomputat — pentru bucle performante (dithering)
export function findNearestByLab(
  L: number, a: number, b: number,
  colors: DmcColorWithLab[],
): { color: DmcColorWithLab; idx: number } {
  let nearest = colors[0]
  let nearestIdx = 0
  let minDist = Infinity

  for (let i = 0; i < colors.length; i++) {
    const [cL, ca, cb] = colors[i].lab
    const dist = ciede2000(L, a, b, cL, ca, cb)
    if (dist < minDist) {
      minDist = dist
      nearest = colors[i]
      nearestIdx = i
    }
  }

  return { color: nearest, idx: nearestIdx }
}

// Căutare standard — pentru operații rare (matching inițial, alternative)
export function findNearestDmc(r: number, g: number, b: number, dmcColors: DmcColor[]): DmcColor {
  const [L, a, bLab] = rgbToLab(r, g, b)
  let nearest = dmcColors[0]
  let minDist = Infinity

  for (const color of dmcColors) {
    const [cL, ca, cb] = rgbToLab(color.r, color.g, color.b)
    const dist = ciede2000(L, a, bLab, cL, ca, cb)
    if (dist < minDist) {
      minDist = dist
      nearest = color
    }
  }

  return nearest
}
