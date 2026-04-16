import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Check, X, Route as RouteIcon, Search, Plus, Play } from 'lucide-react';
import { CreateRouteModal } from '../components/CreateRouteModal';
import { toast } from 'sonner';

export const RoutesList = () => {
  const { routes, updateRouteStatus } = useAppContext();
  const [filterMode, setFilterMode] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRoutes = routes.filter(r => {
    if (filterMode === 'active' && r.status !== 'in_progress') return false;
    if (filterMode === 'completed' && r.status !== 'completed') return false;
    if (searchTerm && !r.id.toLowerCase().includes(searchTerm.toLowerCase()) && !r.origin.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleComplete = (id: string) => {
    updateRouteStatus(id, 'completed');
    toast.success(`Rota ${id} marcada como concluída!`);
  };

  const handleCancel = (id: string) => {
    if (confirm(`Deseja mesmo cancelar a rota ${id}?`)) {
      updateRouteStatus(id, 'cancelled');
      toast.info(`Rota ${id} cancelada.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Rotas</h1>
          <p className="text-slate-500">Gerenciamento de rotas e entregas ativas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-compass-orange)] hover:bg-[#eb6a1e] text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center gap-2 transition-colors active:scale-95"
        >
          <Plus size={18} />
          Nova Rota
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white text-sm">
            <button onClick={() => setFilterMode('all')} className={`px-4 py-2 font-medium ${filterMode === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Todas</button>
            <button onClick={() => setFilterMode('active')} className={`px-4 py-2 font-medium border-l border-slate-200 ${filterMode === 'active' ? 'bg-slate-100 text-[var(--color-compass-blue)]' : 'text-slate-500 hover:bg-slate-50'}`}>Em Andamento</button>
            <button onClick={() => setFilterMode('completed')} className={`px-4 py-2 font-medium border-l border-slate-200 ${filterMode === 'completed' ? 'bg-slate-100 text-[var(--color-compass-green)]' : 'text-slate-500 hover:bg-slate-50'}`}>Concluídas</button>
          </div>

          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Buscar rota..." 
               className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Rota</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Origem / Destino</th>
                <th className="px-6 py-4">Veículo / Operador</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRoutes.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{r.id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      r.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      r.status === 'awaiting_operator' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                      r.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      r.status === 'delayed' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {r.status === 'in_progress' ? 'Em Andamento' :
                       r.status === 'awaiting_operator' ? 'Aguardando Operador' :
                       r.status === 'completed' ? 'Concluída' :
                       r.status === 'delayed' ? 'Atrasada' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="font-medium text-slate-800">{r.origin}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><RouteIcon size={12}/> {r.destination}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="font-medium text-[var(--color-compass-blue)]">{r.vehicleId}</div>
                    <div className="text-xs">{r.operatorId}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'awaiting_operator' ? (
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button 
                          onClick={() => updateRouteStatus(r.id, 'in_progress')}
                          className="p-1.5 rounded-md hover:bg-blue-100 hover:text-blue-700 transition" 
                          title="Iniciar Rota"
                        >
                          <Play size={18} />
                        </button>
                        <button 
                          onClick={() => handleCancel(r.id)}
                          className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-700 transition"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : r.status === 'in_progress' || r.status === 'delayed' ? (
                      <div className="flex justify-end gap-2 text-slate-500">
                        <button 
                          onClick={() => handleComplete(r.id)}
                          className="p-1.5 rounded-md hover:bg-green-100 hover:text-green-700 transition" 
                          title="Marcar como concluída"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleCancel(r.id)}
                          className="p-1.5 rounded-md hover:bg-red-100 hover:text-red-700 transition"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Encerrada</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhuma rota encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateRouteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
