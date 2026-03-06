// FILE PATH: src/components/admin/Surcharges/EditSurchargeModal.tsx

/**
 * Edit Surcharge Modal — Clean v2
 * Handles editing rates for both service_fee and testing_fee types.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Surcharge, TestingFee, SurchargeRate, TestingFeeRate } from '../../../types/surcharge.types';

interface EditSurchargeModalProps {
  surcharge: Surcharge | TestingFee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, rates: SurchargeRate[] | TestingFeeRate[]) => void;
  isSaving: boolean;
}

const EditSurchargeModal: React.FC<EditSurchargeModalProps> = ({
  surcharge,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [editedRates, setEditedRates] = useState<(SurchargeRate | TestingFeeRate)[]>([]);

  useEffect(() => {
    if (surcharge) {
      setEditedRates(JSON.parse(JSON.stringify(surcharge.rates)));
    }
  }, [surcharge]);

  if (!isOpen || !surcharge) return null;

  const isTestingFee = surcharge.category === 'testing_fee';

  const handleRateChange = (index: number, value: string) => {
    const updated = [...editedRates];
    const numValue = value === '' ? null : parseFloat(value);
    updated[index] = { ...updated[index], amount: numValue };
    setEditedRates(updated);
  };

  const handleSave = () => {
    if (isTestingFee) {
      onSave(surcharge.id, editedRates as TestingFeeRate[]);
    } else {
      onSave(surcharge.id, editedRates as SurchargeRate[]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <h3 className="text-base font-bold text-gray-900 truncate">{surcharge.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Edit pricing rates</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-2">
          {editedRates.map((rate, index) => {
            const label = isTestingFee
              ? (rate as TestingFeeRate).period_label
              : (rate as SurchargeRate).label;

            const isPOA = rate.amount === null && (rate.unit === 'POA' || rate.unit === 'P.O.A.');

            return (
              <div key={index} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{label}</p>
                  <p className="text-[11px] text-gray-400">{rate.unit !== 'POA' ? rate.unit : ''}</p>
                </div>

                {isPOA ? (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg">
                    POA
                  </span>
                ) : (
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rate.amount ?? ''}
                      onChange={(e) => handleRateChange(index, e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-right font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSurchargeModal;