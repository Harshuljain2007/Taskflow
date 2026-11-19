import { Menu, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useUiStore } from '@/src/stores/uiStore';

interface TopNavProps {
  onVerifyClick: () => void;
}

const NAV_ITEMS = [
  { label: 'Architecture', href: '#architecture' },
  { label: 'Modules', href: '#modules' },
  { label: 'Design System', href: '#design-system' },
  { label: 'Connectivity', href: '#connectivity' },
];

export function TopNav({ onVerifyClick }: TopNavProps) {
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUiStore();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-6">
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-[#171923] whitespace-nowrap shrink-0"
        >
          TaskFlow
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6B7280]"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#171923] hover:underline underline-offset-4"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block">
            <Button size="sm" onClick={onVerifyClick}>
              Check Health
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={toggleMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#171923] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[#E5E7EB] bg-white px-6 py-4 md:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="py-2 text-sm font-medium text-[#171923] hover:text-[#635BDB]"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onVerifyClick();
                }}
              >
                Check Health
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
