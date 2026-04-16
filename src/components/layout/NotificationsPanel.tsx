import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsPanel = () => {
  const { events } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha o painel se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-50';
      case 'error': return 'bg-red-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 relative text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
      >
        <Bell size={20} />
        {events.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden flex flex-col z-50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800">Notificações e Alertas</h3>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{events.length}</span>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhum evento registrado.
              </div>
            ) : (
              events.slice().reverse().map(ev => (
                <div key={ev.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 text-sm items-start`}>
                  <div className={`p-1.5 rounded-full shrink-0 ${getBg(ev.type)} mt-0.5`}>
                    {getIcon(ev.type)}
                  </div>
                  <div>
                    <p className="text-slate-700 leading-snug">{ev.description}</p>
                    <p className="text-slate-400 text-[11px] mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(ev.time), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
