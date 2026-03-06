// FILE PATH: src/pages/admin/Surcharges/SurchargesList.tsx

/**
 * Admin Surcharges Management — Clean v2
 * 
 * Features:
 * - Pill tabs: Service Fees | Testing Fees
 * - Clean row layout with toggle, name, rates summary
 * - Click row → opens detail drawer with full reference/explanation
 * - Edit button → opens rate editing modal
 * - Search filter
 */

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
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import EditSurchargeModal from '../../../components/admin/Surcharges/EditSurchargeModal';
import SurchargeDetailDrawer from '../../../components/admin/Surcharges/SurchargeDetailDrawer';
import { useSurcharges, useUpdateSurcharge, useToggleSurcharge } from '../../../features/surcharges/hooks';
import { getMenuItemsByRole } from '../../../utils/menuItems';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Surcharge, TestingFee, SurchargeRate, TestingFeeRate } from '../../../types/surcharge.types';

type TabType = 'service_fees' | 'testing_fees';

const SurchargesList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('service_fees');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSurcharge, setEditingSurcharge] = useState<Surcharge | TestingFee | null>(null);
  const [viewingSurcharge, setViewingSurcharge] = useState<Surcharge | TestingFee | null>(null);

  const { role } = usePermissions();
  const menuItems = getMenuItemsByRole(role);

  const { data, isLoading, error, refetch } = useSurcharges();
  const updateMutation = useUpdateSurcharge();
  const toggleMutation = useToggleSurcharge();

  const serviceFees = data?.data?.service_fees || [];
  const testingFees = data?.data?.testing_fees || [];

  // Filtered lists
  const filteredServiceFees = useMemo(() => {
    if (!searchQuery.trim()) return serviceFees;
    const q = searchQuery.toLowerCase();
    return serviceFees.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [serviceFees, searchQuery]);

  const filteredTestingFees = useMemo(() => {
    if (!searchQuery.trim()) return testingFees;
    const q = searchQuery.toLowerCase();
    return testingFees.filter(
      (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
    );
  }, [testingFees, searchQuery]);

  // Handlers
  const handleToggle = (e: React.MouseEvent, id: number, currentStatus: boolean) => {
    e.stopPropagation();
    toggleMutation.mutate({ surchargeId: id, payload: { is_active: !currentStatus } });
  };

  const handleEditClick = (e: React.MouseEvent, surcharge: Surcharge | TestingFee) => {
    e.stopPropagation();
    setEditingSurcharge(surcharge);
  };

  const handleEditSave = (id: number, rates: SurchargeRate[] | TestingFeeRate[]) => {
    updateMutation.mutate(
      { surchargeId: id, payload: { rates } },
      { onSuccess: () => setEditingSurcharge(null) }
    );
  };

  const formatAmount = (amount: number | null): string => {
    if (amount === null) return 'POA';
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get summary rate text for a service fee (show primary rate)
  const getServiceFeeSummary = (fee: Surcharge): string => {
    const first = fee.rates[0];
    if (!first) return '';
    if (first.amount === null) return 'Price on Application';
    return `${formatAmount(first.amount)} ${first.unit}`;
  };

  // ==================== SERVICE FEES LIST ====================
  const renderServiceFees = () => {
    if (filteredServiceFees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileText size={40} className="mb-3 opacity-50" />
          <p className="text-sm font-medium text-gray-500">No service fees found</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {filteredServiceFees.map((fee) => (
          <div
            key={fee.id}
            onClick={() => setViewingSurcharge(fee)}
            className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/80 transition-colors group ${
              !fee.is_active ? 'opacity-40' : ''
            }`}
          >
            {/* Toggle */}
            <button
              onClick={(e) => handleToggle(e, fee.id, fee.is_active)}
              disabled={toggleMutation.isPending}
              className="flex-shrink-0 relative w-10 h-[22px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1"
              style={{ backgroundColor: fee.is_active ? '#22c55e' : '#d1d5db' }}
            >
              <span
                className="absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform"
                style={{ transform: fee.is_active ? 'translateX(18px)' : 'translateX(0)' }}
              />
            </button>

            {/* Name & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{fee.name}</h4>
                {fee.rates.length > 1 && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded">
                    {fee.rates.length} rates
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5 max-w-lg">{fee.description}</p>
            </div>

            {/* Rate Summary */}
            <div className="flex-shrink-0 text-right hidden sm:block">
              <span className="text-sm font-bold text-gray-900 tabular-nums">
                {getServiceFeeSummary(fee)}
              </span>
              {fee.rates.length > 1 && (
                <p className="text-[11px] text-gray-400">
                  +{fee.rates.length - 1} more
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => handleEditClick(e, fee)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit rates"
              >
                <Pencil size={15} />
              </button>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ==================== TESTING FEES TABLE ====================
  const renderTestingFees = () => {
    if (filteredTestingFees.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FlaskConical size={40} className="mb-3 opacity-50" />
          <p className="text-sm font-medium text-gray-500">No testing fees found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-10" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Test Type
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                <div>Normal Hours</div>
                <div className="font-normal normal-case text-[10px] text-gray-300">Mon–Fri 6am–4pm</div>
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                <div>After Hours 1</div>
                <div className="font-normal normal-case text-[10px] text-gray-300">Mon–Fri 4pm–6am</div>
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                <div>After Hours 2</div>
                <div className="font-normal normal-case text-[10px] text-gray-300">Sat 6am–12pm</div>
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                <div>After Hours 3</div>
                <div className="font-normal normal-case text-[10px] text-gray-300">Sun & Public Hols</div>
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTestingFees.map((fee) => {
              const rateMap: Record<string, TestingFeeRate | undefined> = {};
              fee.rates.forEach((r) => { rateMap[r.period] = r; });
              const isSingleRate = fee.rates.length === 1 && fee.rates[0].period === 'normal';

              return (
                <tr
                  key={fee.id}
                  onClick={() => setViewingSurcharge(fee)}
                  className={`cursor-pointer hover:bg-slate-50/80 transition-colors group ${
                    !fee.is_active ? 'opacity-40' : ''
                  }`}
                >
                  {/* Toggle */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => handleToggle(e, fee.id, fee.is_active)}
                      disabled={toggleMutation.isPending}
                      className="flex-shrink-0 relative w-10 h-[22px] rounded-full transition-colors focus:outline-none"
                      style={{ backgroundColor: fee.is_active ? '#22c55e' : '#d1d5db' }}
                    >
                      <span
                        className="absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform"
                        style={{ transform: fee.is_active ? 'translateX(18px)' : 'translateX(0)' }}
                      />
                    </button>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{fee.name}</p>
                    <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{fee.description}</p>
                  </td>

                  {/* Rate columns */}
                  {isSingleRate ? (
                    <td colSpan={4} className="px-4 py-3.5 text-center">
                      <span className={`text-sm font-bold tabular-nums ${
                        fee.rates[0].amount === null ? 'text-amber-600' : 'text-gray-900'
                      }`}>
                        {formatAmount(fee.rates[0].amount)}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-1">{fee.rates[0].unit}</span>
                    </td>
                  ) : (
                    <>
                      {(['normal', 'after_hours_1', 'after_hours_2', 'after_hours_3'] as const).map((period) => {
                        const rate = rateMap[period];
                        return (
                          <td key={period} className="px-4 py-3.5 text-center">
                            {rate ? (
                              <span className={`text-sm font-bold tabular-nums ${
                                rate.amount === null ? 'text-amber-600' : 'text-gray-900'
                              }`}>
                                {formatAmount(rate.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </>
                  )}

                  {/* Action */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditClick(e, fee)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit rates"
                      >
                        <Pencil size={14} />
                      </button>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
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
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        {/* Tabs + Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-0 flex-wrap gap-3">
            {/* Pill Tabs */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {[
                { id: 'service_fees' as TabType, label: 'Service Fees', icon: FileText, count: serviceFees.length },
                { id: 'testing_fees' as TabType, label: 'Testing Fees', icon: FlaskConical, count: testingFees.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={15} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 text-[11px] font-semibold rounded ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Content */}
          <div className="mt-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" size={32} />
                  <p className="text-sm text-gray-400">Loading surcharges...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle size={36} className="text-red-400 mb-3" />
                <p className="text-sm font-medium text-red-600 mb-1">Failed to load surcharges</p>
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
          </div>

          {/* Footer info */}
          {!isLoading && !error && (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
              <Info size={12} className="text-gray-300" />
              <p className="text-[11px] text-gray-400">
                Click any row to view full details and reference information · Source: Holcim SEQ · Effective 1 Jan 2026
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <SurchargeDetailDrawer
        surcharge={viewingSurcharge}
        isOpen={!!viewingSurcharge}
        onClose={() => setViewingSurcharge(null)}
        onEdit={(s) => {
          setViewingSurcharge(null);
          setEditingSurcharge(s);
        }}
      />

      {/* Edit Modal */}
      <EditSurchargeModal
        surcharge={editingSurcharge}
        isOpen={!!editingSurcharge}
        onClose={() => setEditingSurcharge(null)}
        onSave={handleEditSave}
        isSaving={updateMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default SurchargesList;