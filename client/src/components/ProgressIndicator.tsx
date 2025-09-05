interface ProgressIndicatorProps {
  currentStep: 'email' | 'camera' | 'processing' | 'success' | 'error';
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'camera', label: 'Photo', icon: '📸' },
    { key: 'processing', label: 'Submit', icon: '⏳' },
    { key: 'success', label: 'Done', icon: '✅' }
  ];

  const getCurrentStepIndex = () => {
    if (currentStep === 'error') return -1; // Don't show progress on error
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  if (currentStep === 'error' || currentStep === 'success') {
    return null; // Don't show progress indicator on final states
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.slice(0, 3).map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                index <= currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentIndex ? '✓' : step.icon}
            </div>
            <span
              className={`ml-2 text-xs font-medium ${
                index <= currentIndex ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 2 && (
              <div
                className={`mx-4 h-0.5 w-8 transition-all duration-300 ${
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}