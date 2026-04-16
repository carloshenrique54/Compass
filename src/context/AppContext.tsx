import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { initialOperators, initialVehicles, initialRoutes, initialEvents, LOCATIONS, INTERDICTIONS } from '../data/mockData';
import type { Operator, Vehicle, Route, EventLog } from '../data/mockData';

interface AppContextType {
  operators: Operator[];
  vehicles: Vehicle[];
  routes: Route[];
  events: EventLog[];
  locations: typeof LOCATIONS;
  interdictions: typeof INTERDICTIONS;
  setOperators: (ops: Operator[]) => void;
  setVehicles: (vs: Vehicle[]) => void;
  addRoute: (route: Route) => void;
  updateRouteStatus: (id: string, status: Route['status']) => void;
  updateVehicleStatus: (id: string, status: Vehicle['status']) => void;
  addEvent: (event: Omit<EventLog, 'id'>) => void;
  addOperator: (op: Operator) => void;
  addVehicle: (v: Vehicle) => void;
  addLocation: (category: keyof typeof LOCATIONS, name: string, coords: [number, number]) => void;
  addInterdiction: (inter: typeof INTERDICTIONS[0]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [events, setEvents] = useState<EventLog[]>(initialEvents);
  const [locations, setLocations] = useState(LOCATIONS);
  const [interdictions, setInterdictions] = useState(INTERDICTIONS);

  useEffect(() => {
    let active = true;
    const fetchMissingPolylines = async () => {
      const { getRoutePolylineAvoidingInterdictions } = await import('../services/osrm');
      const { getCoordsByName } = await import('../data/mockData');
      
      const updatedRoutes = await Promise.all(initialRoutes.map(async (r) => {
        if (!r.polyline && (['in_progress', 'delayed', 'awaiting_operator'].includes(r.status))) {
          const start = getCoordsByName(r.origin);
          const end = getCoordsByName(r.destination);
          if (start && end) {
            try {
              const result = await getRoutePolylineAvoidingInterdictions(
                start as [number, number],
                end as [number, number],
                INTERDICTIONS
              );
              if (result.avoided.length > 0) {
                addEvent({
                  time: new Date().toISOString(),
                  description: `Rota ${r.id} recalculada automaticamente para contornar: ${result.avoided.join(', ')}.`,
                  type: 'warning'
                });
              }
              return { ...r, polyline: result.polyline };
            } catch (e) {}
          }
        }
        return r;
      }));
      if (active) setRoutes(updatedRoutes);
    };
    fetchMissingPolylines();
    return () => { active = false; };
  }, []);

  const addRoute = (route: Route) => {
    setRoutes((prev) => [...prev, route]);
    addEvent({
      time: new Date().toISOString(),
      description: `Rota ${route.id} criada.`,
      type: 'info'
    });
  };

  const updateRouteStatus = (id: string, status: Route['status']) => {
    setRoutes((prev) => prev.map((r) => {
      if (r.id === id) {
        let newStartTime = r.startTime;
        if (status === 'in_progress' && r.status === 'awaiting_operator') {
          newStartTime = new Date().toISOString();
        }
        return { ...r, status, startTime: newStartTime, endTime: status === 'completed' ? new Date().toISOString() : r.endTime };
      }
      return r;
    }));
    addEvent({
      time: new Date().toISOString(),
      description: status === 'in_progress' ? `Rota ${id} iniciada pelo operador.` : `Rota ${id} alterada para ${status}.`,
      type: status === 'completed' ? 'success' : 'info'
    });
  };

  const updateVehicleStatus = (id: string, status: Vehicle['status']) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  };

  const addEvent = (event: Omit<EventLog, 'id'>) => {
    const newEvent: EventLog = {
      ...event,
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // keep last 50
  };

  const addOperator = (op: Operator) => {
    setOperators(prev => [...prev, op]);
    addEvent({
      time: new Date().toISOString(),
      description: `Operador ${op.name} cadastrado.`,
      type: 'success'
    });
  };

  const addVehicle = (v: Vehicle) => {
    setVehicles(prev => [...prev, v]);
    addEvent({
      time: new Date().toISOString(),
      description: `Veículo ${v.id} (${v.plate}) cadastrado.`,
      type: 'success'
    });
  };

  const addLocation = (category: string, name: string, coords: [number, number]) => {
    setLocations(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [name]: coords
      }
    }));
    addEvent({
      time: new Date().toISOString(),
      description: `Novo ponto registrado: ${name} em ${category}.`,
      type: 'info'
    });
  };

  const addInterdiction = (inter: typeof INTERDICTIONS[0]) => {
    setInterdictions(prev => [...prev, inter]);
    addEvent({
      time: new Date().toISOString(),
      description: `Nova interdição registrada: ${inter.name}.`,
      type: 'warning'
    });
  };

  useEffect(() => {
    // Detect delays every 5 seconds
    const interval = setInterval(() => {
      setRoutes(currentRoutes => {
        let changed = false;
        const newRoutes = currentRoutes.map(r => {
           if (r.status === 'in_progress') {
             const elapsedMins = (Date.now() - new Date(r.startTime).getTime()) / 60000;
             if (elapsedMins > r.estimatedDurationMins) {
                changed = true;
                addEvent({
                  time: new Date().toISOString(),
                  description: `ALERTA: Rota ${r.id} estourou o prazo de ${r.estimatedDurationMins}m e encontra-se ATRASADA.`,
                  type: 'error'
                });
                return { ...r, status: 'delayed' };
             }
           }
           return r;
        });
        return changed ? newRoutes : currentRoutes;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ 
      operators, vehicles, routes, events, locations, interdictions,
      setOperators, setVehicles,
      addRoute, updateRouteStatus, updateVehicleStatus, addEvent,
      addOperator, addVehicle, addLocation, addInterdiction 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
