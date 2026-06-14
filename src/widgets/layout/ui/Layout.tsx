import React from "react";
import { Outlet, NavLink, useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, Settings, Home, Inbox } from "lucide-react";
import { useTranslation } from "@/shared/i18n";
import { useShare } from "@/features/share";
import styles from "./Layout.module.css";

const navItems = [
  { id: "home", path: "/", icon: Home },
  { id: "templates", path: "/templates", icon: LayoutGrid },
  { id: "inbox", path: "/inbox", icon: Inbox },
  { id: "settings", path: "/settings", icon: Settings },
] as const;

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const { incomingShares } = useShare();
  const pendingCount = incomingShares.filter((s) => s.status === 'pending').length;
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

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
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </header>

      <main className={styles["scroll-area"]}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <nav className={styles["nav-bar"]}>
        <div className={styles["nav-inner"]}>
          {navItems.map(({ id, path, icon: Icon }) => {
            const isInbox = id === 'inbox';
            return (
              <NavLink
                key={id}
                to={path}
                end={id === 'home'}
                className={styles["nav-item"]}
                style={({ isActive }) => ({
                  color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                })}
              >
                <div style={{ position: "relative" }}>
                  <Icon size={18} />
                  {isInbox && pendingCount > 0 && (
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
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>
                <span className={styles["nav-item-label"]}>
                  {id === 'home' ? t.nav.home : id === 'templates' ? t.nav.templates : id === 'inbox' ? t.nav.inbox : t.nav.settings}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
