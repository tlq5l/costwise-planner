import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UnitSystem = "metric" | "imperial";

interface UnitSystemContextType {
  unitSystem: UnitSystem;
  toggleUnitSystem: () => void;
  setUnitSystem: (system: UnitSystem) => void;
}

const UnitSystemContext = createContext<UnitSystemContextType | undefined>(undefined);

// Storage key for persisting preference
const STORAGE_KEY = "floor_plan_analyzer_unit_system";

export function UnitSystemProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, otherwise default to metric (Vietnamese)
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    const savedSystem = localStorage.getItem(STORAGE_KEY);
    // Explicitly set default to metric if no saved preference
    return (savedSystem === "imperial") ? "imperial" : "metric";
  });

  // Persist to localStorage whenever unitSystem changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, unitSystem);
  }, [unitSystem]);

  const toggleUnitSystem = () => {
    setUnitSystemState((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  const setUnitSystem = (system: UnitSystem) => {
    setUnitSystemState(system);
  };

  return (
    <UnitSystemContext.Provider value={{ unitSystem, toggleUnitSystem, setUnitSystem }}>
      {children}
    </UnitSystemContext.Provider>
  );
}

export function useUnitSystem() {
  const context = useContext(UnitSystemContext);
  if (context === undefined) {
    throw new Error("useUnitSystem must be used within a UnitSystemProvider");
  }
  return context;
}