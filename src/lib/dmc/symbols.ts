// Doar simboluri GARANTAT VIZIBILE la 7-10px pe orice fundal colorat.
// Exclus: ^ ~ | / < > ( ) [ ] și orice caracter subtil la dimensiuni mici.
//
// Ordine round-robin pe grupe vizuale: simbolurile consecutive sunt din familii complet diferite.
// Culorile similare (ex: 5 nuanțe maro) primesc: ■ H + 2 ○ V = * — imposibil de confundat.

const SHAPE_GROUPS: string[][] = [
  // G0: forme pline geometrice — maxim vizibile și distinctive
  ['■', '●', '◆', '★', '▲', '▼', '◀', '▶'],
  // G1: litere mari cu unghiuri distinctive
  ['H', 'Z', 'M', 'W', 'N', 'K', 'Y', 'T'],
  // G2: simboluri ASCII clare și groase (fără / | ^ ~ < > care sunt invizibile la 7px)
  ['+', '#', '&', '@', '!', '%', '$', '?'],
  // G3: cifre (clare la orice dimensiune)
  ['2', '3', '4', '7', '8', '9', '6'],
  // G4: forme goale — contururi clare
  ['○', '□', '△', '◇', '☆', '▽', '▷', '◁'],
  // G5: litere simple (fără I/O/S care se confundă cu 1/0/5)
  ['V', 'L', 'E', 'F', 'A', 'B', 'D', 'G', 'J', 'P', 'Q', 'R', 'U'],
  // G6: simboluri Latin-1 vizibile (universale, în orice font)
  ['=', '*', '×', '÷', '§', '¶'],
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

// 58 simboluri total — toți garantat vizibili la 7px+ pe fundal colorat
// Ordinea: ■ H + 2 ○ V = | ● Z # 3 □ L * | ◆ M & 4 △ E × | ...
export const SYMBOLS = buildSymbolList()

export function assignSymbols(count: number): string[] {
  return SYMBOLS.slice(0, count)
}
