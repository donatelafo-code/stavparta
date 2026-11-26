import { PricingConfig, PricingRange, QuoteItem } from '../types';
import pricingSeed from '../data/pricing.json';

export const DEFAULT_PRICING_CONFIG: PricingConfig = pricingSeed as PricingConfig;

export type CalculatorMode = 'core' | 'apartment';
export type CoreType = 'umakart' | 'masonry';
export type CoreLayout = 'separate' | 'combined';
export type CoreSanitary = 'walkin' | 'tub';
export type CoreTileQuality = 'standard' | 'large_format';
export type ApartmentSize = '1kk' | '2kk' | '3kk' | '4kk';
export type ApartmentScope = 'turnkey' | 'interior_only';

export type CalculatorEstimateInput =
  | {
      mode: 'core';
      coreType: CoreType;
      coreLayout?: CoreLayout;
      coreSanitary: CoreSanitary;
      coreTileQuality: CoreTileQuality;
    }
  | {
      mode: 'apartment';
      aptSize: ApartmentSize;
      aptScope: ApartmentScope;
      aptCeilings: boolean;
      aptFlooring: boolean;
    };

export interface CalculatorEstimateResult {
  min: number;
  max: number;
  days: string;
  pricingVersion: number;
}

function sanitizeNonNegativeAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.round(value);
}

function sanitizeRange(range: PricingRange): PricingRange {
  const min = sanitizeNonNegativeAmount(range.min);
  const max = Math.max(min, sanitizeNonNegativeAmount(range.max));
  return { min, max };
}

export function calculateEstimate(
  input: CalculatorEstimateInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): CalculatorEstimateResult {
  if (input.mode === 'core') {
    const demolition = sanitizeRange(
      input.coreType === 'umakart'
        ? config.core.demolitionUmakart
        : config.core.demolitionMasonry
    );
    const masonry = sanitizeRange(config.core.newMasonryAndPlaster);
    const plumbing = sanitizeRange(config.core.plumbingAndWaste);
    const tiling = sanitizeRange(
      input.coreTileQuality === 'large_format'
        ? config.core.tilingLargeFormat
        : config.core.tilingStandard
    );
    const sanitary = sanitizeRange(
      input.coreSanitary === 'walkin' ? config.core.sanitaryWalkIn : config.core.sanitaryTub
    );

    const min = demolition.min + masonry.min + plumbing.min + tiling.min + sanitary.min;
    const max = demolition.max + masonry.max + plumbing.max + tiling.max + sanitary.max;

    return {
      min,
      max: Math.max(min, max),
      days:
        input.coreType === 'umakart'
          ? config.core.durationUmakart
          : config.core.durationMasonry,
      pricingVersion: config.version,
    };
  }

  const tierMap = {
    '1kk': config.apartment.size1kk,
    '2kk': config.apartment.size2kk,
    '3kk': config.apartment.size3kk,
    '4kk': config.apartment.size4kk,
  } as const;

  const baseTier = tierMap[input.aptSize];
  const baseRange = sanitizeRange(baseTier);
  let min = baseRange.min;
  let max = baseRange.max;

  if (input.aptScope === 'interior_only') {
    const rawMultiplier = config.apartment.interiorOnlyMultiplier;
    const safeMultiplier =
      Number.isFinite(rawMultiplier) && rawMultiplier > 0 && rawMultiplier <= 2
        ? rawMultiplier
        : 0.7;
    min = Math.round(min * safeMultiplier);
    max = Math.round(max * safeMultiplier);
  }

  if (input.aptCeilings) {
    const ceilings = sanitizeRange(config.apartment.ceilingsAddition);
    min += ceilings.min;
    max += ceilings.max;
  }

  if (input.aptFlooring) {
    const flooring = sanitizeRange(config.apartment.flooringAddition);
    min += flooring.min;
    max += flooring.max;
  }

  return {
    min,
    max: Math.max(min, max),
    days: baseTier.duration,
    pricingVersion: config.version,
  };
}

export interface QuotationTotalsBreakdown {
  itemTotals: Array<{ id: string; lineTotal: number }>;
  subtotalWithoutDph: number;
  discountPercent: number;
  discountAmount: number;
  discountedSubtotal: number;
  dphRate: number;
  dphAmount: number;
  grandTotal: number;
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateQuotationTotals(
  items: ReadonlyArray<Pick<QuoteItem, 'id' | 'quantity' | 'unitPrice'>>,
  discountPercent = 0,
  dphRate = 0
): QuotationTotalsBreakdown {
  const safeDiscountPercent = Number.isFinite(discountPercent)
    ? Math.min(100, Math.max(0, discountPercent))
    : 0;
  const safeDphRate = Number.isFinite(dphRate) && dphRate > 0 ? Math.min(100, dphRate) : 0;

  const itemTotals = items.map((item) => {
    const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    const unitPrice = Number.isFinite(item.unitPrice) && item.unitPrice > 0 ? item.unitPrice : 0;
    return {
      id: item.id,
      lineTotal: roundCurrency(qty * unitPrice),
    };
  });

  const subtotalWithoutDph = roundCurrency(
    itemTotals.reduce((sum, row) => sum + row.lineTotal, 0)
  );
  const discountAmount = roundCurrency((subtotalWithoutDph * safeDiscountPercent) / 100);
  const discountedSubtotal = roundCurrency(Math.max(0, subtotalWithoutDph - discountAmount));
  const dphAmount = roundCurrency((discountedSubtotal * safeDphRate) / 100);
  const grandTotal = roundCurrency(discountedSubtotal + dphAmount);

  return {
    itemTotals,
    subtotalWithoutDph,
    discountPercent: safeDiscountPercent,
    discountAmount,
    discountedSubtotal,
    dphRate: safeDphRate,
    dphAmount,
    grandTotal,
  };
}
