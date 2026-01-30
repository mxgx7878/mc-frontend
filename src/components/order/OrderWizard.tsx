// FILE PATH: src/components/order/OrderWizard.tsx

/**
 * ORDER WIZARD - PROGRESS INDICATOR
 * 
 * UPDATED TO SUPPORT 4 STEPS:
 * 1. Products
 * 2. Delivery Details
 * 3. Schedule (NEW)
 * 4. Review
 * 
 * FEATURES:
 * - Visual progress bar
 * - Step numbers with icons
 * - Click to navigate (only to completed steps)
 * - Responsive design
 */

import React from 'react';
import { Check, ShoppingCart, MapPin, Calendar, FileCheck } from 'lucide-react';

interface Step {
  number: number;
  title: string;
}

interface OrderWizardProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  steps?: Step[];
  children: React.ReactNode;
}

const OrderWizard: React.FC<OrderWizardProps> = ({
  currentStep,
  onStepChange,
  steps,
  children,
}) => {
  /**
   * Default steps configuration
   * 
   * WHY: Allow parent component to customize steps if needed
   * WHAT: Default 4-step configuration for order creation
   */
  const defaultSteps: Step[] = [
    { number: 1, title: 'Products' },
    { number: 2, title: 'Delivery' },
    { number: 3, title: 'Schedule' },
    { number: 4, title: 'Review' },
  ];

  const wizardSteps = steps || defaultSteps;

  /**
   * Get icon for each step
   * 
   * WHY: Visual representation of step purpose
   * WHAT: Map step number to icon component
   */
  const getStepIcon = (stepNumber: number) => {
    const iconProps = { size: 20 };
    const icons: Record<number, React.ReactNode> = {
      1: <ShoppingCart {...iconProps} />,
      2: <MapPin {...iconProps} />,
      3: <Calendar {...iconProps} />,
      4: <FileCheck {...iconProps} />,
    };
    return icons[stepNumber] || <Check {...iconProps} />;
  };

  /**
   * Handle step click
   * 
   * WHAT: Allow navigation to previous steps only
   * WHY: Users should be able to go back and edit, but not skip ahead
   */
  const handleStepClick = (stepNumber: number) => {
    if (stepNumber < currentStep) {
      onStepChange(stepNumber);
    }
  };

  return (
    <div className="space-y-8">
      {/* Wizard Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-secondary-200" />

          {/* Active Progress Bar */}
          <div
            className="absolute top-6 left-0 h-1 bg-primary-600 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (wizardSteps.length - 1)) * 100}%`,
            }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {wizardSteps.map((step) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;
              const isClickable = step.number < currentStep;

              return (
                <div key={step.number} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <button
                    onClick={() => handleStepClick(step.number)}
                    disabled={!isClickable}
                    className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                      transition-all duration-300 
                      ${
                        isCompleted
                          ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                          : isActive
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-white border-2 border-secondary-300 text-secondary-400'
                      }
                      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    {isCompleted ? <Check size={24} /> : getStepIcon(step.number)}
                  </button>

                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isActive
                          ? 'text-primary-700'
                          : isCompleted
                          ? 'text-green-600'
                          : 'text-secondary-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">Step {step.number}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div>{children}</div>
    </div>
  );
};

export default OrderWizard;