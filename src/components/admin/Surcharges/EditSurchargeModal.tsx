// FILE PATH: src/components/admin/Surcharges/EditSurchargeModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Percent, Package, FileText, Hash } from 'lucide-react';
import type { Surcharge, TestingFee, UpdateSurchargePayload, UpdateTestingFeePayload } from '../../../types/surcharge.types';

interface EditSurchargeModalProps {
  item: Surcharge | TestingFee | null;
  type: 'surcharge' | 'testing_fee';
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, payload: UpdateSurchargePayload | UpdateTestingFeePayload) => void;
  isSaving: boolean;
}

interface FormState {
  name: string;
  description: string;
  conditions: string;
  worked_example: string;
  billing_code: string;
  amount: string;
  amount_type: 'fixed' | 'percentage';
  applies_to: string;
}

const APPLIES_TO_OPTIONS = ['All Products', 'Concrete', 'Aggregates', 'Sand', 'Other'];

const EditSurchargeModal: React.FC<EditSurchargeModalProps> = ({
  item,
  type,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    conditions: '',
    worked_example: '',
    billing_code: '',
    amount: '',
    amount_type: 'fixed',
    applies_to: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        description: item.description || '',
        conditions: item.conditions || '',
        worked_example: item.worked_example || '',
        billing_code: item.billing_code || '',
        amount: String(item.amount ?? ''),
        amount_type: item.amount_type || 'fixed',
        applies_to: type === 'surcharge' ? ((item as Surcharge).applies_to || '') : '',
      });
    }
  }, [item, type]);

  if (!isOpen || !item) return null;

  const isSurcharge = type === 'surcharge';

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload: UpdateSurchargePayload = {
      name: form.name.trim() || undefined,
      description: form.description.trim() || null,
      conditions: form.conditions.trim() || null,
      worked_example: form.worked_example.trim() || null,
      billing_code: form.billing_code.trim() || null,
      amount: form.amount ? parseFloat(form.amount) : undefined,
      amount_type: form.amount_type,
      ...(isSurcharge && { applies_to: form.applies_to.trim() || null }),
    };
    onSave(item.id, payload);
  };

  const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';
  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-white';
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-4 ${isSurcharge ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-purple-600 to-violet-600'}`}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <h3 className="text-base font-bold text-white truncate">{item.name}</h3>
              <p className="text-xs text-white/70 mt-0.5">
                Edit {isSurcharge ? 'service fee' : 'testing fee'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} className="text-white/80" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">

          {/* Name */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><FileText size={11} /> Name</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
              placeholder="Surcharge name"
            />
          </div>

          {/* Amount + Amount Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5">
                  {form.amount_type === 'fixed' ? <DollarSign size={11} /> : <Percent size={11} />}
                  Amount
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  {form.amount_type === 'fixed' ? '$' : '%'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <div className="flex gap-2 mt-1">
                {(['fixed', 'percentage'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleChange('amount_type', t)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      form.amount_type === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t === 'fixed' ? '$ Fixed' : '% Rate'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applies To — surcharge only */}
          {isSurcharge && (
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><Package size={11} /> Applies To</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {APPLIES_TO_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChange('applies_to', opt)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      form.applies_to === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Billing Code */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><Hash size={11} /> Billing Code</span>
            </label>
            <input
              type="text"
              value={form.billing_code}
              onChange={(e) => handleChange('billing_code', e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="e.g. SQ-001"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={textareaClass}
              placeholder="Brief description of this surcharge..."
            />
          </div>

          {/* Conditions */}
          <div>
            <label className={labelClass}>When It Applies (Conditions)</label>
            <textarea
              rows={3}
              value={form.conditions}
              onChange={(e) => handleChange('conditions', e.target.value)}
              className={textareaClass}
              placeholder="Describe when this surcharge is triggered..."
            />
          </div>

          {/* Worked Example */}
          <div>
            <label className={labelClass}>Worked Example</label>
            <textarea
              rows={3}
              value={form.worked_example}
              onChange={(e) => handleChange('worked_example', e.target.value)}
              className={`${textareaClass} font-mono text-xs`}
              placeholder="e.g. Order 0.5m³ → Base $210 + Surcharge $45 = Total $255 (excl. GST)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isSurcharge ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSurchargeModal;