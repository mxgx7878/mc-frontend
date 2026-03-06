// FILE PATH: src/features/surcharges/queryKeys.ts

export const surchargeKeys = {
  all: ['surcharges'] as const,
  lists: () => [...surchargeKeys.all, 'list'] as const,
  list: () => [...surchargeKeys.lists()] as const,
};