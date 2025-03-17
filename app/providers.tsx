"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
export function Providers({ children }: { children: React.ReactNode }) {

  return (
    <Provider store={store}>
      <TooltipProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TooltipProvider>
    </Provider>
  );
}