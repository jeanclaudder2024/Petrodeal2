import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';

const LanguageIndicator = () => {
  const { t, currentLanguage } = useLanguage();

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full border border-primary/20 shadow-sm">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t('dashboard.welcome')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="text-sm text-muted-foreground">
            {currentLanguage.name}
          </span>
          <Check className="h-3 w-3 text-green-500" />
        </div>
      </div>
    </div>
  );
};

export default LanguageIndicator;
