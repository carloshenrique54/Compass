import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Eye, FileText, Truck, MapPin, Package, Clock } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

export const Reports = () => {
  const { routes } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const reportRoutes = routes.filter(r => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'delayed') return r.status === 'delayed';
    return r.status === 'completed' || r.status === 'delayed'; // only history
  });

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  const handleExport = () => {
    if (reportRoutes.length === 0) {
      toast.error('Nenhum dado para exportar sob este filtro.');
      return;
    }
    const headers = ['ID Rota', 'Status', 'Origem', 'Destino', 'Carga', 'Veículo', 'Operador', 'Prazo Mins', 'Inicio', 'Fim'];
    const rows = reportRoutes.map(r => 
      [r.id, r.status, `"${r.origin}"`, `"${r.destination}"`, `"${r.cargoType}"`, r.vehicleId, r.operatorId, r.estimatedDurationMins, r.startTime, r.endTime || '']
    );
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_compass_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
    toast.success('Relatório baixado com sucesso!');
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Relatórios Operacionais</h1>
          <p className="text-slate-500">Histórico de rotas e performance do turno.</p>
        </div>
        <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center gap-2 transition-colors">
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
           <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
           >
              <option value="all">Todas as Registradas</option>
              <option value="completed">Apenas Concluídas</option>
              <option value="delayed">Apenas Atrasadas</option>
           </select>
           <input type="date" className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Rota</th>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Desempenho</th>
                <th className="px-6 py-4">Veículo/Op</th>
                <th className="px-6 py-4 text-right">Ver Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {reportRoutes.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{r.id}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {format(new Date(r.startTime), 'dd/MM/yyyy HH:mm')}
                    {r.endTime && <><br/>{format(new Date(r.endTime), 'dd/MM/yyyy HH:mm')}</>}
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'completed' && <span className="text-green-600 font-medium">No Prazo (+2m)</span>}
                    {r.status === 'delayed' && <span className="text-orange-600 font-medium font-bold">Atraso Notificado</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="font-semibold">{r.vehicleId}</span> ({r.operatorId})
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedRouteId(r.id)} className="p-2 text-slate-400 hover:text-[var(--color-compass-blue)] hover:bg-blue-50 rounded-lg transition-colors" title="Ficha Completa">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {reportRoutes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum registro histórico no filtro atual.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedRoute} onClose={() => setSelectedRouteId(null)} title={`Ficha da Rota: ${selectedRoute?.id}`}>
        {selectedRoute && (
          <div className="flex flex-col gap-5 text-slate-700">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
               <div className={`p-3 rounded-full ${selectedRoute.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                 <FileText size={24} />
               </div>
               <div>
                 <p className="text-sm text-slate-500 font-medium">Status Operacional</p>
                 <p className="font-bold text-lg">{selectedRoute.status === 'completed' ? 'Concluída no Prazo' : 'Finalizada com Atraso'}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1 font-medium"><MapPin size={14}/> Origem</p>
                <p className="font-bold text-sm tracking-tight">{selectedRoute.origin}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1 font-medium"><MapPin size={14}/> Destino</p>
                <p className="font-bold text-sm tracking-tight">{selectedRoute.destination}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1 font-medium"><Package size={14}/> Carga Transportada</p>
                <p className="font-bold text-sm tracking-tight">{selectedRoute.cargoType}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1 font-medium"><Truck size={14}/> Veículo / Cód Operador</p>
                <p className="font-bold text-sm tracking-tight">{selectedRoute.vehicleId} • {selectedRoute.operatorId}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-1 flex flex-col gap-2 shadow-sm">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 mb-1 bg-blue-100 w-max px-2 py-0.5 rounded"><Clock size={14}/> Escala de Tempo</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Início Formal:</span>
                <span className="font-bold text-slate-800">{format(new Date(selectedRoute.startTime), 'dd/MM/yyyy • HH:mm:ss')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Fim do Ciclo:</span>
                <span className="font-bold text-slate-800">{selectedRoute.endTime ? format(new Date(selectedRoute.endTime), 'dd/MM/yyyy • HH:mm:ss') : 'Pendente'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-blue-800 font-medium">Teto Estipulado:</span>
                <span className="font-bold text-blue-800">{selectedRoute.estimatedDurationMins} minutos</span>
              </div>
              {selectedRoute.endTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-800 font-medium">Duração Real:</span>
                  <span className="font-bold text-blue-800">{differenceInMinutes(new Date(selectedRoute.endTime), new Date(selectedRoute.startTime))} minutos</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-2">
               <button onClick={() => setSelectedRouteId(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">Fechar Detalhes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
