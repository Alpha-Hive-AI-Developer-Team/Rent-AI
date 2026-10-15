"use client";

import React from "react";

type ProtectionGaugeProps = {
  daysRemaining: number;
  totalDays?: number;
  size?: number;
  strokeWidth?: number;
};

export default function ProtectionGauge({
  daysRemaining,
  totalDays = 60,
  size = 140,
  strokeWidth = 10,
}: ProtectionGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, daysRemaining / totalDays));
  const strokeDashoffset = circumference - progressRatio * circumference;

  let strokeColor = "#027A48"; // Rent AI primary emerald green
  if (daysRemaining <= 7) {
    strokeColor = "#DC2626"; // Muted red for urgency
  } else if (daysRemaining <= 20) {
    strokeColor = "#D97706"; // Amber
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E1E1E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-white tracking-tight">{daysRemaining}</span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Days Left</span>
      </div>
    </div>
  );
}
