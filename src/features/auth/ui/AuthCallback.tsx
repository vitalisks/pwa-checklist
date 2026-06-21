import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../model/auth-context';

const AuthCallback: React.FC = () => {
  const { isAuthenticated, authState } = useAuth();
  const navigate = useNavigate();
  const timedOut = useRef(false);

  useEffect(() => {
    if (authState.status !== 'loading') {
      navigate(isAuthenticated ? '/' : '/settings', { replace: true });
    }
  }, [authState.status, isAuthenticated, navigate]);

  // Safety timeout: if still loading after 15s, navigate to settings
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authState.status === 'loading' && !timedOut.current) {
        timedOut.current = true;
        console.warn('[Auth] Callback timed out — redirecting to settings');
        navigate('/settings', { replace: true });
      }
    }, 15_000);
    return () => clearTimeout(timer);
  }, [authState.status, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-secondary text-sm">Signing in...</p>
    </div>
  );
};

export default AuthCallback;
