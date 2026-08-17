import React, { useState } from 'react';
import { Movement, MovementType } from '../types';
import { exportMovementsToExcel } from '../services/wmsService';
import {
  History,
  Search,
  FileSpreadsheet,
  ArrowRight,
  User,
  Clock,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  SlidersHorizontal,
  ArrowLeft
} from 'lucide-react';

interface MovementsViewProps {
  movements: Movement[];
  onBackToDashboard?: () => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ movements, onBackToDashboard }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.productBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 rounded-xl font-black text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-blue-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Kardex y Historial de Movimientos</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registro de trazabilidad de entradas, picking de salidas, mermas y reubicaciones de góndola.
            </p>
          </div>
        </div>

        <button
          onClick={() => exportMovementsToExcel(movements)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Kardex a Excel</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto, operario o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              typeFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos ({movements.length})
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              typeFilter === 'IN'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            Entradas (IN)
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              typeFilter === 'OUT'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            Salidas (OUT)
          </button>
          <button
            onClick={() => setTypeFilter('RELOCATION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              typeFilter === 'RELOCATION'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
            }`}
          >
            Reubicaciones
          </button>
        </div>
      </div>

      {/* Movements Audit List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha / Hora</th>
                <th className="py-3.5 px-4">Tipo Movimiento</th>
                <th className="py-3.5 px-4">Producto & Código</th>
                <th className="py-3.5 px-4 text-center">Cantidad</th>
                <th className="py-3.5 px-4">Ubicación Origen → Destino</th>
                <th className="py-3.5 px-4">Operador & Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredMovements.map((m) => {
                let badgeClass = 'bg-blue-950 text-blue-400 border-blue-800';
                if (m.type === 'IN')
                  badgeClass = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                else if (m.type === 'OUT')
                  badgeClass = 'bg-amber-950 text-amber-400 border-amber-800';
                else if (m.type === 'RELOCATION')
                  badgeClass = 'bg-purple-950 text-purple-400 border-purple-800';

                return (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeClass}`}
                      >
                        {m.type === 'IN' && <PackageCheck className="w-3.5 h-3.5" />}
                        {m.type === 'OUT' && <PackageMinus className="w-3.5 h-3.5" />}
                        {m.type === 'RELOCATION' && <RefreshCw className="w-3.5 h-3.5" />}
                        <span>
                          {m.type === 'IN'
                            ? 'ENTRADA'
                            : m.type === 'OUT'
                            ? 'SALIDA'
                            : m.type === 'RELOCATION'
                            ? 'REUBICACIÓN'
                            : m.type}
                        </span>
                      </span>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{m.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        EAN: {m.productBarcode}
                      </div>
                    </td>

                    {/* Quantity & Delta Stock */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm text-white">
                        {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : m.quantity}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.previousStock} u. → {m.newStock} u.
                      </div>
                    </td>

                    {/* Locations */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                        <span className="text-slate-400">{m.sourceLocation || 'N/A'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-emerald-400">{m.targetLocation || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Operator & Notes */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-300 font-bold text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.operator}</span>
                      </div>
                      {m.notes && (
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {m.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
