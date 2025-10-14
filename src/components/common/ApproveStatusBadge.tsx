// FILE PATH: src/components/common/ApprovalStatusBadge.tsx
import React from "react";

export type BadgeStatus = "Pending" | "Approved" | "Rejected";

interface ApprovalStatusBadgeProps {
  status: BadgeStatus;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const ApproveStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({
  status,
  onClick,
  loading = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (onClick && !disabled && !loading) onClick();
  };

  const base = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 border";
  const interactive = onClick && !disabled ? "cursor-pointer hover:opacity-80 transition-opacity" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  const statusStyles: Record<typeof status, string> = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Approved: "bg-green-100 text-green-800 border-green-300",
    Rejected: "bg-red-100 text-red-800 border-red-300",
  };

  const dotColor: Record<typeof status, string> = {
    Pending: "bg-yellow-500",
    Approved: "bg-green-500",
    Rejected: "bg-red-500",
  };

  return (
    <span
      className={`${base} ${statusStyles[status]} ${interactive} ${disabledClass}`}
      onClick={handleClick}
      title={onClick ? "Click to update status" : ""}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor[status]}`} />
      {loading ? <span className="animate-pulse">Processing...</span> : <span>{status}</span>}
    </span>
  );
};

export default ApproveStatusBadge;
