'use client';

interface PaymentToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function PaymentToggle({ value, onChange }: PaymentToggleProps) {
  const handleToggle = () => {
    onChange(!value);
  };

  // value = false means payments NOT required (red/left)
  // value = true means payments required (green/right)
  const isRequiringPayments = value;

  return (
    <div className="flex items-center gap-3">
      {/* Text label - left of button */}
      <span className="text-foreground">
        Require x402 payments to query widgets, tables or data.
      </span>
      
      {/* Sliding button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-5 w-[48px] items-center rounded-full overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        role="switch"
        aria-checked={isRequiringPayments}
        aria-label="Toggle payment requirement"
      >
        {/* Background color changes based on selection */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isRequiringPayments ? 'bg-[#347745]' : 'bg-[#DF3441]'
          }`}
        />
        
        {/* Sliding button - circular */}
        <span
          className={`absolute h-4 w-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out z-20 ${
            isRequiringPayments ? 'translate-x-[32px]' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

