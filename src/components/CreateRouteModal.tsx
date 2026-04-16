import { useState } from 'react';
import { Modal } from './ui/Modal';
import { useAppContext } from '../context/AppContext';
import { getRoutePolylineAvoidingAll } from '../services/osrm';
import { LOCATIONS, getCoordsByName } from '../data/mockData';
import { toast } from 'sonner';

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRouteModal = ({ isOpen, onClose }: CreateRouteModalProps) => {
  const { vehicles, operators, routes, addRoute, updateVehicleStatus, interdictions } = useAppContext();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [duration, setDuration] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  // Filtramos apenas veículos "idle" e ativos
  const availableVehicles = vehicles.filter(v => v.status === 'idle' || v.status === 'active');
  const availableOperators = operators.filter(o => o.status === 'on_duty');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !vehicleId || origin === destination) {
       toast.error('Preencha os dados corretamente. Origem deve ser diferente de destino.');
       return;
    }
    
    setIsLoading(true);
    try {
      const startCoord = getCoordsByName(origin);
      const endCoord = getCoordsByName(destination);
      
      if (!startCoord || !endCoord) throw new Error('Coordenadas invalidas');

      // Rotas ativas com polyline para comparação de conflito
      const activeRoutes = routes
        .filter(r => ['in_progress', 'delayed', 'awaiting_operator'].includes(r.status) && r.polyline)
        .map(r => ({ id: r.id, polyline: r.polyline! }));

      const result = await getRoutePolylineAvoidingAll(
        startCoord,
        endCoord,
        interdictions,
        activeRoutes
      );

      // Notificações detalhadas
      if (result.avoidedInterdictions.length > 0) {
        toast.warning(`⚠️ Rota desviada das interdições: ${result.avoidedInterdictions.join(', ')}`);
      }
      if (result.conflicts.length > 0) {
        const conflictDetails = result.conflicts
          .map(c => `${c.routeId} (${c.overlapPercentage.toFixed(0)}%)`)
          .join(', ');
        if (result.alternativeFound) {
          toast.warning(`🛑 Conflito de trecho com ${conflictDetails}. Rota alternativa calculada automaticamente.`);
        } else {
          toast.error(`❌ Conflito com ${conflictDetails} não pôde ser evitado. Considere outro horário ou veículo.`);
        }
      }

      const vehicle = vehicles.find(v => v.id === vehicleId);

      const newRoute = {
        id: `ROTA-00${Math.floor(Math.random() * 900) + 100}`,
        origin,
        destination,
        vehicleId,
        operatorId: operatorId || vehicle?.currentOperatorId || availableOperators[0]?.id || 'OP-000',
        status: 'awaiting_operator' as const,
        cargoType: cargoType || 'Carga Padrão',
        startTime: new Date().toISOString(),
        estimatedDurationMins: Number(duration),
        polyline: result.polyline
      };

      addRoute(newRoute);
      updateVehicleStatus(vehicleId, 'active');
      toast.success(`Rota ${newRoute.id} calculada e iniciada com sucesso!`);
      
      // Cleanup field and close
      setOrigin('');
      setDestination('');
      setVehicleId('');
      setOperatorId('');
      setCargoType('');
      onClose();
    } catch (err) {
      toast.error('Erro ao calcular rota via OSRM.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Rota Logística">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
          <select 
            value={origin} 
            onChange={e => setOrigin(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
          >
            <option value="">Selecione origem...</option>
            {Object.entries(LOCATIONS).map(([category, points]) => (
              <optgroup key={category} label={category}>
                {Object.keys(points).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
          <select 
            value={destination} 
            onChange={e => setDestination(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
          >
            <option value="">Selecione destino...</option>
            {Object.entries(LOCATIONS).map(([category, points]) => (
              <optgroup key={category} label={category}>
                {Object.keys(points).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Veículo (Disponível/Ativo)</label>
          <select 
            value={vehicleId} 
            onChange={e => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
          >
            <option value="">Selecione veículo...</option>
            {availableVehicles.map(v => (
              <option key={v.id} value={v.id}>{v.id} - {v.plate} ({v.type})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Operador Responsável</label>
          <select 
            value={operatorId} 
            onChange={e => setOperatorId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
          >
            <option value="">Selecione um operador...</option>
            {availableOperators.map(o => (
              <option key={o.id} value={o.id}>{o.id} - {o.name} ({o.shift})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Carga</label>
            <input 
              type="text" 
              placeholder="Ex: Minério, Fertilizantes..."
              value={cargoType} 
              onChange={e => setCargoType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>

          <div className="w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Prazo (Minutos)</label>
            <input 
              type="number" 
              min="1"
              value={duration} 
              onChange={e => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-compass-blue)]"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2 font-medium text-white bg-[var(--color-compass-orange)] hover:bg-[#eb6a1e] rounded-lg shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? 'Calculando...' : 'Criar Rota'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
