export interface ResponsiveImageSpec {
  baseName: string;
  width: number;
  height: number;
  widths: readonly number[];
  defaultWidth: number;
}

const STANDARD_4_3_WIDTHS = [480, 800, 1200] as const;
const WIDE_16_9_WIDTHS = [480, 960, 1376] as const;

export const RESPONSIVE_IMAGE_SPECS = {
  hero_craft_construction_1793401118434: {
    baseName: 'hero_craft_construction_1793401118434',
    width: 1376,
    height: 768,
    widths: WIDE_16_9_WIDTHS,
    defaultWidth: 1376,
  },
  project_bathroom_before_1793480824213: {
    baseName: 'project_bathroom_before_1793480824213',
    width: 1376,
    height: 768,
    widths: WIDE_16_9_WIDTHS,
    defaultWidth: 960,
  },
  project_interior_before_1793480836173: {
    baseName: 'project_interior_before_1793480836173',
    width: 1376,
    height: 768,
    widths: WIDE_16_9_WIDTHS,
    defaultWidth: 960,
  },
  blog_core_materials_1795272929269: {
    baseName: 'blog_core_materials_1795272929269',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  blog_maintenance_care_1795272929816: {
    baseName: 'blog_maintenance_care_1795272929816',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  blog_trends_interior_1795272927881: {
    baseName: 'blog_trends_interior_1795272927881',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  project_bathroom_tiles_1793401119494: {
    baseName: 'project_bathroom_tiles_1793401119494',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  project_facade_masonry_1793401119373: {
    baseName: 'project_facade_masonry_1793401119373',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  project_interior_renovation_1793401119488: {
    baseName: 'project_interior_renovation_1793401119488',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  service_apartment_core_renovation_1793401869790: {
    baseName: 'service_apartment_core_renovation_1793401869790',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  service_finishing_painting_1793467970178: {
    baseName: 'service_finishing_painting_1793467970178',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
  service_plasterboard_drywall_1793467969873: {
    baseName: 'service_plasterboard_drywall_1793467969873',
    width: 1200,
    height: 896,
    widths: STANDARD_4_3_WIDTHS,
    defaultWidth: 800,
  },
} as const satisfies Record<string, ResponsiveImageSpec>;

export type ResponsiveImageKey = keyof typeof RESPONSIVE_IMAGE_SPECS;

export const getDefaultImageUrl = (key: ResponsiveImageKey): string => {
  const spec = RESPONSIVE_IMAGE_SPECS[key];
  return `/images/${spec.baseName}-${spec.defaultWidth}.webp`;
};

export const IMAGE_PATHS = {
  HERO: getDefaultImageUrl('hero_craft_construction_1793401118434'),
  BATHROOM_BEFORE: getDefaultImageUrl('project_bathroom_before_1793480824213'),
  BATHROOM_AFTER: getDefaultImageUrl('project_bathroom_tiles_1793401119494'),
  INTERIOR_BEFORE: getDefaultImageUrl('project_interior_before_1793480836173'),
  INTERIOR_AFTER: getDefaultImageUrl('project_interior_renovation_1793401119488'),
  FACADE: getDefaultImageUrl('project_facade_masonry_1793401119373'),
  APARTMENT_CORE: getDefaultImageUrl('service_apartment_core_renovation_1793401869790'),
  DRYWALL: getDefaultImageUrl('service_plasterboard_drywall_1793467969873'),
  PAINTING: getDefaultImageUrl('service_finishing_painting_1793467970178'),
  BLOG_TRENDS: getDefaultImageUrl('blog_trends_interior_1795272927881'),
  BLOG_MAINTENANCE: getDefaultImageUrl('blog_maintenance_care_1795272929816'),
  BLOG_MATERIALS: getDefaultImageUrl('blog_core_materials_1795272929269'),
} as const;

const KNOWN_KEYS = Object.keys(RESPONSIVE_IMAGE_SPECS) as ResponsiveImageKey[];

export const findResponsiveImageSpec = (src: string): ResponsiveImageSpec | null => {
  if (!src) return null;
  for (const key of KNOWN_KEYS) {
    if (src.includes(key)) {
      return RESPONSIVE_IMAGE_SPECS[key];
    }
  }
  return null;
};

export const normalizeLegacyMediaUrl = (url: string): string => {
  const spec = findResponsiveImageSpec(url);
  if (!spec) return url;
  return `/images/${spec.baseName}-${spec.defaultWidth}.webp`;
};

export interface ResolvedImageSources {
  avifSrcSet?: string;
  webpSrcSet?: string;
  fallbackSrc: string;
  width?: number;
  height?: number;
}

export const resolveResponsiveImageSources = (src: string): ResolvedImageSources => {
  const spec = findResponsiveImageSpec(src);
  if (!spec) {
    return { fallbackSrc: src };
  }

  return {
    avifSrcSet: spec.widths
      .map((w) => `/images/${spec.baseName}-${w}.avif ${w}w`)
      .join(', '),
    webpSrcSet: spec.widths
      .map((w) => `/images/${spec.baseName}-${w}.webp ${w}w`)
      .join(', '),
    fallbackSrc: `/images/${spec.baseName}-${spec.defaultWidth}.webp`,
    width: spec.width,
    height: spec.height,
  };
};
