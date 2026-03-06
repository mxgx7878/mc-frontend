// FILE PATH: src/components/admin/Surcharges/SurchargeDetailDrawer.tsx

/**
 * Surcharge Detail Drawer
 * 
 * Slide-in panel showing full reference information for a surcharge.
 * Helps admin understand what each surcharge is, when it applies,
 * and the complete rate breakdown.
 */

import React from 'react';
import {
  X,
  Info,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import type { Surcharge, TestingFee } from '../../../types/surcharge.types';

interface SurchargeDetailDrawerProps {
  surcharge: Surcharge | TestingFee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (surcharge: Surcharge | TestingFee) => void;
}

// Reference data — explains when each surcharge applies
const SURCHARGE_REFERENCE: Record<string, {
  when_applies: string;
  conditions: string[];
  examples: string[];
  notes?: string;
}> = {
  WAIT: {
    when_applies: 'Charged when a concrete truck waits on-site beyond the free 30-minute window.',
    conditions: [
      'First 30 minutes of any delivery are free',
      'Normal hours rate: after 30 mins during Mon–Fri 6am–4pm',
      'After hours rate: after 30 mins outside normal operating hours',
    ],
    examples: [
      'Truck arrives at 9:00 AM, starts pouring at 9:45 AM → 15 mins waiting × $3.50 = $52.50',
      'Truck arrives Saturday 2 PM, waits 45 mins → 15 mins × $7.00 = $105.00',
    ],
  },
  ECART: {
    when_applies: 'Charged when the delivery site is more than 15 km from the nearest plant.',
    conditions: [
      'Only applies beyond 15 km radius from nearest plant',
      'Calculated per km per cubic metre delivered',
    ],
    examples: [
      'Site is 25 km from plant, 6m³ delivered → 10 km extra × $3.00 × 6m³ = $180.00',
    ],
  },
  MCART: {
    when_applies: 'Charged when less than 4m³ is delivered in a single load.',
    conditions: [
      'Applies to the undelivered portion of a 4m³ minimum',
      'Calculated on the shortfall below 4m³',
    ],
    examples: [
      '2.5m³ delivered → 1.5m³ undelivered × $90.00 = $135.00',
      '3.8m³ delivered → 0.2m³ undelivered × $90.00 = $18.00',
    ],
  },
  ENVL: {
    when_applies: 'Applied to every cubic metre of concrete delivered, no exceptions.',
    conditions: [
      'Applies per m³ or part thereof',
      'Applies to all deliveries regardless of size or time',
    ],
    examples: [
      '8m³ delivered → 8 × $2.50 = $20.00',
    ],
  },
  RETCON: {
    when_applies: 'Charged when concrete is returned unused to the plant.',
    conditions: [
      'Only applies to returned quantities of 1.0m³ or greater',
      'Charged per m³ or part thereof',
    ],
    examples: [
      '1.5m³ returned → 2 × $300.00 = $600.00 (rounded up to whole m³)',
    ],
  },
  AFTHRS: {
    when_applies: 'Charged for any delivery made outside normal operating hours (Mon–Fri 6am–4pm).',
    conditions: [
      'Does NOT apply to continuous pours that start before 1pm Mon–Fri and finish by 6pm',
      '7 different time brackets with escalating rates',
      'Saturday afternoon, Sunday, and Public Holidays attract highest rates',
    ],
    examples: [
      'Delivery on Wednesday at 5pm → $10.00/m³ (Tier 1)',
      'Delivery on Saturday at 3pm → $45.00/m³ (Tier 4)',
      'Delivery on Sunday → $90.00/m³ (Tier 6)',
    ],
    notes: 'The after-hours tiers are cumulative with the delivery — they apply per m³ on top of the concrete price.',
  },
  PLANTOP: {
    when_applies: 'Charged when the batching plant must open outside normal hours specifically for an order.',
    conditions: [
      'Minimum 48 hours notice required',
      'First 4-hour block is a flat fee per plant',
      'Each additional hour after the first 4 is charged separately',
      'After Normal Operating Hours surcharges also apply on top',
    ],
    examples: [
      'Plant opens Saturday for 3 hours → $2,500.00',
      'Plant opens Saturday for 6 hours → $2,500.00 + (2 × $500.00) = $3,500.00',
    ],
  },
  STBY: {
    when_applies: 'Charged when scheduled out-of-hours deliveries are cancelled, interrupted, or delayed by more than 1 hour.',
    conditions: [
      'Only applies to deliveries scheduled outside normal hours',
      'Delay must exceed 1 hour from scheduled start time',
      'Charged per truck per hour',
    ],
    examples: [
      '2 trucks on standby for 3 hours → 2 × 3 × $195.00 = $1,170.00',
    ],
  },
  CANCN: {
    when_applies: 'Charged when a normal-hours pour is cancelled or postponed by 3+ hours with insufficient notice.',
    conditions: [
      'Cancellation notice deadline: 12:00 PM, two working days before the pour',
      'Tiered by order volume',
      'Applies when cancelled OR postponed by 3 hours or more',
    ],
    examples: [
      '20m³ pour cancelled day before → $1,650.00 (Less than 75m³ tier)',
    ],
  },
  CANCAH: {
    when_applies: 'Same as normal-hours cancellation but for pours booked outside operating hours — higher penalties.',
    conditions: [
      'Same deadline: 12:00 PM, two working days before',
      'Higher rates than normal-hours cancellation',
      'Tiered by order volume',
    ],
    examples: [
      '20m³ after-hours pour cancelled late → $3,300.00',
    ],
  },
  BALLOAD: {
    when_applies: 'Charged for unplanned extra loads beyond the original order quantity.',
    conditions: [
      'Orders < 50m³: 1 free balance/plus load allowed',
      'Orders > 50m³: fee applies after 20% increase of order volume',
      'Each additional balance load is charged',
    ],
    examples: [
      '30m³ order, client requests 2 extra loads → 1 free + 1 × $150.00 = $150.00',
    ],
  },
  ADMIN: {
    when_applies: 'Charged for re-issuing paperwork or reviewing recordings at customer request.',
    conditions: [
      'Applies to additional copies of delivery dockets, invoices, or statements',
      'Also applies to review of call recordings',
    ],
    examples: [
      'Client requests 3 extra invoice copies → 3 × $50.00 = $150.00',
    ],
  },
  SMAGG: {
    when_applies: 'Premium charged when smaller aggregate sizes are used in the concrete mix.',
    conditions: [
      'Two tiers: 10mm and 7mm aggregates',
      'Covers higher production and cement costs for smaller aggregates',
    ],
    examples: [
      '10m³ with 7mm aggregate → 10 × $12.00 = $120.00',
    ],
  },
  SLUMP: {
    when_applies: 'Charged when client requests higher slump than standard 80mm.',
    conditions: [
      'Only for N Class Grades up to 40MPa',
      'Charged per 20mm increment above 80mm',
      'S Class and other mixes are POA (Price on Application)',
    ],
    examples: [
      '8m³ at 120mm slump (40mm over 80mm) → 8 × 2 × $5.00 = $80.00',
    ],
  },
  HMWASH: {
    when_applies: 'Charged when special additives, oxides, or fibres are added to the mix.',
    conditions: [
      'Covers handling, mixing, and washout costs',
      'Applies to oxides, fibres, special aggregates, and prescribed additives',
    ],
    examples: [
      '6m³ with oxide colour → 6 × $15.00 = $90.00',
    ],
  },
  TEMP: {
    when_applies: 'Applies when the client requires temperature-controlled concrete.',
    conditions: [
      'Standard concrete does NOT guarantee temperature compliance',
      'Must be specifically requested and quoted',
    ],
    examples: [
      'Price varies — contact supplier for quote',
    ],
    notes: 'This is always POA. Admin cannot set a fixed rate.',
  },
  ACCEL: {
    when_applies: 'Charged when accelerator additive is used to speed up setting time.',
    conditions: [
      'Three dose levels: Low, Medium, High',
      'Applied per cubic metre',
    ],
    examples: [
      '10m³ with medium dose accelerator → 10 × $9.00 = $90.00',
    ],
  },
  RETARD: {
    when_applies: 'Charged when retarder additive is used to slow down setting time.',
    conditions: [
      'Three dose levels: Low, Medium, High',
      'Applied per cubic metre',
      'Useful for long pours or hot weather conditions',
    ],
    examples: [
      '10m³ with high dose retarder → 10 × $12.00 = $120.00',
    ],
  },
  // Testing fees
  GLSTD: {
    when_applies: 'Standard compressive strength testing using three 100mm concrete cylinders.',
    conditions: [
      'Set of 3 cylinders per test',
      'Tested to AS 1012.1, 3.1, 8.1, 9 & 12.1',
      'Price varies by time of sampling',
    ],
    examples: [
      'Sampled during normal hours → $215.00 per set',
      'Sampled Sunday → $440.00 per set',
    ],
  },
  GLCYL: {
    when_applies: 'Additional individual cylinder specimen beyond the standard set of 3.',
    conditions: [
      'Single rate applies to all hours',
    ],
    examples: [
      '2 extra cylinders → 2 × $70.00 = $140.00',
    ],
  },
  GL1DCYL: {
    when_applies: 'Expedited single cylinder test with next-day results.',
    conditions: [
      'One-day or site-cured specimen',
      'Results available next business day',
      'Price varies by time of sampling',
    ],
    examples: [
      'Sampled normal hours → $165.00',
    ],
  },
  GLSLUMP: {
    when_applies: 'Additional slump test performed on site (when technician is already present).',
    conditions: [
      'Technician must already be on site',
      'Tested to AS 1012.3.1',
    ],
    examples: [
      'Extra slump test during normal hours → $45.00',
    ],
  },
  GL100FX: {
    when_applies: 'Flexural strength test using 100×100×3500mm concrete beams.',
    conditions: [
      'Tested to AS 1012.1, 3, 8.2, 11',
      'Price varies by time of sampling',
    ],
    examples: [
      '2 beams, normal hours → 2 × $209.00 = $418.00',
    ],
  },
  GLSHRNK: {
    when_applies: 'Drying shrinkage test using a set of 3 prisms.',
    conditions: [
      'Tested to AS 1012.13',
      'One set = 3 prisms',
    ],
    examples: [
      '1 set normal hours → $605.00',
    ],
  },
  GLSPRED: {
    when_applies: 'Spread/flow test for self-compacting or high-flow concrete.',
    conditions: [
      'Z40 CIA Method',
      'Uses cylinders/specimens',
    ],
    examples: [
      '1 test normal hours → $80.00',
    ],
  },
  GLAIR: {
    when_applies: 'Air content measurement in fresh concrete.',
    conditions: [
      'Tested to AS 1012.4',
      'Important for freeze-thaw durability specifications',
    ],
    examples: [
      '1 air test, Saturday morning → $225.00',
    ],
  },
  GLCANCL: {
    when_applies: 'Charged when scheduled testing is cancelled too late.',
    conditions: [
      'Cancellation deadline: 3pm the previous workday',
      'Price varies by when the testing was originally scheduled',
    ],
    examples: [
      'Normal hours test cancelled at 4pm day before → $330.00',
    ],
  },
  GLOPEN: {
    when_applies: 'Fee to open the laboratory outside normal working hours.',
    conditions: [
      'Single flat rate regardless of time period',
      'Applies per request',
    ],
    examples: [
      'Lab opens Saturday for testing → $930.00',
    ],
  },
  GLREISS: {
    when_applies: 'Fee to re-issue a previously provided test report.',
    conditions: [
      'Single flat rate',
      'Applies per re-issued report',
    ],
    examples: [
      '2 reports re-issued → 2 × $27.00 = $54.00',
    ],
  },
  GLTRIAL: {
    when_applies: 'Fee for conducting a trial concrete mix.',
    conditions: [
      'Price on Application — varies by mix complexity',
      'Associated concrete tests are NOT included',
    ],
    examples: [
      'Contact supplier for quote',
    ],
    notes: 'Always POA. Cannot be pre-priced.',
  },
};

const SurchargeDetailDrawer: React.FC<SurchargeDetailDrawerProps> = ({
  surcharge,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !surcharge) return null;

  const ref = SURCHARGE_REFERENCE[surcharge.code];
  const isTestingFee = surcharge.category === 'testing_fee';

  const formatAmount = (amount: number | null): string => {
    if (amount === null) return 'POA';
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  surcharge.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {surcharge.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono font-bold rounded uppercase tracking-wider">
                {surcharge.code}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {surcharge.name}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isTestingFee ? 'Testing Fee' : 'Service Fee'} • Effective 1 Jan 2026
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-1"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Description */}
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="text-sm text-gray-600 leading-relaxed">{surcharge.description}</p>
          </div>

          {/* Current Rates */}
          <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Current Rates</h3>
            </div>
            <div className="space-y-2">
              {surcharge.rates.map((rate, i) => {
                const label = isTestingFee
                  ? (rate as any).period_label
                  : (rate as any).label;
                const code = isTestingFee ? (rate as any).code : null;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50/80 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700">{label}</span>
                      {code && (
                        <span className="ml-2 px-1.5 py-0.5 bg-white text-gray-400 text-[10px] font-mono rounded border border-gray-100">
                          {code}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        rate.amount === null ? 'text-amber-600' : 'text-gray-900'
                      }`}
                    >
                      {formatAmount(rate.amount)}
                      {rate.amount !== null && (
                        <span className="text-xs font-normal text-gray-400 ml-1">{rate.unit}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Section */}
          {ref && (
            <>
              {/* When it applies */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">When It Applies</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{ref.when_applies}</p>
              </div>

              {/* Conditions */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Conditions</h3>
                </div>
                <ul className="space-y-2">
                  {ref.conditions.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-1.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              <div className="px-6 py-5 border-b border-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-orange-500" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Examples</h3>
                </div>
                <div className="space-y-2">
                  {ref.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="text-sm text-gray-700 bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2.5 font-mono leading-relaxed"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {ref.notes && (
                <div className="px-6 py-5 border-b border-gray-50">
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <AlertTriangle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed">{ref.notes}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* GST Notice */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <AlertTriangle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                All prices shown <strong>do not include 10% GST</strong>. GST is calculated separately at the order/invoice level.
                Source: Holcim Concrete Service Fee Summary — South East Queensland, Effective 1 Jan 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(surcharge);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <DollarSign size={14} />
            Edit Rates
          </button>
        </div>
      </div>
    </>
  );
};

export default SurchargeDetailDrawer;