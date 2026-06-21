import React from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '../model/auth-context';
import { isOidcConfigured } from '../config';

const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const { authState, signOut } = useAuth();

  if (!isOidcConfigured() || !authState.user) return null;

  const user = authState.user;
  const initials = (user.displayName || user.email || '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {user.displayName || user.email || user.uid}
          </p>
          {user.email && user.displayName && (
            <p className="text-xs text-secondary truncate">{user.email}</p>
          )}
        </div>
      </div>
      <button
        className="btn btn-icon text-secondary hover:text-danger transition-colors"
        onClick={signOut}
        title={t.auth.signOut}
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserMenu;
