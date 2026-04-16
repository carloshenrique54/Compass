import { LeafletMap } from '../components/ui/LeafletMap';

export const MapView = () => {
  return (
    <div className="flex flex-col w-full h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-[400] flex gap-2">
        <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-slate-100 text-sm font-medium flex items-center gap-2">
           <span className="w-3 h-3 rounded-full bg-[var(--color-compass-blue)]"></span>
           Veículos em Movimento
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-slate-100 text-sm font-medium flex items-center gap-2">
           <span className="w-3 h-3 rounded-full bg-[var(--color-compass-green)]"></span>
           Disponíveis
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-slate-100 text-sm font-medium flex items-center gap-2">
           <span className="w-3 h-3 rounded-full bg-[var(--color-compass-red)]"></span>
           Manutenção
        </div>
      </div>
      <LeafletMap />
    </div>
  );
};
