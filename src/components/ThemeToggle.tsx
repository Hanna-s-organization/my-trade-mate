import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full bg-secondary hover:bg-accent"
      onClick={() => setDark(!dark)}
      title={dark ? 'Світла тема' : 'Темна тема'}
    >
      {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
