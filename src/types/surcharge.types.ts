// FILE PATH: src/types/surcharge.types.ts

/**
 * Surcharge Types
 * 
 * Two categories:
 * 1. Service Fees - Concrete delivery surcharges (waiting time, cartage, after hours, etc.)
 * 2. Testing Fees - Lab testing charges with normal/after-hours pricing tiers
 */

// ==================== SERVICE FEES ====================

export interface SurchargeRate {
  label: string;
  amount: number | null; // null = "Price on Application"
  unit: string;
}

export interface Surcharge {
  id: number;
  name: string;
  code: string;
  category: 'service_fee' | 'testing_fee';
  description: string;
  rates: SurchargeRate[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== TESTING FEES ====================

export interface TestingFeeRate {
  period: 'normal' | 'after_hours_1' | 'after_hours_2' | 'after_hours_3';
  period_label: string;
  amount: number | null;
  code: string;
  unit: string;
}

export interface TestingFee {
  id: number;
  name: string;
  code: string;
  category: 'testing_fee';
  description: string;
  rates: TestingFeeRate[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== API PAYLOADS ====================

export interface UpdateSurchargePayload {
  rates: SurchargeRate[] | TestingFeeRate[];
  is_active?: boolean;
}

export interface ToggleSurchargePayload {
  is_active: boolean;
}

// ==================== API RESPONSES ====================

export interface SurchargesResponse {
  success: boolean;
  data: {
    service_fees: Surcharge[];
    testing_fees: TestingFee[];
  };
}

export interface UpdateSurchargeResponse {
  success: boolean;
  message: string;
  data: Surcharge | TestingFee;
}