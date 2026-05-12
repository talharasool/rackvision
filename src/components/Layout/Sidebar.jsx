import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Home, Map, ArrowLeft } from 'lucide-react';

export default function Sidebar({ inspectionId, currentArea }) {
  const { t } = useTranslation();

  const navItems = [
    { to: 'dashboard', label: t('common.dashboard'), icon: Home },
    { to: 'areas', label: t('inspection.working_areas_page_title'), icon: Map },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-full border-r border-slate-800 flex flex-col">
      {/* Navigation links */}
      <nav className="flex-1 py-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={`/inspection/${inspectionId}/${to}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Back to Home */}
      <div className="border-t border-slate-800 p-4">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-150"
        >
          <ArrowLeft size={18} />
          {t('common.back_to_home')}
        </NavLink>
      </div>
    </aside>
  );
}
