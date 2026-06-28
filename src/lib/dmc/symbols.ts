// Doar simboluri universal suportate de fonturi comune (ASCII + Latin-1 + forme geometrice de bază).
// Caracterele Unicode complexe (⊕ ∩ ⋆ ∞ etc.) nu sunt randate de multe fonturi și apar invizibile.
//
// Ordinea: round-robin pe grupe vizuale — simbolurile consecutive sunt din familii complet diferite.
// Dacă schema are 5 culori similare (ex: 5 nuanțe de maro), primesc: ■ H + 2 ○ — imposibil de confundat.

const SHAPE_GROUPS: string[][] = [
  // G0: forme pline geometrice — cele mai vizibile și distincte
  ['■', '●', '◆', '★', '▲', '▼', '◀', '▶'],
  // G1: litere mari cu unghiuri foarte distinctive
  ['H', 'Z', 'M', 'W', 'N', 'K', 'Y', 'T'],
  // G2: simboluri ASCII speciale (100% suportate)
  ['+', '#', '&', '@', '!', '%', '~', '^'],
  // G3: cifre (100% suportate, distincte de litere)
  ['2', '3', '4', '7', '8', '9', '6'],
  // G4: forme goale/contururi
  ['○', '□', '△', '◇', '☆', '▽', '▷', '◁'],
  // G5: litere mai simple (ASCII)
  ['V', 'L', 'E', 'F', 'A', 'B', 'D', 'G', 'J', 'P', 'Q', 'R', 'U'],
  // G6: simboluri Latin-1 și ASCII sigure
  ['=', '*', '$', '?', '×', '÷', '§', '¶'],
  // G7: simboluri ASCII suplimentare
  ['/', '|', '<', '>', '(', ')', '[', ']'],
]

function buildSymbolList(): string[] {
  const result: string[] = []
  const maxLen = Math.max(...SHAPE_GROUPS.map(g => g.length))
  for (let i = 0; i < maxLen; i++) {
    for (const group of SHAPE_GROUPS) {
      if (i < group.length) result.push(group[i])
    }
  }
  return result
}

// Ordine rezultată (primele 24):
// ■ H + 2 ○ V = / | ● Z # 3 □ L * ? / ◆ M & 4 △ E $ ? ...
// Fiecare bloc de 8 simboluri consecutive = 8 familii vizuale complet diferite
export const SYMBOLS = buildSymbolList()

export function assignSymbols(count: number): string[] {
  return SYMBOLS.slice(0, count)
}
