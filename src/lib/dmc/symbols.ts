// Simboluri garantat vizibile la 7-10px pe orice fundal.
// Ordine round-robin pe grupe vizuale — simbolurile consecutive sunt din familii complet diferite.
// 100 simboluri totale — suficient pentru orice schemă (maxColors ≤ 100).

const SHAPE_GROUPS: string[][] = [
  // G0: forme pline geometrice — maxim distinctive
  ['■', '●', '◆', '★', '▲', '▼', '◀', '▶'],
  // G1: litere mari colțurate
  ['H', 'Z', 'M', 'W', 'N', 'K', 'Y', 'T'],
  // G2: simboluri ASCII groase și clare
  ['+', '#', '&', '@', '!', '%', '$', '?'],
  // G3: cifre
  ['2', '3', '4', '7', '8', '9', '6'],
  // G4: forme goale
  ['○', '□', '△', '◇', '☆', '▽', '▷', '◁'],
  // G5: litere mari simple (excluse I O S care se confundă cu 1 0 5)
  ['V', 'L', 'E', 'F', 'A', 'B', 'D', 'G', 'J', 'P', 'Q', 'R', 'U'],
  // G6: simboluri Latin-1 (vizibile universal)
  ['=', '*', '×', '÷', '§', '¶'],
  // G7: litere mici distinctive (la 10px+ diferite de majuscule)
  ['a', 'b', 'd', 'e', 'f', 'g', 'h', 'k', 'n', 'p'],
  // G8: litere mici suplimentare
  ['q', 'r', 'u', 'v', 'w', 'x', 'y', 'z'],
  // G9: litere mari și cifre rămase
  ['C', 'X', '0', '1', '5', 'S'],
  // G10: litere Latin Extended (universale, distinctive)
  ['Æ', 'Ø', 'Ñ', 'Ç', 'Ü', 'Ä'],
  // G11: litere mici și speciale rămase
  ['c', 'j', 'm', 's', 't', '°', '±', '¿'],
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

export const SYMBOLS = buildSymbolList()

export function assignSymbols(count: number): string[] {
  // Dacă avem mai multe culori decât simboluri, re-ciclăm (fallback)
  return Array.from({ length: count }, (_, i) => SYMBOLS[i] ?? SYMBOLS[i % SYMBOLS.length] ?? '?')
}
