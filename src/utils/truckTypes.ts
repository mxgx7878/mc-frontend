// src/utils/truckTypes.ts
/**
 * TRUCK TYPE CONFIGURATION
 *
 * Two categories based on product unit_of_measure:
 * A) Concrete trucks (unit = m³)
 * B) All other materials (unit = tonnes / t)
 *
 * Auto-selection logic:
 * - Picks the SMALLEST truck that can carry the slot quantity
 * - If quantity exceeds largest truck, selects the largest available
 * - Client CANNOT manually override the selection
 */

export interface TruckType {
  value: string;
  label: string;
  maxCapacity: number;
}

// A) Concrete trucks (unit = m³)
export const CONCRETE_TRUCK_TYPES: TruckType[] = [
  { value: 'mini_mix', label: 'Mini-mix (max 2.4 m³)', maxCapacity: 2.4 },
  { value: '6_wheeler', label: '6 Wheeler (max 5.4 m³)', maxCapacity: 5.4 },
  { value: '8_wheeler', label: '8 Wheeler (max 7.0 m³)', maxCapacity: 7.0 },
  { value: '10_wheeler', label: '10 Wheeler (max 8.0 m³)', maxCapacity: 8.0 },
];

// B) All other materials (unit = tonnes)
export const GENERAL_TRUCK_TYPES: TruckType[] = [
  { value: 'mini_truck', label: 'Mini Truck (max 2.4 t)', maxCapacity: 2.4 },
  { value: 'small_truck', label: 'Small Truck (max 4.5 t)', maxCapacity: 4.5 },
  { value: 'body_truck', label: 'Body Truck (max 12 t)', maxCapacity: 12 },
  { value: '8_wheeler', label: '8 Wheeler (max 15 t)', maxCapacity: 15 },
  { value: 'truck_and_dog', label: 'Truck and Dog (max 32 t)', maxCapacity: 32 },
];

/**
 * Check if product uses concrete trucks (m³ unit)
 */
export const isConcrete = (unitOfMeasure: string): boolean => {
  const unit = unitOfMeasure?.toLowerCase().trim() || '';
  return unit.includes('m³') || unit.includes('m3') || unit.includes('cubic');
};

/**
 * Get the correct truck type list based on unit of measure
 */
export const getTruckTypesForUnit = (unitOfMeasure: string): TruckType[] => {
  return isConcrete(unitOfMeasure) ? CONCRETE_TRUCK_TYPES : GENERAL_TRUCK_TYPES;
};

/**
 * Auto-select the appropriate truck type based on quantity
 *
 * Logic: Pick the smallest truck whose maxCapacity >= quantity
 * If quantity exceeds all trucks, pick the largest one
 */
export const autoSelectTruckType = (quantity: number, unitOfMeasure: string): string => {
  const truckTypes = getTruckTypesForUnit(unitOfMeasure);

  // Find smallest truck that can carry the quantity
  const suitable = truckTypes.find((t) => t.maxCapacity >= quantity);

  // If no truck is big enough, return the largest available
  if (!suitable) {
    return truckTypes[truckTypes.length - 1].value;
  }

  return suitable.value;
};

/**
 * Get truck label by value and unit
 */
export const getTruckLabel = (value: string, unitOfMeasure: string): string => {
  const truckTypes = getTruckTypesForUnit(unitOfMeasure);
  return truckTypes.find((t) => t.value === value)?.label || value;
};