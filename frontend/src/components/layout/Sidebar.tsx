import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/clientes', label: 'Clientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/pipeline', label: 'Pipeline', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { to: '/tarefas', label: 'Tarefas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/sdr', label: 'Ligações/Mensagens SDR', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  { to: '/comissoes', label: 'Comissões', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/melhorias', label: 'Pedidos de Melhorias', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

const adminItems = [
  { to: '/usuarios', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
];

const bottomItems = [
  { to: '/configuracoes', label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const user = useAuthStore((s) => s.user);

  const items = user?.role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;
  const widthClass = collapsed ? 'md:w-16' : 'md:w-64';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 ${widthClass} bg-white border-r border-gray-200 flex flex-col transform transition-all duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className={`px-4 py-4 border-b border-gray-200 flex items-center ${collapsed ? 'md:justify-center md:px-2' : 'justify-between'}`}>
          {!collapsed && <img src="/sai-crm.png" alt="SAI CRM" className="h-12 w-auto" />}
          {collapsed && <img src="/favicon-sai.png" alt="SAI" className="hidden md:block h-8 w-auto" />}
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-600 text-2xl leading-none px-2"
            aria-label="Fechar menu"
          >
            &times;
          </button>
          <button
            onClick={onToggleCollapsed}
            className={`hidden md:inline-flex p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ${collapsed ? 'absolute right-1 top-1/2 -translate-y-1/2' : ''}`}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'md:justify-center md:px-2' : ''} ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!collapsed && <span className="truncate md:inline">{item.label}</span>}
              {collapsed && <span className="md:hidden">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 md:p-3 border-t border-gray-200 space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'md:justify-center md:px-2' : ''} ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!collapsed && <span className="md:inline">{item.label}</span>}
              {collapsed && <span className="md:hidden">{item.label}</span>}
            </NavLink>
          ))}
          {!collapsed && (
            <div className="px-3 pt-2">
              <div className="text-sm text-gray-500 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
