// NUMAI caractere ASCII + Latin-1 — nicio formă geometrică Unicode (■ ● ◆ etc.)
// pe macOS aceste caractere pot fi randate ca emoji și CSS color nu le afectează.
//
// Ordine round-robin pe grupe vizuale: simbolurile consecutive sunt complet diferite.

const SHAPE_GROUPS: string[][] = [
  // G0: litere mari cu forme distinctive (colțuri, diagonale)
  ['H', 'Z', 'M', 'W', 'N', 'K', 'Y', 'T'],
  // G1: cifre clare
  ['2', '3', '4', '7', '8', '9', '6'],
  // G2: litere mari simple (fără I O S care se confundă cu 1 0 5)
  ['A', 'B', 'D', 'E', 'F', 'G', 'J', 'L', 'P', 'Q', 'R', 'U', 'V'],
  // G3: simboluri ASCII groase și distincte
  ['+', '#', '&', '@', '!', '%', '$', '?', '=', '*'],
  // G4: litere mici distinctive (vizibile la 9px+)
  ['a', 'b', 'd', 'e', 'f', 'g', 'h', 'k', 'n', 'p'],
  // G5: litere mici suplimentare
  ['q', 'r', 'u', 'v', 'w', 'x', 'y', 'z'],
  // G6: litere mari și cifre rămase
  ['C', 'X', 'S', '0', '1', '5'],
  // G7: caractere Latin-1 (universale, distincte de litere ASCII)
  ['Æ', 'Ø', 'Ñ', 'Ç', 'Ü', 'Ä', '§', '¶'],
]

function buildSymbolList(): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  const maxLen = Math.max(...SHAPE_GROUPS.map(g => g.length))
  for (let i = 0; i < maxLen; i++) {
    for (const group of SHAPE_GROUPS) {
      if (i < group.length && !seen.has(group[i])) {
        result.push(group[i])
        seen.add(group[i])
      }
    }
  }
  return result
}

// ~72 simboluri garantat ASCII/Latin-1, vizibile la orice dimensiune pe orice font
export const SYMBOLS = buildSymbolList()

export function assignSymbols(count: number): string[] {
  const n = SYMBOLS.length
  return Array.from({ length: count }, (_, i) => SYMBOLS[i % n])
}
