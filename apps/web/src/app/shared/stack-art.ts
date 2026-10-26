import { FoodCategory, INGREDIENTS, IngredientKey } from '@cc/contracts';

/**
 * Dibuja un día de comida como el corte de lo que se come: capas de ingredientes
 * de arriba hacia abajo, con su color real. Sin imágenes externas.
 */
export type Shape =
  | { type: 'path'; d: string; fill: string }
  | { type: 'rect'; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { type: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string };

export interface ArtLayer {
  key: IngredientKey;
  label: string;
  /** Posición relativa al centro de la pila, para separar las capas. */
  offset: number;
  /** Centro vertical, para la etiqueta. */
  cy: number;
  shapes: Shape[];
}

export interface Art {
  width: number;
  height: number;
  base: Shape[];
  layers: ArtLayer[];
  clip: string | null;
}

const W = 400;
const UNIT = 40;

const BREAD = new Set<IngredientKey>(['pan', 'marraqueta', 'churrasca', 'waffle', 'masa']);
const DRIP = new Set<IngredientKey>(['mayo', 'manjar', 'queso', 'espuma', 'mantequilla', 'palta']);
const SLICES = new Set<IngredientKey>(['tomate', 'frutilla', 'limon']);
const LEAFY = new Set<IngredientKey>(['lechuga', 'aji', 'pebre']);
const DOTS = new Set<IngredientKey>(['porotos', 'choclo']);
const MEAT = new Set<IngredientKey>(['churrasco', 'lomito', 'carne', 'pino', 'cebolla', 'zapallo']);

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

function wave(x: number, y: number, w: number, amp: number, n: number, dir: 1 | -1): string {
  const step = w / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const x1 = x + step * i + step / 2;
    const x2 = x + step * (i + 1);
    d += ` Q ${x1} ${y + amp * dir * (i % 2 ? -1 : 1)} ${x2} ${y}`;
  }
  return d;
}

function layerShapes(key: IngredientKey, i: number, count: number, x: number, y: number, w: number, h: number): Shape[] {
  const color = INGREDIENTS[key].color;
  const dark = shade(color, -0.12);
  const light = shade(color, 0.1);

  if (BREAD.has(key)) {
    if (i === 0 && count > 1) {
      // Tapa del pan: domo con una franja más clara.
      const d = `M ${x} ${y + h} C ${x} ${y - h * 0.15} ${x + w * 0.12} ${y} ${x + w / 2} ${y} C ${x + w * 0.88} ${y} ${x + w} ${y - h * 0.15} ${x + w} ${y + h} Z`;
      const seeds: Shape[] = key === 'marraqueta'
        ? [{ type: 'path', d: `M ${x + w / 2 - 3} ${y + 4} L ${x + w / 2 + 3} ${y + 4} L ${x + w / 2 + 2} ${y + h * 0.8} L ${x + w / 2 - 2} ${y + h * 0.8} Z`, fill: dark }]
        : [];
      return [{ type: 'path', d, fill: color }, { type: 'rect', x: x + w * 0.18, y: y + h * 0.22, w: w * 0.3, h: h * 0.16, r: h * 0.08, fill: light }, ...seeds];
    }
    if (i === count - 1 && count > 1) {
      return [{ type: 'rect', x, y, w, h, r: h * 0.45, fill: color }, { type: 'rect', x: x + 6, y, w: w - 12, h: h * 0.28, r: h * 0.14, fill: dark }];
    }
    if (key === 'waffle') {
      const cells: Shape[] = [];
      for (let c = 0; c < 8; c++) cells.push({ type: 'rect', x: x + 14 + c * ((w - 28) / 8), y: y + h * 0.25, w: (w - 28) / 8 - 6, h: h * 0.5, r: 3, fill: dark });
      return [{ type: 'rect', x, y, w, h, r: 10, fill: color }, ...cells];
    }
    return [{ type: 'rect', x, y, w, h, r: h * 0.5, fill: color }, { type: 'rect', x: x + w * 0.1, y: y + h * 0.2, w: w * 0.5, h: h * 0.2, r: h * 0.1, fill: light }];
  }

  if (key === 'vienesa') {
    const over = 26;
    return [
      { type: 'rect', x: x - over, y, w: w + over * 2, h, r: h / 2, fill: color },
      { type: 'rect', x: x - over + 18, y: y + h * 0.2, w: w * 0.6, h: h * 0.18, r: h * 0.09, fill: light },
    ];
  }

  if (DRIP.has(key)) {
    const d = `M ${x - 6} ${y + h * 0.3} Q ${x - 6} ${y} ${x + 10} ${y} L ${x + w - 10} ${y} Q ${x + w + 6} ${y} ${x + w + 6} ${y + h * 0.3}` +
      wave(x + w + 6, y + h * 0.65, -(w + 12), h * 0.7, 9, 1).replace(/^/, ` L ${x + w + 6} ${y + h * 0.65}`) + ' Z';
    return [{ type: 'path', d, fill: color }];
  }

  if (SLICES.has(key)) {
    const n = key === 'limon' ? 4 : 6;
    const r = Math.min(h * 0.9, w / n / 1.6);
    const shapes: Shape[] = [];
    for (let s = 0; s < n; s++) {
      const cx = x + r + s * ((w - 2 * r) / (n - 1));
      shapes.push({ type: 'circle', cx, cy: y + h / 2, r, fill: color });
      shapes.push({ type: 'circle', cx, cy: y + h / 2, r: r * 0.55, fill: light });
    }
    return shapes;
  }

  if (LEAFY.has(key)) {
    const top = `M ${x - 10} ${y + h / 2}` + wave(x - 10, y + h * 0.15, w + 20, h * 0.5, 12, -1);
    const d = top + ` L ${x + w + 10} ${y + h * 0.85}` + wave(x + w + 10, y + h * 0.85, -(w + 20), h * 0.4, 12, 1) + ' Z';
    return [{ type: 'path', d, fill: color }];
  }

  if (DOTS.has(key)) {
    const shapes: Shape[] = [{ type: 'rect', x, y: y + h * 0.15, w, h: h * 0.7, r: h * 0.35, fill: dark }];
    const n = 9;
    for (let s = 0; s < n; s++) {
      shapes.push({ type: 'rect', x: x + 8 + s * ((w - 16) / n), y: y + (s % 2) * h * 0.2, w: (w - 16) / n - 6, h: h * 0.8, r: h * 0.4, fill: color });
    }
    return shapes;
  }

  if (key === 'papas') {
    const shapes: Shape[] = [];
    const n = 11;
    for (let s = 0; s < n; s++) {
      const sw = (w - 10) / n;
      const lift = (s * 37) % 11;
      shapes.push({ type: 'rect', x: x + 5 + s * sw, y: y + lift, w: sw - 5, h: h - lift, r: 4, fill: s % 3 ? color : shade(color, 0.08) });
    }
    return shapes;
  }

  if (key === 'huevo') {
    return [
      { type: 'path', d: `M ${x + 20} ${y + h}` + wave(x + 20, y + 2, w - 40, h * 0.6, 6, -1) + ` L ${x + w - 20} ${y + h} Z`, fill: '#FBF8EE' },
      { type: 'ellipse', cx: x + w / 2, cy: y + h * 0.45, rx: h * 1.1, ry: h * 0.55, fill: color },
    ];
  }

  if (MEAT.has(key)) {
    const d = `M ${x - 4} ${y + h * 0.5}` + wave(x - 4, y + h * 0.1, w + 8, h * 0.25, 7, -1) +
      ` L ${x + w + 4} ${y + h * 0.9}` + wave(x + w + 4, y + h, -(w + 8), h * 0.2, 7, 1) + ' Z';
    return [{ type: 'path', d, fill: color }, { type: 'rect', x: x + w * 0.15, y: y + h * 0.4, w: w * 0.4, h: Math.max(3, h * 0.12), r: 2, fill: dark }];
  }

  // Líquidos y lo demás: una banda plana.
  return [{ type: 'rect', x, y, w, h, r: 0, fill: color }];
}

export function buildArt(layers: IngredientKey[], category: FoodCategory): Art {
  const keys = layers.length ? layers : (['pan', 'carne', 'pan'] as IngredientKey[]);
  const heights = keys.map((k) => INGREDIENTS[k].height * UNIT);
  const total = heights.reduce((a, b) => a + b, 0);

  if (category === 'bebida') {
    // Vaso: el líquido llena un cuerpo recortado; el pie es una forma llena.
    const isWine = keys.includes('vino');
    const top = 40, bodyH = isWine ? 210 : 230, bodyW = isWine ? 230 : 210;
    const x = (W - bodyW) / 2;
    const clip = isWine
      ? `M ${x} ${top} L ${x + bodyW} ${top} C ${x + bodyW} ${top + bodyH * 0.8} ${x + bodyW * 0.75} ${top + bodyH} ${W / 2} ${top + bodyH} C ${x + bodyW * 0.25} ${top + bodyH} ${x} ${top + bodyH * 0.8} ${x} ${top} Z`
      : `M ${x} ${top} L ${x + bodyW} ${top} L ${x + bodyW - 22} ${top + bodyH} L ${x + 22} ${top + bodyH} Z`;
    const base: Shape[] = [{ type: 'path', d: clip, fill: '#E7E4DA' }];
    if (isWine) {
      base.push({ type: 'rect', x: W / 2 - 7, y: top + bodyH - 4, w: 14, h: 96, r: 7, fill: '#E7E4DA' });
      base.push({ type: 'ellipse', cx: W / 2, cy: top + bodyH + 96, rx: 80, ry: 14, fill: '#E7E4DA' });
    }
    let y = top + bodyH * (isWine ? 0.35 : 0.18);
    const scale = (top + bodyH - y) / total;
    const out = keys.map((k, i) => {
      const h = heights[i] * scale;
      const l: ArtLayer = { key: k, label: INGREDIENTS[k].label, offset: i - (keys.length - 1) / 2, cy: y + h / 2, shapes: [{ type: 'rect', x, y, w: bodyW, h: h + 1, r: 0, fill: INGREDIENTS[k].color }] };
      y += h;
      return l;
    });
    return { width: W, height: isWine ? 380 : 300, base, layers: out, clip };
  }

  const isPlate = category === 'plato';
  const pad = 30;
  let y = pad;
  const out = keys.map((k, i) => {
    const h = heights[i];
    // En un plato las capas forman un cerro: más angostas arriba.
    const w = isPlate ? 220 + (i / Math.max(1, keys.length - 1)) * 100 : 300;
    const x = (W - w) / 2;
    const l: ArtLayer = { key: k, label: INGREDIENTS[k].label, offset: i - (keys.length - 1) / 2, cy: y + h / 2, shapes: layerShapes(k, i, keys.length, x, y, w, h) };
    y += h + 2;
    return l;
  });
  const base: Shape[] = isPlate
    ? [{ type: 'ellipse', cx: W / 2, cy: y + 14, rx: 196, ry: 30, fill: '#E7E4DA' }, { type: 'ellipse', cx: W / 2, cy: y + 10, rx: 150, ry: 18, fill: '#F4F2EC' }]
    : [];
  return { width: W, height: y + (isPlate ? 50 : pad), base, layers: out, clip: null };
}

/** Color de fondo de la página de un día: su ingrediente más propio, no el pan. */
export function signatureColor(layers: IngredientKey[]): string {
  const k = layers.find((l) => !BREAD.has(l) && l !== 'mayo' && l !== 'espuma') ?? layers[0] ?? 'tomate';
  return INGREDIENTS[k].color;
}

/** Tinta legible sobre un color de fondo. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.22 ? '#161311' : '#ffffff';
}
