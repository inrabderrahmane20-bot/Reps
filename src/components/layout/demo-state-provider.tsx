'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  DemoState,
  initialDemoState,
  readDemoState,
  writeDemoState,
} from '@/lib/demo-store';

const DemoStateContext = createContext<{
  state: DemoState;
  setState: (next: DemoState) => void;
}>({ state: initialDemoState, setState: () => undefined });

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateValue] = useState(initialDemoState);

  useEffect(() => {
    const sync = () => setStateValue(readDemoState());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('medina-demo-state-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('medina-demo-state-change', sync);
    };
  }, []);

  function setState(next: DemoState) {
    setStateValue(next);
    writeDemoState(next);
  }

  return <DemoStateContext.Provider value={{ state, setState }}>{children}</DemoStateContext.Provider>;
}

export function useDemoState() {
  return useContext(DemoStateContext);
}