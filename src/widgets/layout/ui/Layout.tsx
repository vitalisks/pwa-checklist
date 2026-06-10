import React from "react";
import { Search, LayoutGrid, Settings, Home } from "lucide-react";
import { useTranslation } from "@/shared/i18n";
import { useNavigation } from "@/app/model/navigation-context";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { activeTab, switchTab, searchQuery, setSearchQuery } = useNavigation();

  return (
    <div className={styles["app-shell"]}>
      <header className={styles.header}>
        <div className={styles["header-inner"]}>
          <div className={styles["header-search"]}>
            <Search className={styles["search-icon"]} size={14} />
            <input
              type="text"
              placeholder={t.common.findPlaceholder}
              className={styles["search-input"]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className={styles["scroll-area"]}>
        <div className="container">{children}</div>
      </main>

      <nav className={styles["nav-bar"]}>
        <div className={styles["nav-inner"]}>
          {[
            { id: "home", icon: Home, label: t.nav.home },
            { id: "templates", icon: LayoutGrid, label: t.nav.templates },
            { id: "settings", icon: Settings, label: t.nav.settings },
          ].map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={styles["nav-item"]}
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                }}
              >
                <Icon size={20} />
                <span className={styles["nav-item-label"]}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
