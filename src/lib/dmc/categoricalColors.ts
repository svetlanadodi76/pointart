// Culori categorice pentru schema cross-stitch.
// Nu sunt culorile reale DMC — sunt alese pentru lizibilitate maximă la imprimare,
// inclusiv la 16CT/18CT unde celulele sunt ~1.5mm.
// Ordonate pentru contrast maxim între vecini consecutivi.

export const CATEGORICAL_COLORS = [
  '#4A90D9', // albastru
  '#E8453C', // roșu
  '#F5A623', // portocaliu
  '#27AE60', // verde
  '#9B59B6', // violet
  '#F1C40F', // galben
  '#1ABC9C', // teal
  '#E91E8C', // roz
  '#2C3E50', // bleumarin
  '#8BC34A', // verde lime
  '#FF5722', // portocaliu aprins
  '#00BCD4', // cyan
  '#795548', // maro
  '#607D8B', // gri albăstrui
  '#C0392B', // roșu închis
  '#3498DB', // albastru deschis
  '#F39C12', // galben-portocaliu
  '#16A085', // verde-teal
  '#8E44AD', // violet închis
  '#D35400', // portocaliu-maro
]

export function getCategoricalColor(rank: number): string {
  return CATEGORICAL_COLORS[rank % CATEGORICAL_COLORS.length]
}
