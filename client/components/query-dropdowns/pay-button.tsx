'use client';

interface PayButtonProps {
  fee?: string;
  className?: string;
}

export function PayButton({ fee = '0.025', className = '' }: PayButtonProps) {
  return (
    <button
      className={`border-none cursor-pointer bg-[#347745] text-foreground px-5 py-2.5 rounded font-semibold hover:opacity-90 transition-opacity ${className}`}
    >
      Pay {fee} USDC
    </button>
  );
}

