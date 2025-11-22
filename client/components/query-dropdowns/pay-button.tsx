'use client';

interface PayButtonProps {
  fee?: string;
  className?: string;
  onClick?: () => void;
}

export function PayButton({ fee = '0.025', className = '', onClick }: PayButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`border-none cursor-pointer bg-[#347745] text-white px-5 py-2.5 rounded font-semibold hover:opacity-90 transition-opacity ${className}`}
    >
      Pay {fee} USDC
    </button>
  );
}

