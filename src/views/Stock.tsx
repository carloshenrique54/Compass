import { useState, useMemo } from 'react';
import {
  Package, TrendingUp, AlertTriangle, Plus, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Pencil, Trash2, X, Filter, History,
  Layers, Flame, Box, Wrench, Droplets, CheckCircle2, Map
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { StockCategory, StockItem, MovementType } from '../data/mockData';
import { computeStockStatus } from '../data/mockData';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<StockCategory, string> = {
  minerio: 'Minério',
  carga_geral: 'Carga Geral',
  container: 'Container',
  combustivel: 'Combustível',
  equipamento: 'Equipamento',
};

const CATEGORY_ICONS: Record<StockCategory, React.ElementType> = {
  minerio: Layers,
  carga_geral: Box,
  container: Package,
  combustivel: Droplets,
  equipamento: Wrench,
};

const STATUS_CONFIG = {
  normal:   { label: 'Normal',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)' },
  low:      { label: 'Baixo',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  critical: { label: 'Crítico',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
  full:     { label: 'Cheio',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)' },
};

const MOV_TYPE_CONFIG: Record<MovementType, { label: string; icon: React.ElementType; color: string }> = {
  entrada:      { label: 'Entrada',      icon: ArrowDownToLine, color: '#22c55e' },
  saida:        { label: 'Saída',        icon: ArrowUpFromLine,  color: '#ef4444' },
  transferencia:{ label: 'Transferência',icon: ArrowLeftRight,   color: '#6366f1' },
};

const formatQty = (n: number, unit: string) =>
  unit === 'L' ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m³` :
  `${n.toLocaleString('pt-BR')} ${unit}`;

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m atrás`;
  if (diff < 1440) return `${Math.round(diff / 60)}h atrás`;
  return `${Math.round(diff / 1440)}d atrás`;
};

const EMPTY_FORM = {
  name: '', category: 'minerio' as StockCategory, quantity: '', unit: 't',
  minStock: '', maxStock: '', location: '', description: '',
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const Stock = () => {
  const { stock, movements, removeStockItem } = useAppContext();

  const [filterCat, setFilterCat] = useState<StockCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [movModal, setMovModal] = useState<StockItem | null>(null);
  const [editModal, setEditModal] = useState<StockItem | 'new' | null>(null);

  // Summary stats
  const totalItems = stock.length;
  const criticalCount = stock.filter(s => s.status === 'critical').length;
  const lowCount = stock.filter(s => s.status === 'low').length;
  const todayMov = movements.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString()).length;
  const avgCapacity = stock.length
    ? Math.round(stock.reduce((acc, s) => acc + s.quantity / s.maxStock, 0) / stock.length * 100)
    : 0;

  const filtered = useMemo(() => stock.filter(s => {
    if (filterCat !== 'all' && s.category !== filterCat) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [stock, filterCat, filterStatus, search]);

  const handleRemove = (item: StockItem) => {
    if (confirm(`Remover "${item.name}" do estoque?`)) removeStockItem(item.id);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Estoque</h1>
          <p className="text-slate-500">Controle de materiais e minérios - Porto Ponta da Madeira</p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
            onClick={() => setShowHistory(v => !v)}
          >
            <History size={18} /> {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-compass-blue)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm"
            onClick={() => setEditModal('new')}
          >
            <Plus size={18} /> Novo Material
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total de Materiais', value: totalItems, icon: Package, color: 'text-[var(--color-compass-blue)]', sub: 'itens cadastrados' },
          { label: 'Nível Crítico', value: criticalCount, icon: Flame, color: 'text-[var(--color-compass-red)]', sub: `+ ${lowCount} em nível baixo`, alert: criticalCount > 0 },
          { label: 'Movimentações Hoje', value: todayMov, icon: TrendingUp, color: 'text-[var(--color-compass-green)]', sub: 'entradas e saídas hoje' },
          { label: 'Ocupação Média', value: `${avgCapacity}%`, icon: Layers, color: 'text-[var(--color-compass-yellow)]', sub: 'capacidade total dos pátios' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-between transition-all ${card.alert ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </span>
                <span className="text-slate-400 font-medium text-xs truncate max-w-[100px]">{card.sub}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-slate-400">
              <card.icon size={26} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── History Panel ── */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><History size={18} /> Últimas Movimentações</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm italic">Nenhuma movimentação registrada.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {movements.map(m => {
                  const cfg = MOV_TYPE_CONFIG[m.type];
                  return (
                    <div key={m.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}15` }}>
                        <cfg.icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            <span style={{ color: cfg.color }}>{cfg.label}</span> · {m.stockItemName}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider h-fit">{timeAgo(m.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {m.quantity.toLocaleString('pt-BR')} · {m.notes || 'Sem observações'}{m.operator ? ` · Op: ${m.operator}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--color-compass-blue)]/20 focus:border-[var(--color-compass-blue)] outline-none transition-all text-sm"
            placeholder="Pesquisar material, local ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Categoria:</span>
          {(['all', 'minerio', 'carga_geral', 'container', 'combustivel', 'equipamento'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterCat === cat 
                  ? 'bg-[var(--color-compass-blue)] text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center border-l border-slate-100 pl-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Status:</span>
          {(['all', 'normal', 'low', 'critical', 'full'] as const).map(s => {
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active 
                    ? 'ring-2 ring-offset-1 ring-slate-200 shadow-sm' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                style={active && s !== 'all' ? { backgroundColor: STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].bg, color: STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].color } : {}}
              >
                {s === 'all' ? 'Ver Todos' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stock Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 font-semibold text-slate-700">Material</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Categoria</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Ocupação / Saldo</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Localização</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhum material encontrado com os filtros atuais.</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const pct = Math.min(100, Math.round(item.quantity / item.maxStock * 100));
                  const statusCfg = STATUS_CONFIG[item.status];
                  const CatIcon = CATEGORY_ICONS[item.category];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 bg-white shadow-sm" style={{ color: statusCfg.color }}>
                            <CatIcon size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{item.id} · {timeAgo(item.lastMovement)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold uppercase tracking-wider">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center px-0.5">
                            <span className="text-sm font-bold text-slate-700">{formatQty(item.quantity, item.unit)}</span>
                            <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{ 
                                width: `${pct}%`, 
                                backgroundColor: statusCfg.color 
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                            <span>MÍN: {item.minStock.toLocaleString('pt-BR')}</span>
                            <span>MÁX: {item.maxStock.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Map size={14} className="text-slate-400" />
                          <span className="truncate max-w-[150px]">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'normal' || item.status === 'full' ? 'animate-none' : 'animate-pulse'}`}
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                        >
                          {item.status === 'normal' || item.status === 'full' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {statusCfg.label.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Movimentar"
                            onClick={() => setMovModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          >
                            <ArrowLeftRight size={18} />
                          </button>
                          <button
                            title="Editar"
                            onClick={() => setEditModal(item)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            title="Remover"
                            onClick={() => handleRemove(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      {movModal && <MovementModal item={movModal} onClose={() => setMovModal(null)} />}
      {editModal && (
        <EditModal
          item={editModal === 'new' ? undefined : editModal}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
};

// ─── Modal Components (Re-implemented with fixed overlay) ───────────────────

interface MovModalProps {
  item: StockItem;
  onClose: () => void;
}

function MovementModal({ item, onClose }: MovModalProps) {
  const { registerMovement } = useAppContext();
  const [type, setType] = useState<MovementType>('entrada');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qty);
    if (!q || q <= 0) { setError('Informe uma quantidade válida.'); return; }
    if (type === 'saida' && q > item.quantity) { setError('Quantidade superior ao estoque disponível.'); return; }
    registerMovement({
      stockItemId: item.id,
      stockItemName: item.name,
      type,
      quantity: q,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Registrar Movimentação</h2>
          <button className="text-slate-400 hover:text-slate-600 p-1" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-compass-blue)]/5 border border-[var(--color-compass-blue)]/10">
            <p className="text-sm font-bold text-[var(--color-compass-blue)] mb-0.5">{item.name}</p>
            <p className="text-xs text-slate-500">Saldo Atual: <span className="font-bold text-slate-700">{formatQty(item.quantity, item.unit)}</span> · {item.location}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['entrada', 'saida', 'transferencia'] as MovementType[]).map(t => {
                const cfg = MOV_TYPE_CONFIG[t];
                const active = type === t;
                return (
                  <button
                    key={t} type="button"
                    onClick={() => { setType(t); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      active 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <cfg.icon size={14} style={{ color: cfg.color }} />
                    {cfg.label.toUpperCase()}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantidade ({item.unit})</label>
              <input 
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium ${error ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-blue-400'}`}
                type="number" min="1" placeholder="0" 
                value={qty} onChange={e => { setQty(e.target.value); setError(''); }} 
                autoFocus required 
              />
              {error && <p className="text-[11px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Observações</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-sm h-24 resize-none"
                placeholder="Ex: Descarga de trem, carga para navio, etc..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors" onClick={onClose}>Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">
                Confirmar {MOV_TYPE_CONFIG[type].label}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  item?: StockItem;
  onClose: () => void;
}

function EditModal({ item, onClose }: EditModalProps) {
  const { addStockItem, updateStockItem } = useAppContext();
  const [form, setForm] = useState(item ? {
    name: item.name, category: item.category, quantity: String(item.quantity),
    unit: item.unit, minStock: String(item.minStock), maxStock: String(item.maxStock),
    location: item.location, description: item.description || '',
  } : EMPTY_FORM);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) { setError('Nome e localização são obrigatórios.'); return; }
    const qty = Number(form.quantity), min = Number(form.minStock), max = Number(form.maxStock);
    if (max <= 0 || min < 0 || qty < 0) { setError('Confira os valores numéricos.'); return; }
    if (min >= max) { setError('Mínimo não pode ser maior que o máximo.'); return; }

    const data = {
      name: form.name, category: form.category as StockCategory,
      quantity: qty, unit: form.unit as StockItem['unit'],
      minStock: min, maxStock: max, location: form.location, description: form.description,
    };

    if (item) {
      updateStockItem(item.id, { ...data, status: computeStockStatus(qty, min, max), lastMovement: item.lastMovement });
    } else {
      addStockItem(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{item ? 'Editar Material' : 'Cadastrar Novo Material'}</h2>
          <button className="text-slate-400 hover:text-slate-600 p-1" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Material</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                placeholder="Ex: Minério de Ferro Granulado" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all text-sm font-medium" 
                value={form.category} onChange={e => set('category', e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidade Médida</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all text-sm font-medium" 
                value={form.unit} onChange={e => set('unit', e.target.value)}>
                <option value="t">Toneladas (t)</option>
                <option value="un">Unidades (un)</option>
                <option value="L">Litros (L)</option>
                <option value="m³">Metros Cúbicos (m³)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Saldo Inicial</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all font-medium" 
                type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estoque Mínimo (Alerta)</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all font-medium" 
                type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)} required />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacidade Máxima do Local</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all font-medium" 
                type="number" min="1" value={form.maxStock} onChange={e => set('maxStock', e.target.value)} required />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Localização (Armazém/Pátio)</label>
              <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all font-medium font-mono text-sm uppercase" 
                placeholder="Ex: PÁTIO SUL - LOTE 4" value={form.location} onChange={e => set('location', e.target.value)} required />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição Técnica</label>
              <textarea className="w-full px-4 py-2 h-20 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all text-sm resize-none" 
                placeholder="Detalhes sobre o material..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center mt-2">{error}</p>}

          <div className="flex gap-4 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
            <button type="button" className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors" onClick={onClose}>Descartar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-[var(--color-compass-blue)] text-white rounded-xl font-bold hover:opacity-90 shadow-lg shadow-blue-100 transition-all">
              {item ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
