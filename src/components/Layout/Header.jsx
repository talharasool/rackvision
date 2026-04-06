import React from 'react';

export default function Header({ inspectionName }) {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <span className="text-xl font-bold text-blue-400">RackVision</span>

      {inspectionName && (
        <span className="text-sm text-slate-400 truncate ml-4">
          {inspectionName}
        </span>
      )}
    </header>
  );
}
