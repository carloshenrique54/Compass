import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Truck, MapPin, CheckCircle2, Wrench, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

export const Vehicles = () => {
  const { vehicles, updateVehicleStatus, addVehicle, setVehicles } = useAppContext();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ id: '', type: 'Caminhão', plate: '', status: 'idle' as const });

  const filteredVehicles = vehicles.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (search && !v.id.toLowerCase().includes(search.toLowerCase()) && !v.plate.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle2 className="text-blue-600" size={18} />;
    if (status === 'idle') return <CheckCircle2 className="text-green-600" size={18} />;
    return <Wrench className="text-red-600" size={18} />;
  };

  const getStatusText = (status: string) => {
    if (status === 'active') return 'Ativo/Rota';
    if (status === 'idle') return 'Disponível';
    return 'Manutenção';
  };

  const handleMaintenanceToggle = (id: string, current: string) => {
    if (current === 'active') {
      toast.error('Veículos em rota não podem ir para manutenção diretamente.');
      return;
    }
    const nextStatus = current === 'maintenance' ? 'idle' : 'maintenance';
    updateVehicleStatus(id, nextStatus as any);
    toast.success(`Veículo ${id} alterado para ${getStatusText(nextStatus)}.`);
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.id || !newVehicle.plate) {
      toast.error('Preencha todos os campos.');
      return;
    }
    addVehicle({ ...newVehicle, location: [-2.5757, -44.3647] });
    setIsModalOpen(false);
    setNewVehicle({ id: '', type: 'Caminhão', plate: '', status: 'idle' });
  };

  const removeVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    toast.info(`Veículo ${id} removido.`);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Caminhões e Frota</h1>
          <p className="text-slate-500">Gestão e rastreamento da frota do porto.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-compass-blue)] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm w-full sm:w-auto">
          <button onClick={() => setFilter('all')} className={`flex-1 sm:flex-none px-4 py-2 font-medium ${filter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
          <button onClick={() => setFilter('active')} className={`flex-1 sm:flex-none px-4 py-2 font-medium border-l border-slate-200 ${filter === 'active' ? 'bg-slate-100 text-[var(--color-compass-blue)]' : 'text-slate-500 hover:bg-slate-50'}`}>Ativos</button>
          <button onClick={() => setFilter('idle')} className={`flex-1 sm:flex-none px-4 py-2 font-medium border-l border-slate-200 ${filter === 'idle' ? 'bg-slate-100 text-[var(--color-compass-green)]' : 'text-slate-500 hover:bg-slate-50'}`}>Disponíveis</button>
          <button onClick={() => setFilter('maintenance')} className={`flex-1 sm:flex-none px-4 py-2 font-medium border-l border-slate-200 ${filter === 'maintenance' ? 'bg-slate-100 text-[var(--color-compass-red)]' : 'text-slate-500 hover:bg-slate-50'}`}>Manutenção</button>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar placa/ID..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800 leading-none mb-1 text-[var(--color-compass-blue)]">{v.id}</h3>
                <p className="text-sm font-medium text-slate-500">{v.type} • {v.plate}</p>
              </div>
              <div className="flex items-center gap-2">
                <div title={getStatusText(v.status)}>
                  {getStatusIcon(v.status)}
                </div>
                <button
                  onClick={() => removeVehicle(v.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Truck size={16} className="text-slate-400" />
                <span>Op: {v.currentOperatorId || 'Nenhum'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span>Loc: {v.location[0].toFixed(4)}, {v.location[1].toFixed(4)}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <button
                onClick={() => handleMaintenanceToggle(v.id, v.status)}
                className={`text-sm font-medium px-3 py-1.5 rounded-md w-full transition border ${
                  v.status === 'maintenance'
                    ? 'bg-blue-50 text-[var(--color-compass-blue)] border-blue-200 hover:bg-blue-100'
                    : 'bg-orange-50 text-[var(--color-compass-orange)] border-orange-200 hover:bg-orange-100'
                }`}
              >
                {v.status === 'maintenance' ? 'Retornar p/Frota' : 'Enviar Manutenção'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-100">
          Nenhum veículo encontrado com os filtros atuais.
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Veículo">
        <form onSubmit={handleAddVehicle} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID do Veículo (Ex: VH-020)</label>
            <input
              type="text"
              value={newVehicle.id}
              onChange={e => setNewVehicle({...newVehicle, id: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Veículo</label>
            <select
              value={newVehicle.type}
              onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            >
              <option value="Caminhão">Caminhão</option>
              <option value="Empilhadeira">Empilhadeira</option>
              <option value="Vagão">Vagão / Locomotiva</option>
              <option value="Utilitário">Utilitário Leve</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placa / Chassi</label>
            <input
              type="text"
              value={newVehicle.plate}
              onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[var(--color-compass-blue)] text-white rounded-lg font-bold shadow-md shadow-blue-100">Salvar Veículo</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
