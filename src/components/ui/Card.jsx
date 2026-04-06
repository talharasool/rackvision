import React from 'react';

export default function Card({
  children,
  className = '',
  onClick,
  hover = false,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800/50 border border-slate-700 rounded-xl p-6
        ${
          hover
            ? 'hover:border-blue-500/50 hover:bg-slate-800 transition-colors duration-150 cursor-pointer'
            : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}
