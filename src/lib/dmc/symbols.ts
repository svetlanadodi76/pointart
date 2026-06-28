// Grupe de simboluri vizual similare între ele.
// Prin round-robin pe grupe, simbolurile consecutive în SYMBOLS sunt maxim diferite vizual.
// Astfel culorile cu indici apropiați (similar cromatice) primesc simboluri greu de confundat.
const SHAPE_GROUPS: string[][] = [
  // G0: forme pline compacte — cele mai vizibile
  ['■', '●', '◆', '★', '▲', '▼', '◀', '▶'],
  // G1: litere cu unghiuri foarte distinctive
  ['H', 'Z', 'M', 'W', 'N', 'K', 'Y', 'T'],
  // G2: cruce, diagonale, speciale
  ['+', '×', '#', '&', '@', '!', '%', '~'],
  // G3: cifre
  ['2', '3', '4', '7', '8', '9', '6'],
  // G4: forme goale (contururi)
  ['○', '□', '△', '◇', '☆', '▽', '◁', '▷'],
  // G5: litere simple/verticale
  ['V', 'L', 'E', 'F', 'A', 'B', 'D', 'G', 'J', 'P', 'Q', 'R', 'U'],
  // G6: simboluri cerc combinat
  ['⊕', '⊗', '⊙', '⊘', '⊚', '⊛', '⊜'],
  // G7: matematice/caractere speciale
  ['∞', '≈', '§', '¶', '^', '†', '‡', '‰'],
  // G8: alte forme matematice
  ['∩', '∪', '∆', '∇', '⋆', '⋄', '∑', '∏'],
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

// Lista finală: ■ H + 2 ○ V ⊕ ∞ ∩ | ● Z × 3 □ L ⊗ ≈ ∪ | ◆ M # 4 △ E ⊙ § ∆ | ...
// Fiecare 9 simboluri consecutive sunt din grupe complet diferite vizual
export const SYMBOLS = buildSymbolList()

export function assignSymbols(count: number): string[] {
  return SYMBOLS.slice(0, count)
}
