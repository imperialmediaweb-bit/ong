/**
 * Donation Fee Service
 * Calculates platform fees based on NGO subscription plan.
 *
 * Plan-based defaults:
 *   BASIC: 3% + 1 RON (minimum 1 RON)
 *   PRO:   1.5% + 0 RON (minimum 0)
 *   ELITE: 0%
 *
 * NGOs can override via their own fee config fields.
 */

export interface DonationFeeConfig {
  feePercent: number;      // percentage (e.g. 3 = 3%)
  feeFixedAmount: number;  // fixed fee in RON
  feeMinAmount: number;    // minimum total fee in RON
}

export interface FeeCalculationResult {
  feeAmount: number;       // total fee in RON (decimal)
  feeAmountCents: number;  // total fee in bani (minor units) for Stripe
  netAmount: number;       // amount NGO receives in RON
  grossAmount: number;     // original donation amount in RON
}

// Default fee configs per plan
const PLAN_FEE_DEFAULTS: Record<string, DonationFeeConfig> = {
  BASIC: {
    feePercent: 3,
    feeFixedAmount: 1,  // 1 RON fixed
    feeMinAmount: 1,    // minimum 1 RON
  },
  PRO: {
    feePercent: 1.5,
    feeFixedAmount: 0,
    feeMinAmount: 0,
  },
  ELITE: {
    feePercent: 0,
    feeFixedAmount: 0,
    feeMinAmount: 0,
  },
};

/**
 * Get the fee configuration for an NGO, considering plan defaults and per-NGO overrides.
 */
export function getFeeConfig(
  plan: string,
  ngoOverrides?: {
    donationFeePercent?: number | null;
    donationFeeFixedAmount?: number | null;
    donationFeeMinAmount?: number | null;
  }
): DonationFeeConfig {
  const defaults = PLAN_FEE_DEFAULTS[plan] || PLAN_FEE_DEFAULTS.BASIC;

  return {
    feePercent: ngoOverrides?.donationFeePercent ?? defaults.feePercent,
    feeFixedAmount: ngoOverrides?.donationFeeFixedAmount ?? defaults.feeFixedAmount,
    feeMinAmount: ngoOverrides?.donationFeeMinAmount ?? defaults.feeMinAmount,
  };
}

/**
 * Calculate the platform fee for a donation.
 * @param amountRon - donation amount in RON (e.g. 100.00)
 * @param plan - NGO subscription plan (BASIC, PRO, ELITE)
 * @param ngoOverrides - optional per-NGO fee overrides
 */
export function calculateDonationFee(
  amountRon: number,
  plan: string,
  ngoOverrides?: {
    donationFeePercent?: number | null;
    donationFeeFixedAmount?: number | null;
    donationFeeMinAmount?: number | null;
  }
): FeeCalculationResult {
  const config = getFeeConfig(plan, ngoOverrides);

  // Calculate percentage component
  const percentFee = amountRon * (config.feePercent / 100);

  // Add fixed component
  let totalFee = percentFee + config.feeFixedAmount;

  // Apply minimum
  if (config.feeMinAmount > 0 && totalFee < config.feeMinAmount) {
    totalFee = config.feeMinAmount;
  }

  // Fee cannot exceed the donation amount
  if (totalFee > amountRon) {
    totalFee = amountRon;
  }

  // Round to 2 decimal places
  totalFee = Math.round(totalFee * 100) / 100;

  // Convert to minor units (bani) for Stripe
  const feeAmountCents = Math.round(totalFee * 100);

  return {
    feeAmount: totalFee,
    feeAmountCents,
    netAmount: Math.round((amountRon - totalFee) * 100) / 100,
    grossAmount: amountRon,
  };
}

/**
 * Get human-readable fee description for display.
 */
export function getFeeDescription(plan: string): string {
  switch (plan) {
    case "ELITE":
      return "0% comision platforma";
    case "PRO":
      return "1.5% comision platforma";
    case "BASIC":
    default:
      return "3% + 1 RON comision platforma (minim 1 RON)";
  }
}
