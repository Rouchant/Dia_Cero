import React from 'react';

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="Dia Cero Logo"
      className={`object-contain mix-blend-normal ${className}`}
    />
  );
}
