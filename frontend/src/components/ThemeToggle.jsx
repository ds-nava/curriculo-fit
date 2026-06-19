import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="nb-btn w-10 h-10 flex items-center justify-center bg-nb-surface dark:bg-neutral-800 dark:text-neutral-100"
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {dark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300" />
      )}
    </button>
  );
}
