import { Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-nb-surface dark:bg-neutral-900 border-b-2 border-nb-border dark:border-neutral-500 no-print">
      <div className="w-full max-w-[1220px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-nb-accent" />
            <span className="font-extrabold text-lg text-nb-ink dark:text-neutral-100">
              CurriculoFit
            </span>
          </div>
          <span className="bg-nb-accent text-white text-[10px] font-bold px-2 py-0.5 border-2 border-nb-border dark:border-neutral-500 rounded-brutal shadow-brutal-sm uppercase tracking-wider">
            Beta
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
