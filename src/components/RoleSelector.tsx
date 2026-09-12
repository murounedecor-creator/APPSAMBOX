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
  owner: 'text-amber-600 bg-amber-50 border-amber-200',
  manager: 'text-blue-600 bg-blue-50 border-blue-200',
  technician: 'text-emerald-600 bg-emerald-50 border-emerald-200',
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
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
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
                    role === r ? 'bg-gray-50 font-semibold' : 'hover:bg-gray-50'
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
