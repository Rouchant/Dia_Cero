import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="Dia Cero Logo"
      className={cn("h-12 w-auto object-contain mix-blend-normal", className)}
    />
  );
}
