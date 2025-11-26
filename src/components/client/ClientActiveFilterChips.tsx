// src/components/client/ClientActiveFilterChips.tsx

import React from 'react';
import { X } from 'lucide-react';
import type { ProjectFilter } from '../../types/clientOrder.types';

interface ClientActiveFilterChipsProps {
  filters: {
    project_id: string;
    order_status: string;
    payment_status: string;
    delivery_date: string;
    delivery_method: string;
    repeat_order: string;
  };
  onFilterChange: (key: string, value: string) => void;
  projects: ProjectFilter[];
}

const ClientActiveFilterChips: React.FC<ClientActiveFilterChipsProps> = ({
  filters,
  onFilterChange,
  projects,
}) => {
  const activeFilters: Array<{ key: string; label: string; value: string }> = [];

  if (filters.project_id) {
    const project = projects.find((p) => p.id.toString() === filters.project_id);
    if (project) {
      activeFilters.push({
        key: 'project_id',
        label: 'Project',
        value: project.name,
      });
    }
  }

  if (filters.order_status) {
    activeFilters.push({
      key: 'order_status',
      label: 'Status',
      value: filters.order_status,
    });
  }

  if (filters.payment_status) {
    activeFilters.push({
      key: 'payment_status',
      label: 'Payment',
      value: filters.payment_status,
    });
  }

  if (filters.delivery_date) {
    activeFilters.push({
      key: 'delivery_date',
      label: 'Delivery Date',
      value: new Date(filters.delivery_date).toLocaleDateString(),
    });
  }

  if (filters.delivery_method) {
    activeFilters.push({
      key: 'delivery_method',
      label: 'Method',
      value: filters.delivery_method,
    });
  }

  if (filters.repeat_order) {
    activeFilters.push({
      key: 'repeat_order',
      label: 'Type',
      value: filters.repeat_order === 'true' ? 'Repeat Orders' : 'New Orders',
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
        >
          <span className="font-semibold">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={() => onFilterChange(filter.key, '')}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ClientActiveFilterChips;