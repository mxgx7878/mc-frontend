import type { ClientOrderFilters } from '../../api/handlers/clientOrders.api';

export const clientOrderKeys = {
  all: ['client-orders'] as const,
  lists: () => [...clientOrderKeys.all, 'list'] as const,

  // Accept the actual filters type
  list: (filters: ClientOrderFilters) =>
    [...clientOrderKeys.lists(), { ...filters }] as const,

  details: () => [...clientOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientOrderKeys.details(), id] as const,
};
