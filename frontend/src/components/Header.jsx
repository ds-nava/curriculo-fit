import ThemeToggle from './ThemeToggle';

function LogoIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 4h14l6 6v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" className="text-white dark:text-neutral-800" />
      <path d="M6 4h14l6 6v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" className="dark:stroke-neutral-400" />
      <path d="M20 4v6h6" fill="#dee8f3" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" className="dark:fill-neutral-700 dark:stroke-neutral-400" />
      <path d="M15 15l1.2-3.5L17.4 15l3.5 1.2-3.5 1.2L16.2 21l-1.2-3.5L11.5 16.2z" fill="#84a2ca" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" className="dark:stroke-neutral-400" />
      <line x1="8" y1="21" x2="14" y2="21" stroke="#000000" strokeWidth="2" strokeLinecap="round" className="dark:stroke-neutral-400" />
      <line x1="8" y1="25" x2="18" y2="25" stroke="#000000" strokeWidth="2" strokeLinecap="round" className="dark:stroke-neutral-400" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-nb-surface dark:bg-neutral-900 border-b-2 border-nb-border dark:border-neutral-500 no-print">
      <div className="w-full max-w-[1220px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-7 h-7" />
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
