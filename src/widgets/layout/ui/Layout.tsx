import React from "react";
import { Search, LayoutGrid, Settings, Home, Inbox } from "lucide-react";
import { useTranslation } from "@/shared/i18n";
import { useNavigation } from "@/app/model/navigation-context";
import { useShare } from "@/features/share";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { activeTab, switchTab, searchQuery, setSearchQuery } = useNavigation();
  const { incomingShares } = useShare();
  const pendingCount = incomingShares.filter((s) => s.status === 'pending').length;

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
            { id: "inbox", icon: Inbox, label: t.nav.inbox, count: pendingCount },
            { id: "settings", icon: Settings, label: t.nav.settings },
          ].map(({ id, icon: Icon, label, count }) => {
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
                <div style={{ position: "relative" }}>
                  <Icon size={20} />
                  {count != null && count > 0 && (
                    <span
                      className="badge badge-success"
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -10,
                        fontSize: 8,
                        padding: "1px 4px",
                        lineHeight: 1.3,
                        minWidth: 14,
                        textAlign: "center",
                      }}
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>
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
