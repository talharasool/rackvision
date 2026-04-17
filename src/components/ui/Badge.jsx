import React from 'react';

const variantStyles = {
  success: 'bg-emerald-500/10 text-emerald-400 before:bg-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400 before:bg-amber-400',
  danger: 'bg-red-500/10 text-red-400 before:bg-red-400',
  info: 'bg-blue-500/10 text-blue-400 before:bg-blue-400',
  neutral: 'bg-gray-500/10 text-gray-400 before:bg-gray-400',
  accent: 'bg-accent/10 text-primary-light before:bg-accent',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:shrink-0
        ${variantStyles[variant] || variantStyles.neutral}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
