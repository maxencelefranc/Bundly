import React, { createContext, useContext } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

type ScrollCtx = { y: SharedValue<number> };

const Ctx = createContext<ScrollCtx | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const y = useSharedValue(0);
  return <Ctx.Provider value={{ y }}>{children}</Ctx.Provider>;
}

export function useScrollY() {
  const ctx = useContext(Ctx);
  // Fallback shared value so FloatingNav can work even without a provider
  const fallback = useSharedValue(0);
  return (ctx?.y ?? fallback);
}
