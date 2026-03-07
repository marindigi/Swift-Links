import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, theme = 'light' }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        theme === 'dark' ? "bg-white/10" : "bg-gray-200",
        className
      )}
    />
  );
};
