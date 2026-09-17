import { CoachContext, useCoachState } from "../lib/coach";

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const value = useCoachState();
  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>;
}
