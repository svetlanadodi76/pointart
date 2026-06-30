const POW25_7 = 6103515625 // 25^7

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB → linear light
  const rl = r / 255
  const gl = g / 255
  const bl = b / 255
  const R = rl <= 0.04045 ? rl / 12.92 : ((rl + 0.055) / 1.055) ** 2.4
  const G = gl <= 0.04045 ? gl / 12.92 : ((gl + 0.055) / 1.055) ** 2.4
  const B = bl <= 0.04045 ? bl / 12.92 : ((bl + 0.055) / 1.055) ** 2.4

  // linear → XYZ D65
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047
  const Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B) / 1.00000
  const Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883

  const f = (t: number) => t > 0.008856 ? t ** (1 / 3) : (903.3 * t + 16) / 116

  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]
}

export function ciede2000(
  L1: number, a1: number, b1: number,
  L2: number, a2: number, b2: number,
): number {
  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const Cbar = (C1 + C2) / 2
  const Cbar7 = Cbar ** 7
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + POW25_7)))

  const a1p = a1 * (1 + G)
  const a2p = a2 * (1 + G)
  const C1p = Math.sqrt(a1p * a1p + b1 * b1)
  const C2p = Math.sqrt(a2p * a2p + b2 * b2)

  const rad = (d: number) => d * Math.PI / 180
  const hRaw1 = Math.atan2(b1, a1p) * 180 / Math.PI
  const hRaw2 = Math.atan2(b2, a2p) * 180 / Math.PI
  const h1p = hRaw1 >= 0 ? hRaw1 : hRaw1 + 360
  const h2p = hRaw2 >= 0 ? hRaw2 : hRaw2 + 360

  const dCp = C2p - C1p
  let dhp: number
  if (C1p * C2p === 0) {
    dhp = 0
  } else {
    const diff = h2p - h1p
    if (Math.abs(diff) <= 180) dhp = diff
    else dhp = diff > 180 ? diff - 360 : diff + 360
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2))
  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp: number
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p
  } else if (Math.abs(h1p - h2p) <= 180) {
    hbarp = (h1p + h2p) / 2
  } else {
    hbarp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2
  }

  const T = 1
    - 0.17 * Math.cos(rad(hbarp - 30))
    + 0.24 * Math.cos(rad(2 * hbarp))
    + 0.32 * Math.cos(rad(3 * hbarp + 6))
    - 0.20 * Math.cos(rad(4 * hbarp - 63))

  const SL = 1 + 0.015 * (Lbarp - 50) ** 2 / Math.sqrt(20 + (Lbarp - 50) ** 2)
  const SC = 1 + 0.045 * Cbarp
  const SH = 1 + 0.015 * Cbarp * T

  const Cbarp7 = Cbarp ** 7
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + POW25_7))
  const hDiff = (hbarp - 275) / 25
  const dTheta = 30 * Math.exp(-(hDiff * hDiff))
  const RT = -Math.sin(rad(2 * dTheta)) * RC

  const dL = (L2 - L1) / SL
  const dC = dCp / SC
  const dH = dHp / SH

  return Math.sqrt(dL * dL + dC * dC + dH * dH + RT * dC * dH)
}
