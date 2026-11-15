import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { Smartphone, Plus, Trash2 } from 'lucide-react';

export const ScreenManager: React.FC = () => {
  const { ast, selectedScreenId, selectScreen, addScreen, deleteScreen } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [screenName, setScreenName] = useState('');
  const [screenRoute, setScreenRoute] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenName.trim()) return;
    const name = screenName.endsWith('Screen') ? screenName : `${screenName}Screen`;
    const route = screenRoute.trim() || screenName.toLowerCase().replace(/\s+/g, '-');
    addScreen(name, route);
    setScreenName('');
    setScreenRoute('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 p-3 text-xs border-b border-slate-800">
      <div className="flex items-center justify-between px-1">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
          Pantallas de la App
        </span>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 p-2 bg-slate-900 border border-slate-700 rounded-lg my-1">
          <input
            type="text"
            placeholder="Nombre (ej: ProfileScreen)"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
            autoFocus
          />
          <input
            type="text"
            placeholder="Ruta (ej: profile)"
            value={screenRoute}
            onChange={(e) => setScreenRoute(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-400"
          />
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-1">
        {ast.screens.map(screen => {
          const isSelected = screen.id === selectedScreenId;
          return (
            <div
              key={screen.id}
              onClick={() => selectScreen(screen.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                isSelected
                  ? 'bg-purple-950/70 border border-purple-700/60 text-purple-200 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{screen.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">/{screen.route}</span>
              </div>

              {ast.screens.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteScreen(screen.id);
                  }}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded"
                  title="Eliminar pantalla"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
