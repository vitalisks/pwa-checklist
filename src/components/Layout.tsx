import React from 'react';
import { Search, Plus, List, Settings, Home } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSearch: (query: string) => void;
    searchQuery: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onSearch, searchQuery }) => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pl-20">
            {/* Header */}
            <header className="glass sticky top-0 z-10 px-4 py-2 mb-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <h1 className="text-lg font-bold tracking-tight text-white/80">CheckFlow</h1>
                    <div className="relative flex-1 max-w-[240px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder={t('find_placeholder')}
                            className="input pl-8 h-8 text-sm"
                            value={searchQuery}
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-4xl">
                {children}
            </main>

            {/* Navigation - iOS Style Bottom bar on mobile, mini sidebar on desktop */}
            <nav className="glass fixed bottom-0 left-0 right-0 h-[calc(4.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] md:h-screen md:w-20 md:top-0 md:left-0 rounded-t-2xl md:rounded-none flex md:flex-col items-center justify-around md:justify-start md:pt-12 gap-2 px-2 md:px-0 z-50">
                <button
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-center flex-1 md:flex-none md:w-full py-1.5 transition-all"
                    style={{ color: activeTab === 'home' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <Home className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'opacity-100' : 'opacity-60'}`} />
                    <span className={`text-[10px] font-medium tracking-wide ${activeTab === 'home' ? 'opacity-100' : 'opacity-60'}`}>{t('nav_home')}</span>
                </button>
                <button
                    onClick={() => onTabChange('checklists')}
                    className="flex flex-col items-center justify-center flex-1 md:flex-none md:w-full py-1.5 transition-all"
                    style={{ color: activeTab === 'checklists' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <Plus className={`w-6 h-6 mb-1 ${activeTab === 'checklists' ? 'opacity-100' : 'opacity-60'}`} />
                    <span className={`text-[10px] font-medium tracking-wide ${activeTab === 'checklists' ? 'opacity-100' : 'opacity-60'}`}>{t('nav_active')}</span>
                </button>
                <button
                    onClick={() => onTabChange('templates')}
                    className="flex flex-col items-center justify-center flex-1 md:flex-none md:w-full py-1.5 transition-all"
                    style={{ color: activeTab === 'templates' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <List className={`w-6 h-6 mb-1 ${activeTab === 'templates' ? 'opacity-100' : 'opacity-60'}`} />
                    <span className={`text-[10px] font-medium tracking-wide ${activeTab === 'templates' ? 'opacity-100' : 'opacity-60'}`}>{t('nav_templates')}</span>
                </button>
                <button
                    onClick={() => onTabChange('settings')}
                    className="flex flex-col items-center justify-center flex-1 md:flex-none md:w-full py-1.5 transition-all"
                    style={{ color: activeTab === 'settings' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                    <Settings className={`w-6 h-6 mb-1 ${activeTab === 'settings' ? 'opacity-100' : 'opacity-60'}`} />
                    <span className={`text-[10px] font-medium tracking-wide ${activeTab === 'settings' ? 'opacity-100' : 'opacity-60'}`}>{t('nav_settings')}</span>
                </button>
            </nav>
        </div>
    );
};

export default Layout;
