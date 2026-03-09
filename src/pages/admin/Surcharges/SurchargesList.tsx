// FILE PATH: src/pages/admin/Surcharges/SurchargesList.tsx

import React, { useState, useMemo } from 'react';
import {
  Search,
  Pencil,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  FlaskConical,
  Info,
  ChevronRight,
  Package,
  Tag,
  Percent,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import EditSurchargeModal from '../../../components/admin/Surcharges/EditSurchargeModal';
import SurchargeDetailDrawer from '../../../components/admin/Surcharges/SurchargeDetailDrawer';
import {
  useSurcharges,
  useTestingFees,
  useUpdateSurcharge,
  useToggleSurcharge,
  useUpdateTestingFee,
  useToggleTestingFee,
} from '../../../features/surcharges/hooks';
import { getMenuItemsByRole } from '../../../utils/menuItems';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Surcharge, TestingFee, UpdateSurchargePayload, UpdateTestingFeePayload } from '../../../types/surcharge.types';

type TabType = 'service_fees' | 'testing_fees';

// ==================== HELPERS ====================

const formatAmount = (amount: number, amount_type: 'fixed' | 'percentage'): string => {
  if (amount_type === 'percentage') {
    return `${amount}%`;
  }
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const APPLIES_TO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Concrete':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  'All Products': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const getAppliesToStyle = (applies_to: string | null) => {
  if (!applies_to) return null;
  return APPLIES_TO_COLORS[applies_to] || { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
};

// ==================== TOGGLE SWITCH ====================

const ToggleSwitch: React.FC<{
  isActive: boolean;
  isPending: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ isActive, isPending, onClick }) => (
  <button
    onClick={onClick}
    disabled={isPending}
    className="flex-shrink-0 relative w-10 h-[22px] rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 disabled:opacity-50"
    style={{ backgroundColor: isActive ? '#22c55e' : '#cbd5e1' }}
  >
    <span
      className="absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200"
      style={{ transform: isActive ? 'translateX(18px)' : 'translateX(0)' }}
    />
  </button>
);

// ==================== MAIN COMPONENT ====================

const SurchargesList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('service_fees');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<Surcharge | TestingFee | null>(null);
  const [editingType, setEditingType] = useState<'surcharge' | 'testing_fee'>('surcharge');
  const [viewingItem, setViewingItem] = useState<Surcharge | TestingFee | null>(null);
  const [viewingType, setViewingType] = useState<'surcharge' | 'testing_fee'>('surcharge');

  const { role } = usePermissions();
  const menuItems = getMenuItemsByRole(role);

  const {
    data: surchargesData,
    isLoading: surchargesLoading,
    error: surchargesError,
    refetch: refetchSurcharges,
  } = useSurcharges();

  const {
    data: testingFeesData,
    isLoading: testingFeesLoading,
    error: testingFeesError,
    refetch: refetchTestingFees,
  } = useTestingFees();

  const updateSurchargeMutation = useUpdateSurcharge();
  const toggleSurchargeMutation = useToggleSurcharge();
  const updateTestingFeeMutation = useUpdateTestingFee();
  const toggleTestingFeeMutation = useToggleTestingFee();

  const surcharges: Surcharge[] = surchargesData?.data || [];
  const testingFees: TestingFee[] = testingFeesData?.data || [];

  const isLoading = activeTab === 'service_fees' ? surchargesLoading : testingFeesLoading;
  const error = activeTab === 'service_fees' ? surchargesError : testingFeesError;
  const refetch = activeTab === 'service_fees' ? refetchSurcharges : refetchTestingFees;

  // Filtered lists
  const filteredSurcharges = useMemo(() => {
    if (!searchQuery.trim()) return surcharges;
    const q = searchQuery.toLowerCase();
    return surcharges.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.billing_code?.toLowerCase().includes(q)) ||
        (s.applies_to?.toLowerCase().includes(q))
    );
  }, [surcharges, searchQuery]);

  const filteredTestingFees = useMemo(() => {
    if (!searchQuery.trim()) return testingFees;
    const q = searchQuery.toLowerCase();
    return testingFees.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.billing_code?.toLowerCase().includes(q))
    );
  }, [testingFees, searchQuery]);

  // Handlers
  const handleToggleSurcharge = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    toggleSurchargeMutation.mutate(id);
  };

  const handleToggleTestingFee = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    toggleTestingFeeMutation.mutate(id);
  };

  const handleEditSurcharge = (e: React.MouseEvent, item: Surcharge) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditingType('surcharge');
  };

  const handleEditTestingFee = (e: React.MouseEvent, item: TestingFee) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditingType('testing_fee');
  };

  const handleSave = (id: number, payload: UpdateSurchargePayload | UpdateTestingFeePayload) => {
    if (editingType === 'surcharge') {
      updateSurchargeMutation.mutate(
        { id, payload: payload as UpdateSurchargePayload },
        { onSuccess: () => setEditingItem(null) }
      );
    } else {
      updateTestingFeeMutation.mutate(
        { id, payload: payload as UpdateTestingFeePayload },
        { onSuccess: () => setEditingItem(null) }
      );
    }
  };

  const isSaving = updateSurchargeMutation.isPending || updateTestingFeeMutation.isPending;

  // ==================== SERVICE FEES LIST ====================
  const renderServiceFees = () => {
    if (filteredSurcharges.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500">No service fees found</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-2">
        {filteredSurcharges.map((fee) => {
          const appliesToStyle = getAppliesToStyle(fee.applies_to);
          return (
            <div
              key={fee.id}
              onClick={() => { setViewingItem(fee); setViewingType('surcharge'); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all group
                ${fee.is_active
                  ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
                }`}
            >
              {/* Toggle */}
              <ToggleSwitch
                isActive={fee.is_active}
                isPending={toggleSurchargeMutation.isPending}
                onClick={(e) => handleToggleSurcharge(e, fee.id)}
              />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900">{fee.name}</h4>
                  {/* Applies To badge */}
                  {appliesToStyle && fee.applies_to && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${appliesToStyle.bg} ${appliesToStyle.text} ${appliesToStyle.border}`}>
                      <Package size={9} />
                      {fee.applies_to}
                    </span>
                  )}
                  {/* Billing code */}
                  {fee.billing_code && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold rounded">
                      {fee.billing_code}
                    </span>
                  )}
                </div>
                {fee.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-lg">{fee.description}</p>
                )}
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  {fee.amount_type === 'percentage' ? (
                    <Percent size={13} className="text-indigo-400" />
                  ) : (
                    <span className="text-xs text-gray-400">$</span>
                  )}
                  <span className="text-sm font-bold text-gray-900 tabular-nums">
                    {formatAmount(fee.amount, fee.amount_type)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {fee.amount_type === 'fixed' ? 'Fixed fee' : 'Of delivery cost'}
                </p>
              </div>

              {/* Actions — always visible, not hidden behind hover */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => handleEditSurcharge(e, fee)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Edit surcharge"
                >
                  <Pencil size={15} />
                </button>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ==================== TESTING FEES LIST ====================
  const renderTestingFees = () => {
    if (filteredTestingFees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FlaskConical size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-medium text-gray-500">No testing fees found</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-2">
        {filteredTestingFees.map((fee) => (
          <div
            key={fee.id}
            onClick={() => { setViewingItem(fee); setViewingType('testing_fee'); }}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all group
              ${fee.is_active
                ? 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/20 shadow-sm'
                : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
              }`}
          >
            {/* Toggle */}
            <ToggleSwitch
              isActive={fee.is_active}
              isPending={toggleTestingFeeMutation.isPending}
              onClick={(e) => handleToggleTestingFee(e, fee.id)}
            />

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-900">{fee.name}</h4>
                {fee.billing_code && (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold rounded">
                    {fee.billing_code}
                  </span>
                )}
              </div>
              {fee.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-lg">{fee.description}</p>
              )}
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                {fee.amount_type === 'percentage' ? (
                  <Percent size={13} className="text-indigo-400" />
                ) : (
                  <span className="text-xs text-gray-400">$</span>
                )}
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {formatAmount(fee.amount, fee.amount_type)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">per test</p>
            </div>

            {/* Actions — always visible */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => handleEditTestingFee(e, fee)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit testing fee"
              >
                <Pencil size={15} />
              </button>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <DashboardLayout menuItems={menuItems}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Surcharges</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage service fees and testing charges · Prices excl. GST
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tabs + Search */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
            {/* Pill Tabs */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              {[
                { id: 'service_fees' as TabType, label: 'Service Fees', icon: FileText, count: surcharges.length },
                { id: 'testing_fees' as TabType, label: 'Testing Fees', icon: FlaskConical, count: testingFees.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-md ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Legend for service fees tab */}
          {activeTab === 'service_fees' && !isLoading && !error && filteredSurcharges.length > 0 && (
            <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Applies to:</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  <Package size={9} /> Concrete
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Tag size={9} /> All Products
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-500 mr-3" size={28} />
              <p className="text-sm text-gray-400">Loading...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle size={36} className="text-red-400 mb-3" />
              <p className="text-sm font-medium text-red-600 mb-1">Failed to load</p>
              <p className="text-xs text-gray-400 mb-3">{(error as Error)?.message}</p>
              <button onClick={() => refetch()} className="text-sm text-blue-600 hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'service_fees' && renderServiceFees()}
              {activeTab === 'testing_fees' && renderTestingFees()}
            </>
          )}

          {/* Footer */}
          {!isLoading && !error && (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <Info size={12} className="text-gray-300 flex-shrink-0" />
              <p className="text-[11px] text-gray-400">
                Click any row to view full details · All prices exclude GST
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <SurchargeDetailDrawer
        item={viewingItem}
        type={viewingType}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={(item, type) => {
          setViewingItem(null);
          setEditingItem(item);
          setEditingType(type);
        }}
      />

      {/* Edit Modal */}
      <EditSurchargeModal
        item={editingItem}
        type={editingType}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </DashboardLayout>
  );
};

export default SurchargesList;