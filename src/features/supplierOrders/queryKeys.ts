// src/features/supplierOrders/queryKeys.ts

export const supplierOrderKeys = {
  all: ['supplierOrders'] as const,
  lists: () => [...supplierOrderKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...supplierOrderKeys.lists(), params] as const,
  details: () => [...supplierOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierOrderKeys.details(), id] as const,
};