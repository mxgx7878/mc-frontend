// FILE PATH: src/components/admin/Surcharges/SurchargeDetailDrawer.tsx

import React from 'react';
import {
  X,
  Info,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Package,
  Pencil,
  Hash,
  Percent,
} from 'lucide-react';
import type { Surcharge, TestingFee } from '../../../types/surcharge.types';

interface SurchargeDetailDrawerProps {
  item: Surcharge | TestingFee | null;
  type: 'surcharge' | 'testing_fee';
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: Surcharge | TestingFee, type: 'surcharge' | 'testing_fee') => void;
}

const formatAmount = (amount: number, amount_type: 'fixed' | 'percentage'): string => {
  if (amount_type === 'percentage') return `${amount}%`;
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const APPLIES_TO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Concrete':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  'All Products': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const SurchargeDetailDrawer: React.FC<SurchargeDetailDrawerProps> = ({
  item,
  type,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !item) return null;

  const isSurcharge = type === 'surcharge';
  const surcharge = isSurcharge ? (item as Surcharge) : null;
  const appliesToStyle = surcharge?.applies_to
    ? (APPLIES_TO_COLORS[surcharge.applies_to] || { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' })
    : null;

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
        <div className={`px-6 py-5 border-b border-gray-100 ${
          isSurcharge
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
            : 'bg-gradient-to-r from-purple-600 to-violet-600'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  item.is_active
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-black/20 text-white/70 border-white/20'
                }`}>
                  {item.is_active ? '● Active' : '○ Inactive'}
                </span>
                <span className="px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-semibold rounded-full border border-white/20">
                  {isSurcharge ? 'Service Fee' : 'Testing Fee'}
                </span>
                {item.billing_code && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-mono font-semibold rounded-full border border-white/20">
                    <Hash size={9} />
                    {item.billing_code}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">{item.name}</h2>
              {/* Applies to — only for service fees */}
              {surcharge?.applies_to && appliesToStyle && (
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border bg-white/15 text-white border-white/25`}>
                    <Package size={11} />
                    Applies to: {surcharge.applies_to}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} className="text-white/80" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Amount Block */}
          <div className="px-6 py-5 bg-gray-50/60 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Fee Amount</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 tabular-nums">
                    {formatAmount(item.amount, item.amount_type)}
                  </span>
                  <span className="text-sm text-gray-400">
                    {item.amount_type === 'percentage' ? 'of delivery cost' : 'flat fee'}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${isSurcharge ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {item.amount_type === 'percentage'
                  ? <Percent size={22} className={isSurcharge ? 'text-blue-600' : 'text-purple-600'} />
                  : <DollarSign size={22} className={isSurcharge ? 'text-blue-600' : 'text-purple-600'} />
                }
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Info size={15} className="text-gray-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Conditions */}
          {item.conditions && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">When It Applies</h3>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <p className="text-sm text-emerald-800 leading-relaxed">{item.conditions}</p>
              </div>
            </div>
          )}

          {/* Worked Example */}
          {item.worked_example && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={15} className="text-amber-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Worked Example</h3>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-900 font-mono leading-relaxed">{item.worked_example}</p>
              </div>
            </div>
          )}

          {/* Applies To detail — for service fees */}
          {surcharge?.applies_to && appliesToStyle && (
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Package size={15} className="text-blue-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Scope</h3>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-xl border ${appliesToStyle.bg} ${appliesToStyle.text} ${appliesToStyle.border}`}>
                <Package size={14} />
                {surcharge.applies_to}
              </span>
            </div>
          )}

          {/* GST Notice */}
          <div className="px-6 py-5">
            <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
              <AlertTriangle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                All prices shown <strong>exclude 10% GST</strong>. GST is calculated at the invoice level.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit(item, type); }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${
              isSurcharge ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

export default SurchargeDetailDrawer;