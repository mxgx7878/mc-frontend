// FILE PATH: src/components/common/StatusBadge.tsx

/**
 * StatusBadge Component
 * 
 * Displays approval status as a badge with toggle functionality.
 * - Green badge for "Active" (is_approved = 1)
 * - Red badge for "Inactive" (is_approved = 0)
 * - Optional: Click to toggle status (with confirmation)
 */

import React from 'react';

interface StatusBadgeProps {
  isApproved: boolean;
  onToggle?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  isApproved, 
  onToggle, 
  loading = false,
  disabled = false 
}) => {
  const handleClick = () => {
    if (onToggle && !disabled && !loading) {
      onToggle();
    }
  };

  const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2";
  const interactiveClasses = onToggle && !disabled 
    ? "cursor-pointer hover:opacity-80 transition-opacity" 
    : "";
  
  const statusClasses = isApproved
    ? "bg-green-100 text-green-800 border border-green-300"
    : "bg-red-100 text-red-800 border border-red-300";

  return (
    <span 
      className={`${baseClasses} ${statusClasses} ${interactiveClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      title={onToggle ? 'Click to toggle status' : ''}
    >
      <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-red-500'}`}></span>
      {loading ? (
        <span className="animate-pulse">Processing...</span>
      ) : (
        <span>{isApproved ? 'Active' : 'Inactive'}</span>
      )}
    </span>
  );
};

export default StatusBadge;