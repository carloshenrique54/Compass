import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UserCircle, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

export const Operators = () => {
  const { operators, addOperator, setOperators } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOperator, setNewOperator] = useState({ id: '', name: '', shift: 'Manhã', status: 'on_duty' as const });

  const filteredOperators = operators.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase()) && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperator.id || !newOperator.name) {
      toast.error('Preencha todos os campos.');
      return;
    }
    addOperator(newOperator);
    setIsModalOpen(false);
    setNewOperator({ id: '', name: '', shift: 'Manhã', status: 'on_duty' });
  };

  const removeOperator = (id: string) => {
    setOperators(operators.filter(o => o.id !== id));
    toast.info(`Operador ${id} removido.`);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Equipe de Operadores</h1>
          <p className="text-slate-500">Gestão de turnos e equipe em serviço.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-compass-blue)] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Operador
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white text-sm">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 font-medium ${filter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Todos</button>
            <button onClick={() => setFilter('on_duty')} className={`px-4 py-2 font-medium border-l border-slate-200 ${filter === 'on_duty' ? 'bg-slate-100 text-[var(--color-compass-blue)]' : 'text-slate-500 hover:bg-slate-50'}`}>Em Serviço</button>
            <button onClick={() => setFilter('off_duty')} className={`px-4 py-2 font-medium border-l border-slate-200 ${filter === 'off_duty' ? 'bg-slate-100 text-slate-400' : 'text-slate-500 hover:bg-slate-50'}`}>Fora de Serviço</button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar operador..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOperators.map(o => (
              <div key={o.id} className="border border-slate-200 rounded-lg p-4 flex gap-4 items-center bg-white hover:border-blue-200 transition-colors">
                <div className={`p-3 rounded-full ${o.status === 'on_duty' ? 'bg-blue-50 text-[var(--color-compass-blue)]' : 'bg-slate-50 text-slate-400'}`}>
                  <UserCircle size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-0.5">{o.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{o.id}</p>
                    <button
                      onClick={() => removeOperator(o.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="Remover Operador"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${o.status === 'on_duty' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {o.status === 'on_duty' ? 'Em Turno' : 'Folga'}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    Turno: <span className="font-semibold text-slate-700">{o.shift}</span>
                  </span>
                </div>
              </div>
            ))}
            {filteredOperators.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">Nenhum operador encontrado.</div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Operador">
        <form onSubmit={handleAddOperator} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula / ID (Ex: OP-050)</label>
            <input
              type="text"
              value={newOperator.id}
              onChange={e => setNewOperator({...newOperator, id: e.target.value.toUpperCase()})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              value={newOperator.name}
              onChange={e => setNewOperator({...newOperator, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Turno de Trabalho</label>
            <select
              value={newOperator.shift}
              onChange={e => setNewOperator({...newOperator, shift: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            >
              <option value="Manhã">Manhã (06h–14h)</option>
              <option value="Tarde">Tarde (14h–22h)</option>
              <option value="Noite">Noite (22h–06h)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[var(--color-compass-blue)] text-white rounded-lg font-bold shadow-md shadow-blue-100">Salvar Operador</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
