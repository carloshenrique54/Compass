import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Route, Truck, Users, FileText, ChevronRight, Compass, Database } from 'lucide-react';


const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Mapa Operacional', path: '/map', icon: Map },
  { name: 'Gestão de Rotas', path: '/routes', icon: Route },
  { name: 'Veículos', path: '/vehicles', icon: Truck },
  { name: 'Operadores', path: '/operators', icon: Users },
  { name: 'Relatórios', path: '/reports', icon: FileText },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  return (
    <aside className={`fixed top-0 left-0 h-screen bg-[var(--color-compass-blue)] flex flex-col text-white shadow-xl z-50 transition-all duration-300 ${isOpen ? 'w-[240px]' : 'w-[80px]'}`}>
      <div className={`h-16 flex items-center border-b border-white/10 shrink-0 ${isOpen ? 'px-6' : 'px-0 justify-center'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)} title="Toggle Menu">
          {/* Logo placeholder - using an icon */}
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[var(--color-compass-blue)] shrink-0">
            <Compass size={20} className="font-bold" />
          </div>
          {isOpen && <span className="font-bold text-lg tracking-wide transition-opacity duration-300 whitespace-nowrap">COMPASS</span>}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-md transition-colors duration-200 group ${
                isActive
                  ? 'bg-[var(--color-compass-orange)] text-white font-medium shadow-md pointer-events-none'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 shrink-0" title={!isOpen ? item.name : undefined}>
                  <item.icon size={18} className={isActive ? 'opacity-100 shrink-0' : 'opacity-70 group-hover:opacity-100 shrink-0'} />
                  {isOpen && <span className="whitespace-nowrap transition-opacity">{item.name}</span>}
                </div>
                {isActive && isOpen && <ChevronRight size={16} className="opacity-80 shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className={`p-4 border-t border-white/10 text-xs text-white/50 whitespace-nowrap transition-opacity overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 h-16'}`}>
        <p>Porto Ponta da Madeira</p>
        <p className="mt-1">Vale S.A. © 2026</p>
      </div>
    </aside>
  );
};
