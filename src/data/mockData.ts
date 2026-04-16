export type VehicleStatus = 'active' | 'idle' | 'maintenance';
export type RouteStatus = 'awaiting_operator' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';

export interface Operator {
  id: string;
  name: string;
  shift: string;
  status: 'on_duty' | 'off_duty';
}

export interface Vehicle {
  id: string;
  type: string;
  plate: string;
  status: VehicleStatus;
  currentOperatorId?: string;
  location: [number, number]; // [lat, lng]
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  vehicleId: string;
  operatorId: string;
  status: RouteStatus;
  cargoType: string;
  startTime: string;
  estimatedDurationMins: number; // Prazo estipulado
  estimatedEndTime?: string;
  endTime?: string;
  polyline?: [number, number][]; // [lat, lng] array
}

export interface EventLog {
  id: string;
  time: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export const initialOperators: Operator[] = [
  { id: 'OP-001', name: 'Pedro Alves', shift: 'Manhã', status: 'on_duty' },
  { id: 'OP-002', name: 'Rafael Costa', shift: 'Manhã', status: 'on_duty' },
  { id: 'OP-003', name: 'João Santos', shift: 'Manhã', status: 'on_duty' },
  { id: 'OP-004', name: 'Marcos Silva', shift: 'Noite', status: 'off_duty' },
  // ... We will have 20 operators, keeping it short here but will expand in Context if needed.
];

export const initialVehicles: Vehicle[] = [
  { id: 'VH-001', type: 'Caminhão', plate: 'PPM-1234', status: 'active', currentOperatorId: 'OP-001', location: [-2.5644470429621133, -44.37411825045454] }, // Rota do Pátio (Descarga)
  { id: 'VH-002', type: 'Caminhão', plate: 'PPM-5678', status: 'active', currentOperatorId: 'OP-002', location: [-2.5640035361759947, -44.361951772199134] }, // Estrada de Acesso ao Píer
  { id: 'VH-003', type: 'Empilhadeira', plate: 'PPM-9012', status: 'idle', location: [-2.565432840195308, -44.36380097366366] }, // Pátio de Empilhamento
  { id: 'VH-004', type: 'Caminhão', plate: 'PPM-3456', status: 'maintenance', location: [-2.560282330016836, -44.3502848521628] }, // Oficina perto do eixo principal
];

export const initialRoutes: Route[] = [
  {
    id: 'ROTA-005',
    origin: 'CLI - Corredor Logísitica e Infraestrutura S.A.',
    destination: 'Píer I',
    vehicleId: 'VH-001',
    operatorId: 'OP-001',
    status: 'in_progress',
    cargoType: 'Minério de Ferro',
    startTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Iniciou ha 15m
    estimatedDurationMins: 20 // Prazo: 20m
  },
  {
    id: 'ROTA-003',
    origin: 'Virador de vagões',
    destination: 'Estacionamento',
    vehicleId: 'VH-002',
    operatorId: 'OP-002',
    status: 'delayed',
    cargoType: 'Carga Geral',
    startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Iniciou ha 45m
    estimatedDurationMins: 30 // Prazo: 30m, entao causara atraso automatico!
  }
];

export const initialEvents: EventLog[] = [
  { id: 'EV-1', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), description: 'Congestionamento detectado no Terminal TEGRAM', type: 'warning' },
  { id: 'EV-2', time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), description: 'ROTA-005 iniciada por Pedro Alves', type: 'info' },
  { id: 'EV-3', time: new Date(Date.now() - 1000 * 60 * 35).toISOString(), description: 'Via de acesso ao Terminal Ponta da Espera interditada', type: 'error' },
  { id: 'EV-4', time: new Date(Date.now() - 1000 * 60 * 40).toISOString(), description: 'ROTA-003 iniciada por Rafael Costa', type: 'info' },
  { id: 'EV-5', time: new Date(Date.now() - 1000 * 60 * 48).toISOString(), description: 'Desvio detectado na ROTA-002', type: 'warning' }
];

// Some fixed locations for mock origin/destinations
export const LOCATIONS = {
  'Terminais': {
    'TEGRAM': [-2.566724420026332, -44.364319400336434],
    'Porto do Itaqui': [-2.577608593865511, -44.367188700280735],
    'Terminal Marítimo de Ponta da Madeira': [-2.5599249363649146, -44.379231840179884],
    'Terminal Portuário São Luís (TPSL)': [-2.5647779006609652, -44.37337576581458]
  },
  'Berços': {
    'Berço 99': [-2.587193931749689, -44.36799545317413],
    'Berço 100': [-2.584726307059543, -44.3684530509575],
    'Berço 106': [-2.5722128062197345, -44.37419961212716],
    'Berço 108': [-2.5708386705759976, -44.376548532240335]
  },
  'Ponta da Madeira':{
    'Píer I': [-2.566212888639435, -44.378197556795385],
    'Píer III': [-2.562927311643714, -44.37919813854352],
    'Píer IV': [-2.552080432545055, -44.37895541302079],
  },
  'Setores de Carga': {
    'CLI - Corredor Logísitica e Infraestrutura S.A.': [-2.569834672081888, -44.36363942343261],
    'Suzano - Itacel': [-2.5806259839131354, -44.366292128311386],
    'Virador de vagões': [-2.568081986928968, -44.34454039401643],
    'TCN-Terminal Corredor Norte (NovaAgri - São Luís-MA)': [-2.5677473432481484, -44.363226088036804],
    'Micropem': [-2.570769579621683, -44.353109464587284]
  },
  'Estruturas Internas': {
    'Terminal Portuario São Luís': [-2.5646591197593525, -44.37338885527978],
    'Portaria do Píer 4': [-2.5598428317545436, -44.36488422885905],
    'Estacionamento': [-2.565580887004765, -44.363537447469795],
    'Canteiro PPL Manutenção e Serviços São Luís': [-2.560500370720071, -44.350431634198664],
    'Oficina Central Vale': [-2.5995180112394887, -44.32000034339745]
  }
};

export const INTERDICTIONS = [
  { id: 'BLK-1', name: 'Obras na Via', location: [-2.573516334189241, -44.364391217729285] as [number, number], description: 'Reparo de asfalto pesado. Trânsito pode ser desviado.' },
  { id: 'BLK-2', name: 'Acesso Fechado', location: [-2.5729952581372055, -44.35294272090973] as [number, number], description: 'Manutenção de pórtico industrial. Acesso restrito temporariamente.' },
  { id: 'BLK-3', name: 'Alagamento', location: [-2.5611398340565925, -44.366333777121454] as [number, number], description: 'Área com acúmulo de água. Risco de derrapagem para veículos leves.' }
];

export const getCoordsByName = (name: string): [number, number] | undefined => {
  for (const category of Object.values(LOCATIONS)) {
    if (name in category) {
      return (category as any)[name];
    }
  }
  return undefined;
};
