import { Link } from 'react-router-dom';
import { LeafletMap } from '../components/ui/LeafletMap'; // We'll make a reusable map component
import { useAppContext } from '../context/AppContext';
import { Truck, Route, Users, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { vehicles, routes, operators, events } = useAppContext();

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inProgressRoutes = routes.filter(r => r.status === 'in_progress').length;
  const onDutyOperators = operators.filter(o => o.status === 'on_duty').length;
  const activeAlerts = 2; // Fixed as per prompt or dynamic? Let's use 2 as per prompt: "Alertas Ativos: 2"

  const kpis = [
    { title: 'Veículos Ativos', current: activeVehicles, total: vehicles.length, icon: Truck, color: 'text-[var(--color-compass-blue)]', link: '/vehicles' },
    { title: 'Rotas em And.', current: inProgressRoutes, total: null, icon: Route, color: 'text-[var(--color-compass-blue)]', link: '/routes' },
    { title: 'Op. em Serviço', current: onDutyOperators, total: operators.length, icon: Users, color: 'text-[var(--color-compass-blue)]', link: '/operators' },
    { title: 'Alertas Ativos', current: activeAlerts, total: null, icon: AlertTriangle, color: 'text-[var(--color-compass-orange)]', link: '/dashboard' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      
      {/* Alert Banner */}
      <div className="bg-[var(--color-compass-orange)] text-white p-4 rounded-xl shadow-md flex items-start gap-4">
        <ShieldAlert className="shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-lg leading-none mb-1">Atenção Prioritária (ALERT-001 e ALERT-004)</h3>
          <p className="opacity-90 text-sm">Verifique interdições no acesso ao Terminal Ponta da Espera e desvios nas vias principais do pátio.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <Link to={kpi.link} key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow group">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{kpi.title}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${kpi.color}`}>
                  {kpi.current}
                </span>
                {kpi.total !== null && (
                  <span className="text-slate-400 font-medium font-mono text-sm">/ {kpi.total}</span>
                )}
              </div>
            </div>
            <div className={`p-4 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors ${kpi.color}`}>
              <kpi.icon size={28} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Main Map Area */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <h3 className="font-semibold px-1 text-slate-800">Visão Geral do Porto</h3>
            <Link to="/map" className="text-sm font-medium text-[var(--color-compass-blue)] hover:text-blue-800 flex items-center gap-1">
              Ver Mapa Completo <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1 relative bg-slate-50">
            <LeafletMap mini />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-800">Atividade Recente</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex flex-col gap-1 p-2">
              {events.map((evt) => (
                <div key={evt.id} className="relative pl-6 py-3 border-l-2 border-slate-100 max-w-full">
                  <div className={`absolute -left-[5px] top-4 w-[8px] h-[8px] rounded-full ${
                    evt.type === 'error' ? 'bg-[var(--color-compass-red)]' :
                    evt.type === 'warning' ? 'bg-[var(--color-compass-orange)]' :
                    evt.type === 'success' ? 'bg-[var(--color-compass-green)]' :
                    'bg-[var(--color-compass-blue)]'
                  }`} />
                  <p className="text-xs font-mono font-medium text-slate-400 mb-1">
                    {format(new Date(evt.time), 'HH:mm')}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {evt.description}
                  </p>
                </div>
              ))}
              {events.length === 0 && <p className="p-4 py-8 text-center text-slate-400 text-sm">Nenhuma atividade recente.</p>}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
