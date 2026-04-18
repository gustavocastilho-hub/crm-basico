import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[200px]">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
