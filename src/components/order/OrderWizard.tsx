// src/components/order/OrderWizard.tsx
import React from 'react';
import { ShoppingCart, MapPin, CheckCircle } from 'lucide-react';


interface OrderWizardProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
}

const steps = [
  { number: 1, title: 'Products', icon: ShoppingCart, description: 'Select items' },
  { number: 2, title: 'Details', icon: MapPin, description: 'Project & delivery' },
  { number: 3, title: 'Review', icon: CheckCircle, description: 'Confirm order' },
];

const OrderWizard: React.FC<OrderWizardProps> = ({ currentStep, onStepChange, children }) => {
  return (
    <div className="space-y-6">
      {/* Progress Steps - Mobile & Desktop */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        {/* Desktop: Horizontal Steps */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.number}>
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => {
                      // Only allow going back to previous steps
                      if (step.number < currentStep) {
                        onStepChange(step.number);
                      }
                    }}
                    disabled={step.number > currentStep}
                    className={`
                      flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all
                      ${isActive 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                        : isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-secondary-300 text-secondary-400'
                      }
                      ${step.number < currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                    `}
                  >
                    <Icon size={24} />
                  </button>
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${isActive ? 'text-primary-600' : 'text-secondary-600'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-secondary-500">{step.description}</p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 transition-all ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-secondary-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile: Vertical Steps */}
        <div className="md:hidden space-y-4">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  isActive ? 'bg-primary-50 border-2 border-primary-300' : 'bg-secondary-50'
                }`}
              >
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                    ${isActive 
                      ? 'bg-primary-600 border-primary-600 text-white' 
                      : isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'bg-white border-secondary-300 text-secondary-400'
                    }
                  `}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${isActive ? 'text-primary-600' : 'text-secondary-900'}`}>
                    Step {step.number}: {step.title}
                  </p>
                  <p className="text-xs text-secondary-600">{step.description}</p>
                </div>
                {isCompleted && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-fadeIn">
        {children}
      </div>
    </div>
  );
};

export default OrderWizard;