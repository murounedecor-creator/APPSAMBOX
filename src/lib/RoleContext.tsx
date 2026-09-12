import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Role } from './supabase';

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  technicianId: string | null;
  setTechnicianId: (id: string | null) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('owner');
  const [technicianId, setTechnicianId] = useState<string | null>(null);

  return (
    <RoleContext.Provider value={{ role, setRole, technicianId, setTechnicianId }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
