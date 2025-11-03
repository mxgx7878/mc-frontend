// FILE PATH: src/components/ui/tooltip.tsx

/**
 * Simple Custom Tooltip Component (No Dependencies)
 * A lightweight alternative to Radix UI Tooltip
 */

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

// Context for tooltip state
const TooltipContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  delayDuration: number;
}>({
  isOpen: false,
  setIsOpen: () => {},
  delayDuration: 200,
});

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ 
  children, 
  delayDuration = 200 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ 
  children, 
  asChild 
}) => {
  const { setIsOpen, delayDuration } = React.useContext(TooltipContext);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    });
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
    </div>
  );
};

export const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  side = 'top',
  className = '' 
}) => {
  const { isOpen } = React.useContext(TooltipContext);

  if (!isOpen) return null;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`
        absolute z-50 
        px-3 py-1.5 
        text-sm text-white 
        bg-gray-900 
        border border-gray-700 
        rounded-lg 
        shadow-lg
        whitespace-nowrap
        animate-in fade-in-0 zoom-in-95
        ${positionClasses[side]}
        ${className}
      `}
      style={{
        animation: 'fadeIn 0.15s ease-in-out',
      }}
    >
      {children}
      
      {/* Arrow */}
      <div
        className={`
          absolute w-2 h-2 bg-gray-900 border border-gray-700
          transform rotate-45
          ${side === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' : ''}
          ${side === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' : ''}
          ${side === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' : ''}
          ${side === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0' : ''}
        `}
      />
    </div>
  );
};

// Add fadeIn animation to global styles or tailwind config
// If you're using Tailwind, add this to your tailwind.config.js:
// 
// module.exports = {
//   theme: {
//     extend: {
//       keyframes: {
//         fadeIn: {
//           '0%': { opacity: '0', transform: 'scale(0.95)' },
//           '100%': { opacity: '1', transform: 'scale(1)' },
//         },
//       },
//       animation: {
//         fadeIn: 'fadeIn 0.15s ease-in-out',
//       },
//     },
//   },
// }