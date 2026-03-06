// FILE PATH: src/api/handlers/surcharges.api.ts

/**
 * Surcharges API Handler
 * 
 * Currently uses mock data from the Holcim Concrete Service Fee Summary.
 * Replace with actual API calls when backend endpoints are ready.
 * 
 * Pattern: Same as masterProducts.api.ts, adminOrders.api.ts
 */


import type {
  Surcharge,
  TestingFee,
  SurchargesResponse,
  UpdateSurchargePayload,
  UpdateSurchargeResponse,
  ToggleSurchargePayload,
} from '../../types/surcharge.types';

// ===========================
// MOCK DATA (from PDF)
// ===========================

const MOCK_SERVICE_FEES: Surcharge[] = [
  {
    id: 1,
    name: 'Waiting Time',
    code: 'WAIT',
    category: 'service_fee',
    description: 'Waiting Time applies after 30 minutes on site. No waiting time is payable for the first 30 minutes of any delivery.',
    rates: [
      { label: 'Normal Hours', amount: 3.50, unit: 'per minute' },
      { label: 'Outside Normal Hours', amount: 7.00, unit: 'per minute' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Extra Cartage',
    code: 'ECART',
    category: 'service_fee',
    description: 'An additional fee applies for loads delivered more than 15 km from the nearest Plant.',
    rates: [
      { label: 'Per km per m³', amount: 3.00, unit: 'per km per m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Minimum Cartage',
    code: 'MCART',
    category: 'service_fee',
    description: 'A fee applies for a delivered load size < 4m³ and is calculated on the undelivered part of the load.',
    rates: [
      { label: 'Per undelivered m³', amount: 90.00, unit: '/ undelivered m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Environment Levy',
    code: 'ENVL',
    category: 'service_fee',
    description: 'This fee will apply per cubic metre or part thereof to all concrete delivered.',
    rates: [
      { label: 'Per m³', amount: 2.50, unit: '/ m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Returned Concrete Fee',
    code: 'RETCON',
    category: 'service_fee',
    description: 'This fee is charged per m³ or part thereof for all returned quantities 1.0m³ and greater.',
    rates: [
      { label: 'Per m³ (or part thereof)', amount: 300.00, unit: '/m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'After Normal Operating Hours',
    code: 'AFTHRS',
    category: 'service_fee',
    description: 'Normal working hours are Monday to Friday 6am to 4pm. After hours surcharges do not apply to continuous pours that commence prior to 1pm Monday-Friday and delivery is completed by 6pm.',
    rates: [
      { label: 'Mon–Fri 4pm–6pm', amount: 10.00, unit: 'per m³' },
      { label: 'Mon–Fri 6pm–4am & Sat to 6am', amount: 10.00, unit: 'per m³' },
      { label: 'Sat 6am–12pm', amount: 10.00, unit: 'per m³' },
      { label: 'Sat 12pm–4pm', amount: 45.00, unit: 'per m³' },
      { label: 'Sat 4pm–midnight', amount: 90.00, unit: 'per m³' },
      { label: 'Sun (Midnight Sat – 4am Mon)', amount: 90.00, unit: 'per m³' },
      { label: 'Public Holidays', amount: 90.00, unit: 'per m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 7,
    name: 'Plant Operational Fee',
    code: 'PLANTOP',
    category: 'service_fee',
    description: 'Fee to operate plant per period of 4 hours, or part thereof, outside normal opening hours. Minimum 48 hours notice required.',
    rates: [
      { label: 'First 4 hours (per plant)', amount: 2500.00, unit: 'per plant' },
      { label: 'Each additional hour', amount: 500.00, unit: '/ hour' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 8,
    name: 'Standby',
    code: 'STBY',
    category: 'service_fee',
    description: 'Applies where deliveries scheduled out of hours are cancelled, interrupted or delayed in excess of one hour from the scheduled start time.',
    rates: [
      { label: 'Per truck per hour', amount: 195.00, unit: '/ truck / hour' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 9,
    name: 'Cancellation Fee (Normal Hours)',
    code: 'CANCN',
    category: 'service_fee',
    description: 'A fee will be charged when a pour is cancelled or postponed by 3 hours or more with insufficient notice. The deadline for cancellation notice is 12.00pm two working days prior to the pour.',
    rates: [
      { label: '< 15 m³', amount: 500.00, unit: 'flat' },
      { label: 'Less than 75 m³', amount: 1650.00, unit: 'flat' },
      { label: 'More than 75 m³', amount: 3300.00, unit: 'flat' },
      { label: 'More than 200 m³', amount: 7000.00, unit: 'flat' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 10,
    name: 'Cancellation Fee (After Hours)',
    code: 'CANCAH',
    category: 'service_fee',
    description: 'A fee will be charged when a pour booked for after normal operating hours is cancelled or postponed by 3 hours or more with insufficient notice.',
    rates: [
      { label: '< 15 m³', amount: 1000.00, unit: 'flat' },
      { label: 'Less than 75 m³', amount: 3300.00, unit: 'flat' },
      { label: 'More than 75 m³', amount: 6600.00, unit: 'flat' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 11,
    name: 'Additional Balance/Plus Load Fee',
    code: 'BALLOAD',
    category: 'service_fee',
    description: 'A fee applied to unplanned deliveries required over and above one balance or plus load. For Orders < 50m³: 1 balance or plus load. For Orders > 50m³: fee applies on all loads after a 20% increase of order volume.',
    rates: [
      { label: 'Per load', amount: 150.00, unit: '/ load' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 12,
    name: 'Administration Fee',
    code: 'ADMIN',
    category: 'service_fee',
    description: 'Fee for the provision of additional copies of delivery docket/s, invoice/s and/or statement/s or review of call recordings, at customer request.',
    rates: [
      { label: 'Per copy', amount: 50.00, unit: '/ copy' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 13,
    name: 'Small Aggregate Premium',
    code: 'SMAGG',
    category: 'service_fee',
    description: 'Fee to cover additional costs associated with production of smaller aggregates and increased cement costs to maintain strength.',
    rates: [
      { label: '10mm', amount: 10.00, unit: '/m³' },
      { label: '7mm', amount: 12.00, unit: '/m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 14,
    name: 'Slump Modification',
    code: 'SLUMP',
    category: 'service_fee',
    description: 'For slump requested in excess of 80mm on all N Class Grades up to 40Mpa, a charge applies per 20mm slump increase. All other mixes, including S Class, are P.O.A.',
    rates: [
      { label: 'Per m³ per 20mm', amount: 5.00, unit: 'per m³ per 20mm' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 15,
    name: 'Handling, Mixing & Washout Fee',
    code: 'HMWASH',
    category: 'service_fee',
    description: 'Fee for the handling, mixing and washout of prescribed additives, special aggregates, oxides and fibres, per m³.',
    rates: [
      { label: 'Per m³', amount: 15.00, unit: '/ m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 16,
    name: 'Temperature Control',
    code: 'TEMP',
    category: 'service_fee',
    description: 'Concrete supplied is not guaranteed to comply with temperature requirements of a specification. Temperature control can be supplied.',
    rates: [
      { label: 'Price on Application', amount: null, unit: 'POA' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 17,
    name: 'Accelerator',
    code: 'ACCEL',
    category: 'service_fee',
    description: 'Accelerator additive for concrete.',
    rates: [
      { label: 'Low Dose', amount: 6.00, unit: '/ m³' },
      { label: 'Medium Dose', amount: 9.00, unit: '/ m³' },
      { label: 'High Dose', amount: 12.00, unit: '/ m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 18,
    name: 'Retarder',
    code: 'RETARD',
    category: 'service_fee',
    description: 'Retarder additive for concrete.',
    rates: [
      { label: 'Low Dose', amount: 6.00, unit: '/ m³' },
      { label: 'Medium Dose', amount: 9.00, unit: '/ m³' },
      { label: 'High Dose', amount: 12.00, unit: '/ m³' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const MOCK_TESTING_FEES: TestingFee[] = [
  {
    id: 101,
    name: 'Standard Concrete Cylinder Test (Set of 3)',
    code: 'GLSTD',
    category: 'testing_fee',
    description: 'Standard concrete three (3) 100mm cylinder test AS 1012.1, 3.1, 8.1, 9 & 12.1',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 215.00, code: 'GLSTD', unit: 'per set of 3' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 330.00, code: 'GLSTD1', unit: 'per set of 3' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 275.00, code: 'GLSTD2', unit: 'per set of 3' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 440.00, code: 'GLSTD3', unit: 'per set of 3' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 102,
    name: 'Extra Single Cylinder Specimen',
    code: 'GLCYL',
    category: 'testing_fee',
    description: 'Extra Single (1) 100mm cylinder specimen AS 1012.1, 3.1, 8.1, 9 & 12.1',
    rates: [
      { period: 'normal', period_label: 'All Hours', amount: 70.00, code: 'GLCYL', unit: 'per cylinder' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 103,
    name: 'One Day Cured Cylinder – Next Day Results',
    code: 'GL1DCYL',
    category: 'testing_fee',
    description: 'One day or site cured single (1) 100mm cylinder – Next Day Results AS 1012.1, 3.1, 8.1, 9 & 12.1',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 165.00, code: 'GL1DCYL', unit: 'per cylinder' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 253.00, code: 'GL1DCYL1', unit: 'per cylinder' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 215.00, code: 'GL1DCYL2', unit: 'per cylinder' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 340.00, code: 'GL1DCYL3', unit: 'per cylinder' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 104,
    name: 'Additional Slump Test',
    code: 'GLSLUMP',
    category: 'testing_fee',
    description: 'Additional Slump test (When already on site) AS 1012.3.1',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 45.00, code: 'GLSLUMP', unit: 'per slump test' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 60.00, code: 'GLSLUMP1', unit: 'per slump test' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 50.00, code: 'GLSLUMP2', unit: 'per slump test' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 80.00, code: 'GLSLUMP3', unit: 'per slump test' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 105,
    name: 'Flexural Strength Beam Test',
    code: 'GL100FX',
    category: 'testing_fee',
    description: 'Flexural Strength 100 × 100 × 3500mm per beam AS 1012.1, 3, 8.2, 11',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 209.00, code: 'GL100FX', unit: 'per beam' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 320.00, code: 'GL100FX1', unit: 'per beam' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 265.00, code: 'GL100FX2', unit: 'per beam' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 425.00, code: 'GL100FX3', unit: 'per beam' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 106,
    name: 'Drying Shrinkage Test',
    code: 'GLSHRNK',
    category: 'testing_fee',
    description: 'Drying Shrinkage test (one set of 3 prisms) AS 1012.13',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 605.00, code: 'GLSHRNK', unit: 'per set of 3' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 880.00, code: 'GLSHRNK1', unit: 'per set of 3' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 730.00, code: 'GLSHRNK2', unit: 'per set of 3' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 1160.00, code: 'GLSHRNK3', unit: 'per set of 3' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 107,
    name: 'Spread Test Only',
    code: 'GLSPRED',
    category: 'testing_fee',
    description: 'Spread test only Z40 CIA Method (Cylinders/specimens)',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 80.00, code: 'GLSPRED', unit: 'per test' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 160.00, code: 'GLSPRED1', unit: 'per test' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 120.00, code: 'GLSPRED2', unit: 'per test' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 240.00, code: 'GLSPRED3', unit: 'per test' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 108,
    name: 'Air Content Determination',
    code: 'GLAIR',
    category: 'testing_fee',
    description: 'Air Content Determination AS 1012.4',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 215.00, code: 'GLAIR', unit: 'per air test' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 275.00, code: 'GLAIR1', unit: 'per air test' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 225.00, code: 'GLAIR2', unit: 'per air test' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 365.00, code: 'GLAIR3', unit: 'per air test' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 109,
    name: 'Test Cancellation Fee',
    code: 'GLCANCL',
    category: 'testing_fee',
    description: 'Applies to testing cancelled after 3pm the previous workday.',
    rates: [
      { period: 'normal', period_label: 'Mon–Fri 6am–4pm', amount: 330.00, code: 'GLCANCL', unit: 'per cancellation' },
      { period: 'after_hours_1', period_label: 'Mon–Fri 4pm–6am / Sat 12pm–midnight', amount: 550.00, code: 'GLCANCL1', unit: 'per cancellation' },
      { period: 'after_hours_2', period_label: 'Sat 6am–12pm', amount: 440.00, code: 'GLCANCL2', unit: 'per cancellation' },
      { period: 'after_hours_3', period_label: 'Sundays & Public Holidays', amount: 550.00, code: 'GLCANCL3', unit: 'per cancellation' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 110,
    name: 'Operational Fee (Lab)',
    code: 'GLOPEN',
    category: 'testing_fee',
    description: 'Applies where the laboratory is required to operate outside normal work hours.',
    rates: [
      { period: 'normal', period_label: 'All Periods', amount: 930.00, code: 'GLOPEN', unit: 'per request' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 111,
    name: 'Re-issue of Test Report',
    code: 'GLREISS',
    category: 'testing_fee',
    description: 'Re-issue of Test Report at customer request.',
    rates: [
      { period: 'normal', period_label: 'All Periods', amount: 27.00, code: 'GLREISS', unit: 'per report' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 112,
    name: 'Trial Mix Fee',
    code: 'GLTRIAL',
    category: 'testing_fee',
    description: 'Trial Mix Fee (Associated concrete tests are not included in this fee)',
    rates: [
      { period: 'normal', period_label: 'All Periods', amount: null, code: 'GLTRIAL', unit: 'POA' },
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// ===========================
// API Functions
// ===========================

/**
 * TODO: Replace mock implementations with actual API calls when backend is ready.
 * Expected endpoints:
 *   GET    /api/admin/surcharges
 *   PUT    /api/admin/surcharges/:id
 *   PATCH  /api/admin/surcharges/:id/toggle
 */

export const surchargesAPI = {
  /**
   * Fetch all surcharges (service fees + testing fees)
   */
  getSurcharges: async (): Promise<SurchargesResponse> => {
    // TODO: Replace with actual API call
    // const response = await api.get('/admin/surcharges');
    // return response.data;

    // Mock delay to simulate API
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        service_fees: MOCK_SERVICE_FEES,
        testing_fees: MOCK_TESTING_FEES,
      },
    };
  },

  /**
   * Update a surcharge's rates
   */
  updateSurcharge: async (
    id: number,
    payload: UpdateSurchargePayload
  ): Promise<UpdateSurchargeResponse> => {
    // TODO: Replace with actual API call
    // const response = await api.put(`/admin/surcharges/${id}`, payload);
    // return response.data;

    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log(id, payload);
    return {
      success: true,
      message: 'Surcharge updated successfully',
      data: {} as any,
    };
  },

  /**
   * Toggle surcharge active/inactive
   */
  toggleSurcharge: async (
    id: number,
    payload: ToggleSurchargePayload
  ): Promise<UpdateSurchargeResponse> => {
    // TODO: Replace with actual API call
    // const response = await api.patch(`/admin/surcharges/${id}/toggle`, payload);
    // return response.data;

    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(id);
    return {
      success: true,
      message: `Surcharge ${payload.is_active ? 'activated' : 'deactivated'} successfully`,
      data: {} as any,
    };
  },
};