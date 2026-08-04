"use client";

import { createContext, useContext } from "react";

interface DemoContextValue {
  isDemo: boolean;
}

export const DemoContext = createContext<DemoContextValue>({ isDemo: false });

export function useDemoMode() {
  return useContext(DemoContext);
}
