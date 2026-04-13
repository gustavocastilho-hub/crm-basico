import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';

export function useAuth() {
  const { accessToken, refreshToken, user, setAuth, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken && user) {
      setLoading(false);
      return;
    }

    if (refreshToken && !accessToken) {
      authApi
        .refresh(refreshToken)
        .then(({ data }) => {
          setAuth(data.accessToken, data.refreshToken, data.user);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading, isAuthenticated: !!accessToken && !!user };
}
