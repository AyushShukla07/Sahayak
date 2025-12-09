import React from 'react';

export default function AdPlaceholder({ label, className = '', style = {} }: { label: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={`border-2 border-dashed border-gray-300 dark:border-white/30 bg-white/40 dark:bg-white/5 text-center p-4 rounded-md text-sm text-muted-foreground ${className}`}
      style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
    >
      {label}
    </div>
  );
}
