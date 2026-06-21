import React, { useState } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useAuth } from '../model/auth-context';
import { isOidcConfigured } from '../config';

const SignInButton: React.FC = () => {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOidcConfigured()) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (err) {
      console.error('[SignIn] OIDC sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? t.auth.signingIn : t.auth.signIn}
    </button>
  );
};

export default SignInButton;
