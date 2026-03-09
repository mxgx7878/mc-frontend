export interface Surcharge {
  id: number;
  name: string;
  description: string | null;
  conditions: string | null;
  worked_example: string | null;
  billing_code: string | null;
  amount: number;
  amount_type: 'fixed' | 'percentage';
  applies_to: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TestingFee {
  id: number;
  name: string;
  description: string | null;
  conditions: string | null;
  worked_example: string | null;
  billing_code: string | null;
  amount: number;
  amount_type: 'fixed' | 'percentage';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SurchargesListResponse {
  success: boolean;
  data: Surcharge[];
}

export interface TestingFeesListResponse {
  success: boolean;
  data: TestingFee[];
}

export interface UpdateSurchargePayload {
  name?: string;
  description?: string | null;
  conditions?: string | null;
  worked_example?: string | null;
  billing_code?: string | null;
  amount?: number;
  amount_type?: 'fixed' | 'percentage';
  applies_to?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateTestingFeePayload {
  name?: string;
  description?: string | null;
  conditions?: string | null;
  worked_example?: string | null;
  billing_code?: string | null;
  amount?: number;
  amount_type?: 'fixed' | 'percentage';
  is_active?: boolean;
  sort_order?: number;
}