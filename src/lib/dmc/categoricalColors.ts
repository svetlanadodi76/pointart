export const CATEGORICAL_COLORS = [
  // 0-19: culori SOLIDE pentru top 20 culori (fără simbol) — paletă aprobată manual
  '#CC0000', //  0 roșu
  '#8B6355', //  1 ciocolată
  '#FF9800', //  2 portocaliu
  '#2E7D32', //  3 verde
  '#00838F', //  4 turcoaz
  '#1A237E', //  5 albastru
  '#7B1FA2', //  6 mov
  '#C2185B', //  7 roz fucsia
  '#F8BBD0', //  8 roz deschis
  '#4E342E', //  9 maro
  '#D7CCC8', // 10 bej
  '#FFD600', // 11 galben intens
  '#757575', // 12 gri
  '#212121', // 13 negru
  '#76FF03', // 14 verde intens deschis
  '#42A5F5', // 15 albastru cer
  '#556B2F', // 16 verde măsliniu
  '#CC8800', // 17 muștar
  '#880E4F', // 18 vișiniu
  '#CE93D8', // 19 lavandă

  // 20-89: culori pentru SIMBOLURI (celule albe) — toate ÎNTUNECATE, contrast ≥ 4.5:1 pe alb
  '#0D47A1', // 20 navy
  '#B71C1C', // 21 roșu închis
  '#BF360C', // 22 portocaliu ars
  '#1B5E20', // 23 verde închis
  '#6A1B9A', // 24 mov închis
  '#7B3A00', // 25 chihlimbar închis  (era #F9A825 — contrast slab)
  '#006064', // 26 turcoaz închis
  '#AD1457', // 27 roz închis
  '#1A237E', // 28 albastru very dark
  '#33691E', // 29 olive închis
  '#5D4037', // 30 maro închis
  '#004D40', // 31 verde-teal închis
  '#3E2723', // 32 maro very dark
  '#263238', // 33 gri-albastru very dark
  '#C62828', // 34 roșu închis
  '#1565C0', // 35 albastru închis
  '#8B2500', // 36 portocaliu ars închis (era #E65100 — contrast slab)
  '#33691E', // 37 olive închis       (era #558B2F — contrast slab)
  '#4A148C', // 38 violet very dark
  '#7B4000', // 39 chihlimbar-maro     (era #F57F17 — contrast slab)
  '#7F0000', // 40 maroon
  '#8B3100', // 41 portocaliu-maro     (era #FF6D00 — contrast slab)
  '#2E7D32', // 42 verde
  '#00695C', // 43 teal
  '#01579B', // 44 albastru
  '#311B92', // 45 indigo very dark
  '#6D4C41', // 46 maro mediu
  '#455A64', // 47 gri-albastru
  '#6D5E00', // 48 olive-galben închis (era #827717 — contrast slab)
  '#546E7A', // 49 gri-albastru mediu
  '#5D4037', // 50 maro                (era #8D6E63 — contrast slab)
  '#3949AB', // 51 indigo
  '#8B3500', // 52 orange-maro închis  (era #E65C00 — contrast slab)
  '#795548', // 53 maro
  '#37474F', // 54 gri-albastru închis
  '#616161', // 55 gri
  '#5C6BC0', // 56 indigo mediu
  '#006064', // 57 teal închis         (era #00838F — contrast slab)
  '#880E4F', // 58 roz-maroon
  '#9C27B0', // 59 violet
  '#4A148C', // 60 violet very dark
  '#7F0000', // 61 maroon
  '#8B2500', // 62 portocaliu ars      (era #E65100 — contrast slab)
  '#1B5E20', // 63 verde închis
  '#006064', // 64 teal
  '#01579B', // 65 albastru
  '#6A1B9A', // 66 mov
  '#4E342E', // 67 maro închis
  '#37474F', // 68 gri-albastru
  '#6D5E00', // 69 olive-galben         (era #827717 — contrast slab)
  '#795548', // 70 maro
  '#263238', // 71 gri very dark
  '#3949AB', // 72 indigo
  '#BF360C', // 73 portocaliu ars
  '#004D40', // 74 teal
  '#AD1457', // 75 roz
  '#33691E', // 76 olive
  '#5D4037', // 77 maro
  '#546E7A', // 78 gri-albastru
  '#0D47A1', // 79 navy
  '#C62828', // 80 roșu
  '#311B92', // 81 indigo
  '#7B3A00', // 82 chihlimbar          (era #F9A825 — contrast slab)
  '#2E7D32', // 83 verde
  '#1565C0', // 84 albastru
  '#8B3500', // 85 orange-maro          (era #E65C00 — contrast slab)
  '#6D4C41', // 86 maro
  '#455A64', // 87 gri-albastru
  '#3E2723', // 88 maro very dark
  '#5C6BC0', // 89 indigo mediu
]

export const GEOMETRIC_SYMBOLS = new Set([
  '▲','▼','◀','▶','●','○','■','□','◆','◇','◐','◑','◒','◓','▣','▤',
])

export function getCategoricalColor(rank: number): string {
  return CATEGORICAL_COLORS[rank % CATEGORICAL_COLORS.length]
}

// Top N culori după frecvență primesc culoare plină (fără simbol)
export const SOLID_THRESHOLD = 20

// 70 simboluri distincte pentru ranks 20-89 (scheme cu până la 90 culori)
export const SIMPLE_SYMBOLS = [
  // ranks 20-27
  '+', 'X', 'n', '-', '=', 'a', 'k', '~',
  // ranks 28-35
  '1', '5', '6', '9', 'T', 'Y', 'L', 'm',
  // ranks 36-51 — forme geometrice (triangle, cerc, patrat, romb, jumatati)
  '▲', '▼', '◀', '▶', '●', '○',
  '■', '□', '◆', '◇', '◐', '◑',
  '◒', '◓', '▣', '▤',
  // ranks 52-59
  'S', 'O', '#', '@', '/', 'A', 'E', 'R',
  // ranks 60-65
  'B', 'D', 'M', 'P', 'Q', 'W',
  // ranks 66-71
  '!', '?', '(', ')', '[', ']',
  // ranks 72-77
  '<', '>', '\\', '$', '%', '&',
  // ranks 78-83
  ':', ';', '_', '{', '}', 'c',
  // ranks 84-89
  'f', 'g', 'j', 'b', 'd', 'p',
]
