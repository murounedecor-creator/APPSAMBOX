import { useState } from 'react';
import { Crown, ClipboardList, Wrench, ChevronDown } from 'lucide-react';
import { useRole } from '@/lib/RoleContext';
import { ROLE_LABELS, type Role } from '@/lib/supabase';

const ROLE_ICONS: Record<Role, typeof Crown> = {
  owner: Crown,
  manager: ClipboardList,
  technician: Wrench,
};

const ROLE_COLORS: Record<Role, string> = {
  owner: 'text-[#00d9ff] bg-[#0b2b55] border-[#0e7490]',
  manager: 'text-[#2563eb] bg-[#eef2f9] border-[#bfdbfe]',
  technician: 'text-[#0284c7] bg-[#e0f2fe] border-[#bae6fd]',
};

export function RoleSelector() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const Icon = ROLE_ICONS[role];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${ROLE_COLORS[role]} hover:shadow-md`}
      >
        <Icon size={18} />
        <span className="font-medium text-sm">{ROLE_LABELS[role]}</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e2e8f0] z-50 overflow-hidden">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => {
              const RIcon = ROLE_ICONS[r];
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    role === r ? 'bg-[#eef2f9] font-semibold' : 'hover:bg-[#eef2f9]'
                  }`}
                >
                  <RIcon size={18} className={ROLE_COLORS[r].split(' ')[0]} />
                  {ROLE_LABELS[r]}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
