import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationsPanel } from './NotificationsPanel';
import { Menu } from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[var(--color-compass-bg)]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className={`flex-1 flex flex-col relative w-full h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-[240px]' : 'ml-[80px]'}`}>
        {/* Topbar generic or header space */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm shrink-0 z-40 justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">Operação Logística</h2>
          </div>
          <div className="flex items-center gap-5">
            <NotificationsPanel />
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-compass-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-compass-green)]"></span>
              </span>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block tracking-wide">SISTEMA ONLINE</span>
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};
