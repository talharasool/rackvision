import React from 'react';
import { Check } from 'lucide-react';

export default function WizardStep({
  title,
  description,
  children,
  stepNumber,
  totalSteps,
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === stepNumber;
          const isCompleted = step < stepNumber;

          return (
            <React.Fragment key={step}>
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  text-xs font-bold transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                        : 'bg-slate-700 text-slate-400'
                  }
                `}
              >
                {isCompleted ? <Check size={14} /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`
                    w-6 h-0.5 rounded-full transition-colors duration-200
                    ${isCompleted ? 'bg-green-600' : 'bg-slate-700'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Title & Description */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
}
