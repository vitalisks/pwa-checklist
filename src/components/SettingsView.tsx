import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Trash2 } from 'lucide-react';

interface SettingsViewProps {
    onClearData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClearData }) => {
    const { language, setLanguage, t } = useLanguage();

    const handleClear = async () => {
        if (window.confirm(t('settings_clear_warning'))) {
            await onClearData();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">{t('settings_title')}</h2>
                <p className="text-white/60 mb-6">{t('settings_desc')}</p>
            </div>

            <div className="glass-card space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold">{t('settings_language')}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`btn h-8 px-3 text-xs ${language === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => setLanguage('es')}
                            className={`btn h-8 px-3 text-xs ${language === 'es' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            ES
                        </button>
                        <button
                            onClick={() => setLanguage('lv')}
                            className={`btn h-8 px-3 text-xs ${language === 'lv' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            LV
                        </button>
                        <button
                            onClick={() => setLanguage('ru')}
                            className={`btn h-8 px-3 text-xs ${language === 'ru' ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            RU
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <button
                        onClick={handleClear}
                        className="btn btn-ghost text-danger-color border-danger-color/20 hover:bg-danger-color/10 w-full"
                    >
                        <Trash2 className="w-4 h-4" /> {t('settings_clear_data')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
