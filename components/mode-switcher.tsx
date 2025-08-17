'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';
import { MoonStarIcon } from '@/components/tiptap-icons/moon-star-icon';
import { SunIcon } from '@/components/tiptap-icons/sun-icon';
import { Button } from '@/components/ui/button';
export function ModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      className="group/toggle extend-touch-target size-8 cursor-pointer"
      onClick={toggleTheme}
      size="icon"
      title="Toggle theme"
      variant="ghost"
    >
      {resolvedTheme === 'dark' ? <SunIcon /> : <MoonStarIcon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
