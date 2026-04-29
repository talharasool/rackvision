import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ inspectionName }) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <span
        className="text-xl font-bold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        RackVision
      </span>

      {inspectionName && (
        <span className="text-sm text-slate-400 truncate ml-4">
          {inspectionName}
        </span>
      )}
    </header>
  );
}
