// Culori categorice pentru schema cross-stitch — 40 culori distincte.
// Alese pentru: contrast maxim între vecini, lizibilitate la imprimare 16CT/18CT,
// simbol negru vizibil pe fiecare fundal.
// Ordinea e importantă: culorile consecutive trebuie să fie cât mai diferite.

export const CATEGORICAL_COLORS = [
  '#2196F3', // 0  albastru
  '#F44336', // 1  roșu
  '#FF9800', // 2  portocaliu
  '#4CAF50', // 3  verde
  '#9C27B0', // 4  violet
  '#FFEB3B', // 5  galben
  '#00BCD4', // 6  cyan
  '#E91E63', // 7  roz aprins
  '#3F51B5', // 8  indigo
  '#8BC34A', // 9  verde lime
  '#FF5722', // 10 portocaliu-roșu
  '#009688', // 11 teal
  '#795548', // 12 maro
  '#607D8B', // 13 gri-albăstrui
  '#F48FB1', // 14 roz deschis
  '#80CBC4', // 15 teal deschis
  '#A5D6A7', // 16 verde deschis
  '#CE93D8', // 17 lavandă
  '#FFCC02', // 18 galben aprins
  '#FF7043', // 19 portocaliu coral
  '#42A5F5', // 20 albastru deschis
  '#EF5350', // 21 roșu deschis
  '#FFA726', // 22 portocaliu gălbui
  '#66BB6A', // 23 verde mediu
  '#AB47BC', // 24 violet mediu
  '#FFF176', // 25 galben pai
  '#26C6DA', // 26 cyan deschis
  '#F06292', // 27 roz mediu
  '#5C6BC0', // 28 albastru-violet
  '#D4E157', // 29 galben-verde
  '#FF8A65', // 30 somon
  '#26A69A', // 31 teal mediu
  '#A1887F', // 32 bej-maro
  '#78909C', // 33 gri-albăstrui deschis
  '#C62828', // 34 roșu închis
  '#1565C0', // 35 albastru închis
  '#E65100', // 36 portocaliu închis
  '#2E7D32', // 37 verde închis
  '#6A1B9A', // 38 violet închis
  '#F57F17', // 39 chihlimbar
]

export function getCategoricalColor(rank: number): string {
  return CATEGORICAL_COLORS[rank % CATEGORICAL_COLORS.length]
}
