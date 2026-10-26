/**
 * Ingredientes con los que se dibuja cada día. El color es el del ingrediente
 * real; la altura es relativa (1 = una capa normal).
 */
export const INGREDIENTS = {
  pan: { label: 'Pan', color: '#D8954A', height: 1.4 },
  marraqueta: { label: 'Marraqueta', color: '#CF8A3E', height: 1.5 },
  vienesa: { label: 'Vienesa', color: '#C0503A', height: 0.9 },
  tomate: { label: 'Tomate', color: '#E23B2E', height: 0.7 },
  palta: { label: 'Palta', color: '#7FA845', height: 0.9 },
  mayo: { label: 'Mayonesa', color: '#F5EEDA', height: 0.45 },
  churrasco: { label: 'Churrasco', color: '#6A3523', height: 0.8 },
  lomito: { label: 'Lomito', color: '#8B4A35', height: 0.8 },
  porotos: { label: 'Porotos verdes', color: '#4E8B3A', height: 0.7 },
  aji: { label: 'Ají verde', color: '#9CC43C', height: 0.35 },
  queso: { label: 'Queso derretido', color: '#F3C443', height: 0.5 },
  lechuga: { label: 'Lechuga', color: '#93C25A', height: 0.45 },
  carne: { label: 'Carne', color: '#5A2E1E', height: 0.9 },
  cebolla: { label: 'Cebolla', color: '#E9D3BE', height: 0.5 },
  huevo: { label: 'Huevo frito', color: '#F7D44C', height: 0.5 },
  papas: { label: 'Papas fritas', color: '#F0B53A', height: 1.2 },
  masa: { label: 'Masa frita', color: '#E2A64F', height: 1 },
  zapallo: { label: 'Zapallo', color: '#E98A2C', height: 0.6 },
  pebre: { label: 'Pebre', color: '#C8362B', height: 0.35 },
  churrasca: { label: 'Churrasca', color: '#D9A35B', height: 0.8 },
  mantequilla: { label: 'Mantequilla', color: '#F6E08A', height: 0.3 },
  waffle: { label: 'Waffle', color: '#D9963F', height: 0.8 },
  manjar: { label: 'Manjar', color: '#9B5A2A', height: 0.4 },
  frutilla: { label: 'Frutillas', color: '#D93043', height: 0.5 },
  vino: { label: 'Vino tinto', color: '#6E1A2C', height: 2 },
  pisco: { label: 'Pisco sour', color: '#E6E3B0', height: 1.6 },
  espuma: { label: 'Espuma', color: '#FBFAF2', height: 0.5 },
  limon: { label: 'Limón', color: '#C9D94A', height: 0.3 },
  pino: { label: 'Pino', color: '#7A3B22', height: 1 },
  aceituna: { label: 'Aceituna', color: '#2B2420', height: 0.3 },
  cazuela: { label: 'Caldo', color: '#E7B04A', height: 1.2 },
  choclo: { label: 'Choclo', color: '#F2CE4A', height: 0.8 },
} as const;

export type IngredientKey = keyof typeof INGREDIENTS;
export const INGREDIENT_KEYS = Object.keys(INGREDIENTS) as IngredientKey[];
