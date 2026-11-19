import { cn } from '@/src/lib/utils';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ name, photoURL, size = 'sm', className }: AvatarProps) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn(
          'rounded-full border border-[#E5E7EB] object-cover shrink-0 bg-[#F7F8FA]',
          SIZE_CLASSES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F7F8FA] font-semibold text-[#171923] shrink-0',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
