import React from 'react';
import { Search, LayoutGrid, Settings, Home } from 'lucide-react';
import { useLanguage } from '@/shared/i18n';
import styles from './Layout.module.css';

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
    <div className={styles['app-shell']}>
      <header className={styles.header}>
        <div className={styles['header-inner']}>
          <h1 className="text-lg font-bold tracking-tight">CheckFlow</h1>
          <div className={styles['header-search']}>
            <Search className={styles['search-icon']} size={14} />
            <input
              type="text"
              placeholder={t('find_placeholder')}
              className={styles['search-input']}
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className={styles['scroll-area']}>
        <div className="container">
          {children}
        </div>
      </main>

      <nav className={styles['nav-bar']}>
        {[
          { id: 'home', icon: Home, label: t('nav_home') },
          { id: 'templates', icon: LayoutGrid, label: t('nav_templates') },
          { id: 'settings', icon: Settings, label: t('nav_settings') },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={styles['nav-item']}
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
            >
              <Icon size={20} />
              <span className={styles['nav-item-label']}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
