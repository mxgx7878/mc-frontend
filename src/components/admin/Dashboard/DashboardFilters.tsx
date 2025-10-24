// FILE PATH: src/components/admin/Dashboard/DashboardFilters.tsx

/**
 * Dashboard Filters Component
 * Date range, granularity, and other filter controls
 */

import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import type { DashboardFilters } from '../../../api/handlers/adminDashboard.api';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFilterChange: (filters: Partial<DashboardFilters>) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const DashboardFiltersBar: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const handleDateChange = (type: 'from' | 'to', value: string) => {
    onFilterChange({ [type]: value });
  };

  const handleGranularityChange = (granularity: 'day' | 'week' | 'month') => {
    onFilterChange({ granularity });
  };

  const handleQuickDate = (range: string) => {
    const today = new Date();
    let from = new Date();
    
    switch (range) {
      case 'today':
        from = new Date(today);
        break;
      case '7days':
        from = new Date(today.setDate(today.getDate() - 7));
        break;
      case '30days':
        from = new Date(today.setDate(today.getDate() - 30));
        break;
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        from = new Date(today.getFullYear(), 0, 1);
        break;
    }

    onFilterChange({
      from: from.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filters.from || ''}
                onChange={(e) => handleDateChange('from', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filters.to || ''}
                onChange={(e) => handleDateChange('to', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Granularity */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Granularity
            </label>
            <select
              value={filters.granularity || 'day'}
              onChange={(e) => handleGranularityChange(e.target.value as 'day' | 'week' | 'month')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickDate('today')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => handleQuickDate('7days')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            7 Days
          </button>
          <button
            onClick={() => handleQuickDate('30days')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            30 Days
          </button>
          <button
            onClick={() => handleQuickDate('month')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            This Month
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardFiltersBar;
