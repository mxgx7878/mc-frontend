// FILE PATH: src/components/admin/Dashboard/AlertsSection.tsx

/**
 * Alerts Section Component
 * Displays system alerts and notifications
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Alert } from '../../../api/handlers/adminDashboard.api';

interface AlertsSectionProps {
  alerts: Alert[];
  loading: boolean;
  onDismiss?: (index: number) => void;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts, loading, onDismiss }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertConfig = (type: Alert['type']) => {
    const configs = {
      error: {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      },
      warning: {
        icon: AlertTriangle,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
      },
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
      },
    };
    return configs[type] || configs.info;
  };

  const getPriorityBadge = (priority: Alert['priority']) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[priority];
  };

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => {
        const config = getAlertConfig(alert.type);
        const Icon = config.icon;

        return (
          <div
            key={index}
            className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className={`${config.textColor} font-medium text-sm`}>
                      {alert.message}
                    </p>
                    
                    {/* Action Button */}
                    {alert.action_url && (
                      <button
                        onClick={() => navigate(alert.action_url)}
                        className={`${config.textColor} text-sm font-semibold mt-2 hover:underline`}
                      >
                        View Details →
                      </button>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(index)}
                      className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertsSection;
