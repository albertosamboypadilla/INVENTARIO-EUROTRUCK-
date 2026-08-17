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
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl text-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-xs transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Volver al Menú Principal"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>← Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shadow-sm shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white">Kardex y Historial de Movimientos</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Registro de trazabilidad de entradas, picking de salidas, mermas y reubicaciones de góndola.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => exportMovementsToExcel(movements)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-black text-xs rounded-xl shadow-md border border-zinc-300 transition active:scale-95 self-start md:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar a Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-zinc-100 text-zinc-950 font-black border border-zinc-300 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            Todos ({movements.length})
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              typeFilter === 'IN'
                ? 'bg-zinc-100 text-zinc-950 font-black border border-zinc-300 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            📥 Entradas
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              typeFilter === 'OUT'
                ? 'bg-zinc-100 text-zinc-950 font-black border border-zinc-300 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            📤 Salidas
          </button>
          <button
            onClick={() => setTypeFilter('RELOCATION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              typeFilter === 'RELOCATION'
                ? 'bg-zinc-100 text-zinc-950 font-black border border-zinc-300 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            🔄 Reubicaciones
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por repuesto, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
      </div>

      {/* Movements Table / Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase font-black tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Artículo & Código</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3">Ruta / Góndola</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-500">
                    No se encontraron movimientos registrados en el Kardex.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isEntry = mov.type === 'IN';
                  const isExit = mov.type === 'OUT';

                  return (
                    <tr key={mov.id} className="hover:bg-zinc-950/60 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            isEntry
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isExit
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {isEntry ? (
                            <>
                              <PackageCheck className="w-3 h-3 text-emerald-400" />
                              Entrada
                            </>
                          ) : isExit ? (
                            <>
                              <PackageMinus className="w-3 h-3 text-rose-400" />
                              Salida
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 text-zinc-400" />
                              Reubicación
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{mov.productName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {mov.productBarcode}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono font-bold">
                        <span
                          className={`text-sm ${
                            isEntry ? 'text-emerald-400' : isExit ? 'text-rose-400' : 'text-zinc-300'
                          }`}
                        >
                          {isEntry ? '+' : isExit ? '-' : ''}
                          {mov.quantity}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {mov.fromLocation && (
                            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                              {mov.fromLocation}
                            </span>
                          )}
                          {mov.fromLocation && mov.toLocation && (
                            <ArrowRight className="w-3 h-3 text-zinc-500" />
                          )}
                          {mov.toLocation && (
                            <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-200 font-bold">
                              {mov.toLocation}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{mov.operator || 'Operador'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(mov.timestamp).toLocaleDateString()} {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
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
    </div>
  );
};
