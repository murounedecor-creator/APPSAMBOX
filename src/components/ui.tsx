import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#eef2f9] transition-colors">
            <X size={20} className="text-[#62718c]" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-sm',
    secondary: 'bg-[#eef2f9] text-[#1e293b] hover:bg-[#e2e8f0]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    ghost: 'text-[#62718c] hover:bg-[#eef2f9]',
    success: 'bg-[#0ea5e9] text-white hover:bg-[#0284c7] shadow-sm',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff] transition-all"
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Selecione...',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff] transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg border border-[#cbd5e1] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff]/40 focus:border-[#00d9ff] transition-all resize-none"
      />
    </div>
  );
}

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-[#eef2f9] text-[#475569]',
    amber: 'bg-[#0e7490]/10 text-[#0e7490]',
    blue: 'bg-[#2563eb]/10 text-[#2563eb]',
    green: 'bg-[#0ea5e9]/10 text-[#0284c7]',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-[#7c3aed]/10 text-[#7c3aed]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof X; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#eef2f9] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[#94a3b8]" />
      </div>
      <p className="text-[#475569] font-medium">{title}</p>
      {subtitle && <p className="text-[#94a3b8] text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-[#bae6fd] border-t-[#00d9ff] rounded-full animate-spin" />
    </div>
  );
}
