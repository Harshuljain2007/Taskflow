import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#171923] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BDB] focus-visible:border-[#635BDB] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
