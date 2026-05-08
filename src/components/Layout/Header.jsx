import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function Header({ inspectionName }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'it' : 'en');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <span
        className="text-xl font-bold text-blue-400 cursor-pointer hover:text-blue-300 transition-colors"
        onClick={() => navigate('/')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
      >
        {t('header.app_logo')}
      </span>

      <div className="flex items-center gap-3">
        {inspectionName && (
          <span className="text-sm text-slate-400 truncate">
            {inspectionName}
          </span>
        )}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700"
          title={i18n.language === 'en' ? 'Passa a Italiano' : 'Switch to English'}
        >
          <Globe size={14} />
          {i18n.language === 'en' ? 'EN' : 'IT'}
        </button>
      </div>
    </header>
  );
}
