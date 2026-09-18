export const RESOURCE_KEYS = ['pe', 'pp', 'ye', 'pc'] as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export type BraceletData = {
  active: boolean;
  pp: number;
  pe: number;
  ye: number;
  pc: number;
  team: number;
};

export const DEFAULT_BRACELET_DATA: BraceletData = {
  active: false,
  pp: 0,
  pe: 0,
  ye: 0,
  pc: 0,
  team: 1,
};

export function resetBraceletData(data: BraceletData): BraceletData {
  return {
    active: false,
    pp: 0,
    pe: 0,
    ye: 0,
    pc: 0,
    team: data.team,
  };
}

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  pe: 'Puntos de experiencia',
  pp: 'Puntos de pasión',
  ye: 'Yenes',
  pc: 'Puntos de característica',
};

export const RESOURCE_SHORT_LABELS: Record<ResourceKey, string> = {
  pe: 'PE',
  pp: 'PP',
  ye: 'YE',
  pc: 'PC',
};

export const RESOURCE_COLORS: Record<ResourceKey, string> = {
  pp: '#EAB308',
  pe: '#9333EA',
  ye: '#16A34A',
  pc: '#DC2626',
};

/** Display order for the collect resource picker (2×2 grid). */
export const COLLECT_RESOURCE_ORDER: ResourceKey[] = ['pp', 'pe', 'ye', 'pc'];
