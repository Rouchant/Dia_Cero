"use client";
import React, { useState } from 'react';

export function Logo({ className = "h-8", variant = "default" }: { className?: string, variant?: "default" | "white" }) {
  const [imgError, setImgError] = useState(false);

  const isWhite = variant === "white";
  const textColor = isWhite ? "#ffffff" : "#2563EB";
  const swoopColor = isWhite ? "#ffffff" : "#2563EB";
  const dotColor = isWhite ? "#ffffff" : "#EA580C";

  if (!imgError) {
    return (
      <img
        src="/logo.png"
        alt="Dia Cero Logo"
        className={`object-contain ${className} ${isWhite ? "brightness-0 invert" : ""}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg 
      className={className} 
      viewBox="0 0 330 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue Dot above 'i' */}
      <circle cx="95" cy="28" r="4.5" fill={swoopColor} />
      
      {/* Arc connecting from 'i' to 'o' */}
      <path d="M 106 20 Q 195 -12 288 38" stroke={swoopColor} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      
      {/* Main Text */}
      <text x="10" y="90" fontFamily="system-ui, -apple-system, sans-serif" fontSize="78" fontWeight="400" fill={textColor} letterSpacing="-1.5">Dia Cero</text>
      
      {/* Orange Bullseye Dot inside 'o' */}
      <circle cx="286" cy="66" r="11" fill={dotColor} />
    </svg>
  );
}
