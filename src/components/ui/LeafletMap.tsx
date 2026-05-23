import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMapEvents } from 'react-leaflet';
import { Fragment, useState } from 'react';
import L from 'leaflet';
import { useAppContext } from '../../context/AppContext';
import { Modal } from './Modal';
import { Edit2, MapPin, AlertTriangle, Save } from 'lucide-react';

// Custom icons based on status
const createIcon = (color: string) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const icons = {
  active: createIcon('var(--color-compass-blue)'),
  idle: createIcon('var(--color-compass-green)'),
  maintenance: createIcon('var(--color-compass-red)')
};

const createSmallIcon = (color: string) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.6);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const ROUTE_COLORS = [
  '#0f64a9', // Blue
  '#ff7b2a', // Orange
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

const categoryStyles: Record<string, { color: string, icon: string }> = {
  'Terminais': { color: '#0ea5e9', icon: '<i class="fa-solid fa-industry"></i>' },
  'Berços': { color: '#0ea5e9', icon: '<i class="fa-solid fa-anchor"></i>' },
  'Ponta da Madeira': { color: '#0ea5e9', icon: '<i class="fa-solid fa-anchor"></i>' },
  'Setores de Carga': { color: '#0ea5e9', icon: '<i class="fa-solid fa-boxes-stacked"></i>' },
  'Acessos e Circulação': { color: '#0ea5e9', icon: '<i class="fa-solid fa-road"></i>' },
  'Estacionamentos': { color: '#0ea5e9', icon: '<i class="fa-solid fa-warehouse"></i>' },
  'Estruturas Internas': { color: '#0ea5e9', icon: '<i class="fa-solid fa-building"></i>' },
};

const createCategoryIcon = (category: string) => {
  const style = categoryStyles[category] || { color: '#0ea5e9', icon: '<i class="fa-solid fa-location-dot"></i>' };
  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-none',
    html: `<div style="background-color: ${style.color}; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">${style.icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const interdictionIcon = L.divIcon({
  className: 'custom-leaflet-icon bg-transparent border-none',
  html: `<div style="background-color: #ef4444; color: white; width: 26px; height: 26px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 11px;"><i class="fa-solid fa-triangle-exclamation"></i></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13]
});

const portPolygonCoords: [number, number][] = [
  [-2.547080098135951, -44.380203359211556], // Extremo Noroeste
  [-2.5538299416367054, -44.34493753411892], // Borda superior reta
  [-2.563638217047656, -44.33878834969534], // Curva interna Itaqui
  [-2.565833263702198, -44.32456117136255], // Extremo Nordeste
  [-2.60165131313041, -44.31410243250224], // Extremo Sudeste (ferrovia)
  [-2.604313566825336, -44.327895146112716], // Ponta Sul
  [-2.5953763629241533, -44.34981194135756], // Curva Sul
  [-2.5901632420560885, -44.36881813353492], // Costa Sul
  [-2.5754566381623576, -44.373267560000784], // Costa Sudoeste
  [-2.5666764947764413, -44.38337489900818], // Bojo Costa Oeste (TEGRAM)
  [-2.547080098135951, -44.380203359211556], // Extremo Oeste
];

interface LeafletMapProps {
  mini?: boolean;
}

export const LeafletMap = ({ mini = false }: LeafletMapProps) => {
  const { vehicles, routes, locations, interdictions, addLocation, addInterdiction } = useAppContext();
  
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);
  
  // New marker form state
  const [markerType, setMarkerType] = useState<'location' | 'interdiction'>('location');
  type Category =
  | "Terminais"
  | "Berços"
  | "Ponta da Madeira"
  | "Setores de Carga"
  | "Estruturas Internas";

  const [category, setCategory] = useState<Category>("Terminais");
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (isEditorMode) {
          setClickedCoords([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  };

  const handleSaveMarker = () => {
    if (!clickedCoords || !name) return;
    
    if (markerType === 'location') {
      addLocation(category, name, clickedCoords);
    } else {
      addInterdiction({
        id: `BLK-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
        name,
        location: clickedCoords,
        description
      });
    }
    
    setClickedCoords(null);
    setName('');
    setDescription('');
  };

  return (
    <div className={mini ? "h-full w-full relative z-0" : "h-full w-full relative z-0 rounded-xl shadow-sm border border-slate-200 overflow-hidden"}>
      {!mini && (
        <button 
          onClick={() => setIsEditorMode(!isEditorMode)}
          className={`absolute bottom-6 left-4 z-[1000] p-2.5 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm transition-all ${isEditorMode ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
        >
          <Edit2 size={18} />
          {isEditorMode ? 'SAIR DO MODO EDIÇÃO' : 'MODO MAPEAMENTO'}
        </button>
      )}

      {isEditorMode && !mini && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg border border-red-100 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Clique em qualquer lugar no mapa para marcar</span>
        </div>
      )}

      <MapContainer 
        center={[-2.5757, -44.3647]} 
        zoom={mini ? 13 : 14} 
        zoomControl={!mini}
        className="h-full w-full"
      >
        <MapClickHandler />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Demarcação da Área do Porto */}
      <Polygon 
        positions={portPolygonCoords} 
        pathOptions={{ 
          fillColor: 'var(--color-compass-blue)', 
          fillOpacity: 0.1, 
          color: 'var(--color-compass-blue)', 
          weight: 2, 
          dashArray: '5, 5' 
        }} 
      />
      
      {/* Pontos Locais do Mapa */}
      {!mini && Object.entries(locations).flatMap(([category, points]) => 
        Object.entries(points).map(([name, coords]) => (
          <Marker key={name} position={coords as [number, number]} icon={createCategoryIcon(category)}>
             <Popup className="rounded-lg">
               <div className="p-1 min-w-[120px]">
                 <p className="font-bold text-slate-800 m-0 text-[13px]">{name}</p>
                 <p className="text-[11px] text-slate-500 uppercase mt-1 tracking-wider">{category}</p>
               </div>
             </Popup>
          </Marker>
        ))
      )}

      {/* Interdições */}
      {!mini && interdictions.map(blk => (
        <Marker key={blk.id} position={blk.location} icon={interdictionIcon}>
          <Popup className="rounded-lg">
            <div className="p-1 min-w-[150px]">
              <p className="font-bold text-red-600 m-0 text-[13px] flex items-center gap-1.5 justify-center bg-red-50 p-1 rounded"><i className="fa-solid fa-ban"></i> {blk.name}</p>
              <p className="text-[12px] text-slate-600 mt-2 leading-snug">{blk.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Veículos Ativos/Disponíveis */}
      {vehicles.map(v => (
        <Marker key={v.id} position={v.location} icon={icons[v.status]}>
          {!mini && (
            <Popup className="rounded-lg">
              <div className="p-1">
                <p className="font-bold text-[var(--color-compass-blue)] m-0">{v.id}</p>
                <p className="text-sm m-0 mt-1"><span className="font-medium">Tipo:</span> {v.type}</p>
                <p className="text-sm m-0"><span className="font-medium">Placa:</span> {v.plate}</p>
                <p className="text-sm m-0 mt-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-white text-xs ${v.status === 'active' ? 'bg-blue-600' : v.status === 'idle' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {v.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </Popup>
          )}
        </Marker>
      ))}

      {/* Rotas ativas ou aguardando */}
      {routes.filter(r => ['in_progress', 'delayed', 'awaiting_operator'].includes(r.status) && r.polyline).map((r, index) => {
        const isAwaiting = r.status === 'awaiting_operator';
        const routeColor = isAwaiting ? '#94a3b8' : ROUTE_COLORS[index % ROUTE_COLORS.length];
        const dynamicIcon = createSmallIcon(routeColor);

        return (
          <Fragment key={r.id}>
            {/* Outline / Sombra estilo Google Maps */}
            <Polyline 
              positions={r.polyline!} 
              color={routeColor} 
              weight={10} 
              opacity={0.3} 
              lineCap="round"
              lineJoin="round"
            />
            {/* Linha principal */}
            <Polyline 
              positions={r.polyline!} 
              color={routeColor} 
              weight={isAwaiting ? 3 : 5} 
              opacity={0.9} 
              dashArray={isAwaiting ? "10, 10" : undefined}
              lineCap="round"
              lineJoin="round"
            >
              {!mini && (
                <Popup>
                  <div className="p-1">
                    <p className="font-bold m-0" style={{ color: routeColor }}>{r.id}</p>
                    <p className="text-sm m-0 text-slate-500">{r.origin} <br/> <strong className="text-slate-400">↓</strong> <br/> {r.destination}</p>
                  </div>
                </Popup>
              )}
            </Polyline>
            <Marker position={r.polyline![0]} icon={dynamicIcon} />
            <Marker position={r.polyline![r.polyline!.length - 1]} icon={dynamicIcon} />
          </Fragment>
        );
      })}

    </MapContainer>

      {!mini && (
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 z-[1000] text-xs pointer-events-auto">
          <h4 className="font-bold text-slate-800 mb-3 text-sm border-b border-slate-100 pb-2">Legenda Operacional</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-compass-blue)] shadow-sm"></span> Veículo Ativo</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-compass-green)] shadow-sm"></span> Veículo Ocioso</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--color-compass-red)] shadow-sm"></span> Manutenção</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] shadow-sm">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </span> Área Interditada
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0ea5e9] text-white text-[10px] shadow-sm">
                <i className="fa-solid fa-location-dot"></i>
              </span> Pontos Fixos
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 border-b-2 border-dashed border-[#94a3b8]"></div> Rota Pendente
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-1.5 rounded bg-[#0f64a9]"></div> Rota Ativa
            </div>
          </div>
        </div>
      )}

      {/* Marker Creation Modal */}
      <Modal isOpen={!!clickedCoords} onClose={() => setClickedCoords(null)} title="Adicionar Marcação no Mapa">
        <div className="flex flex-col gap-5">
           <div className="flex p-1 bg-slate-100 rounded-lg">
             <button 
               onClick={() => setMarkerType('location')}
               className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all ${markerType === 'location' ? 'bg-white text-[var(--color-compass-blue)] shadow-sm' : 'text-slate-500'}`}
             >
               <MapPin size={16} /> Estrutura
             </button>
             <button 
               onClick={() => setMarkerType('interdiction')}
               className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all ${markerType === 'interdiction' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
             >
               <AlertTriangle size={16} /> Interdição
             </button>
           </div>

           <div className="flex flex-col gap-3">
             {markerType === 'location' ? (
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria da Estrutura</label>
                 <select 
                   value={category}
                   onChange={(e) => setCategory(e.target.value as Category)}
                   className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                 >
                   {Object.keys(locations).map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                   ))}
                 </select>
               </div>
             ) : null}

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome / Identificação</label>
               <input 
                 type="text" 
                 placeholder={markerType === 'location' ? "Ex: Armazém Leste" : "Ex: Obras na Pista"}
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
               />
             </div>

             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações / Descrição</label>
               <textarea 
                 rows={3}
                 placeholder={markerType === 'location' ? "Detalhes sobre o local..." : "Descreva o motivo da interdição..."}
                 value={description}
                 onChange={e => setDescription(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
               />
             </div>

             <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2 border border-dashed border-slate-200">
               <div className="p-2 bg-white rounded-md shadow-sm text-[var(--color-compass-blue)]">
                 <MapPin size={18} />
               </div>
               <div className="text-xs">
                 <p className="font-bold text-slate-700">Coordenadas Capturadas</p>
                 <p className="font-mono text-slate-400">{clickedCoords?.[0].toFixed(6)}, {clickedCoords?.[1].toFixed(6)}</p>
               </div>
             </div>
           </div>

           <div className="flex justify-end gap-3 pt-2">
             <button onClick={() => setClickedCoords(null)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-all">Cancelar</button>
             <button 
               onClick={handleSaveMarker}
               disabled={!name}
               className="px-6 py-2 bg-[var(--color-compass-blue)] text-white font-bold rounded-lg shadow-md shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all"
             >
               <Save size={18} /> Salvar no Mapa
             </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};
