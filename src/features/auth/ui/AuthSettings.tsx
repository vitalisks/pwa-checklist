import React from 'react';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '../model/auth-context';
import { isOidcConfigured } from '../config';
import SignInButton from './SignInButton';
import UserMenu from './UserMenu';

const AuthSettings: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (!isOidcConfigured()) return null;

  return (
    <div className="card space-y-3">
      <h3 className="section-label">{t.auth.account}</h3>
      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-secondary">{t.auth.signInDesc}</p>
          <SignInButton />
        </div>
      )}
    </div>
  );
};

export default AuthSettings;
