// FILE PATH: src/components/common/FormulaTooltip.tsx

/**
 * Formula Tooltip Component
 * Shows formula on hover with a small info icon
 * Uses shadcn/ui Tooltip component
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface FormulaTooltipProps {
  formula: string;
  size?: number;
  className?: string;
}

/**
 * FormulaTooltip Component
 * 
 * @param formula - The formula to display in the tooltip
 * @param size - Size of the help icon (default: 16)
 * @param className - Additional CSS classes for the icon
 * 
 * @example
 * <FormulaTooltip formula="Total = Item Cost + Delivery - Discount" />
 */
const FormulaTooltip: React.FC<FormulaTooltipProps> = ({
  formula,
  size = 16,
  className = '',
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center transition-colors ${className}`}
          >
            <HelpCircle
              size={size}
              className="text-gray-400 hover:text-blue-500 cursor-help transition-colors"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-gray-900 text-white px-3 py-2 rounded-lg text-sm border border-gray-700"
        >
          <code className="font-mono text-xs whitespace-pre-wrap">{formula}</code>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FormulaTooltip;
