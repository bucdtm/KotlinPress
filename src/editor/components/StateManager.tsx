import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { StateVariable, PrimitiveType, ComplexType } from '../../core/ast/schema.ts';
import { Database, Plus, Trash2 } from 'lucide-react';

export const StateManager: React.FC = () => {
  const { ast, selectedScreenId, addStateVariable, deleteStateVariable } = useEditorStore();
  const screen = ast.screens.find(s => s.id === selectedScreenId);

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PrimitiveType | ComplexType>('String');
  const [initialValue, setInitialValue] = useState<string>('');

  if (!screen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedInitial: any = initialValue;
    if (type === 'Int') parsedInitial = parseInt(initialValue, 10) || 0;
    if (type === 'Boolean') parsedInitial = initialValue.toLowerCase() === 'true';
    if (type === 'List<String>') {
      parsedInitial = initialValue
        ? initialValue.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    }

    const newVar: StateVariable = {
      id: `var-${Date.now()}`,
      name: name.trim().replace(/\s+/g, '_'),
      type,
      initialValue: parsedInitial,
    };

    addStateVariable(screen.id, newVar);
    setName('');
    setInitialValue('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 p-3 text-xs border-b border-zinc-800">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-zinc-400 font-medium text-[11px]">
          <Database className="w-3.5 h-3.5 text-zinc-400" />
          <span>Variables de Estado ({screen.name})</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-[11px] text-[#7f52ff] hover:text-[#9068ff] font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 p-2 bg-[#18181c] border border-zinc-750 rounded-md my-1">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-0.5">Nombre variable</label>
            <input
              type="text"
              placeholder="ej: contador, usuario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-0.5">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
              >
                <option value="String">String</option>
                <option value="Int">Int</option>
                <option value="Boolean">Boolean</option>
                <option value="List<String>">List&lt;String&gt;</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-0.5">Valor Inicial</label>
              <input
                type="text"
                placeholder={type === 'Int' ? '0' : type === 'Boolean' ? 'true/false' : 'ej: Hola'}
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 bg-[#7f52ff] hover:bg-[#9068ff] text-white rounded font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-1">
        {screen.stateVariables.length === 0 ? (
          <span className="text-[11px] text-zinc-500 italic px-1">Sin variables declaradas aún.</span>
        ) : (
          screen.stateVariables.map(v => (
            <div
              key={v.id}
              className="flex items-center justify-between px-2 py-1.5 rounded bg-[#18181c] border border-zinc-800 text-[11px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono font-medium text-zinc-200">{v.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({v.type})</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">
                  = {JSON.stringify(v.initialValue)}
                </span>
              </div>
              <button
                onClick={() => deleteStateVariable(screen.id, v.id)}
                className="p-1 text-zinc-500 hover:text-rose-400 rounded shrink-0"
                title="Eliminar variable"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
