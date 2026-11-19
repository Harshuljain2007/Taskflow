import type { InputHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#171923] placeholder:text-[#6B7280] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BDB] focus-visible:border-[#635BDB] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
