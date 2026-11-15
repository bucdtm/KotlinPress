import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { StateVariable, PrimitiveType, ComplexType } from '../../core/ast/schema.ts';
import { Database, Plus, Trash2, Edit2, Check, Sparkles } from 'lucide-react';

interface VariablePreset {
  label: string;
  name: string;
  type: PrimitiveType | ComplexType;
  initial: string;
}

const PRESETS: VariablePreset[] = [
  { label: 'Contador', name: 'contador', type: 'Int', initial: '0' },
  { label: 'Texto', name: 'texto', type: 'String', initial: 'Hola Compose' },
  { label: 'Booleano', name: 'activo', type: 'Boolean', initial: 'false' },
  { label: 'Radio', name: 'opcionSeleccionada', type: 'String', initial: 'opcion_1' },
  { label: 'Lista', name: 'items', type: 'List<String>', initial: 'Elemento 1, Elemento 2' },
];

export const StateManager: React.FC = () => {
  const { ast, selectedScreenId, addStateVariable, updateStateVariable, deleteStateVariable } = useEditorStore();
  const screen = ast.screens.find(s => s.id === selectedScreenId);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<PrimitiveType | ComplexType>('String');
  const [initialValue, setInitialValue] = useState<string>('');

  if (!screen) return null;

  const applyPreset = (preset: VariablePreset) => {
    let finalName = preset.name;
    let counter = 1;
    while (screen.stateVariables.some(v => v.name === finalName)) {
      finalName = `${preset.name}_${counter++}`;
    }
    setName(finalName);
    setType(preset.type);
    setInitialValue(preset.initial);
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (v: StateVariable) => {
    setEditingId(v.id);
    setName(v.name);
    setType(v.type);
    if (v.type === 'List<String>' && Array.isArray(v.initialValue)) {
      setInitialValue(v.initialValue.join(', '));
    } else {
      setInitialValue(String(v.initialValue ?? ''));
    }
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanName = name.trim().replace(/[^a-zA-Z0-9_]/g, '_');

    let parsedInitial: any = initialValue;
    if (type === 'Int') parsedInitial = parseInt(initialValue, 10) || 0;
    if (type === 'Boolean') parsedInitial = initialValue.toLowerCase() === 'true';
    if (type === 'List<String>') {
      parsedInitial = initialValue
        ? initialValue.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    }

    if (editingId) {
      updateStateVariable(screen.id, editingId, {
        name: cleanName,
        type,
        initialValue: parsedInitial,
      });
      setEditingId(null);
    } else {
      const newVar: StateVariable = {
        id: `var-${Date.now()}`,
        name: cleanName,
        type,
        initialValue: parsedInitial,
      };
      addStateVariable(screen.id, newVar);
      setIsAdding(false);
    }

    setName('');
    setInitialValue('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setInitialValue('');
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 text-xs border-b border-zinc-800">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-zinc-400 font-medium text-[11px]">
          <Database className="w-3.5 h-3.5 text-zinc-400" />
          <span>Variables de Estado ({screen.name})</span>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              handleCancel();
            } else {
              setEditingId(null);
              setName('');
              setType('String');
              setInitialValue('');
              setIsAdding(true);
            }
          }}
          className="flex items-center gap-1 text-[11px] text-[#7f52ff] hover:text-[#9068ff] font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva
        </button>
      </div>

      {/* Plantillas Rápidas (Presets) */}
      {!isAdding && !editingId && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Plantillas:
          </span>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-2 py-0.5 bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-[10px] text-zinc-300 hover:text-white rounded shrink-0 transition"
              title={`Crear variable preconfigurada de tipo ${p.type}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Formulario de Alta o Edición */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="flex flex-col gap-2 p-2.5 bg-[#18181c] border border-zinc-750 rounded-md my-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
              {editingId ? 'Editar Variable' : 'Nueva Variable'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-0.5">Nombre (identificador Kotlin)</label>
            <input
              type="text"
              placeholder="ej: contador, usuarioActivo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono outline-none focus:border-[#7f52ff]"
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
                placeholder={type === 'Int' ? '0' : type === 'Boolean' ? 'true o false' : type === 'List<String>' ? 'Item1, Item2' : 'ej: Hola'}
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-1.5 mt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="px-2 py-0.5 text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 bg-[#7f52ff] hover:bg-[#9068ff] text-white rounded font-medium text-xs transition"
            >
              <Check className="w-3 h-3" />
              <span>{editingId ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Variables Declaradas */}
      <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
        {screen.stateVariables.length === 0 ? (
          <span className="text-[11px] text-zinc-500 italic px-1">Sin variables declaradas aún.</span>
        ) : (
          screen.stateVariables.map(v => (
            <div
              key={v.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded bg-[#18181c] border text-[11px] transition ${
                editingId === v.id ? 'border-[#7f52ff]' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono font-medium text-zinc-200">{v.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({v.type})</span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">
                  = {JSON.stringify(v.initialValue)}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleStartEdit(v)}
                  className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                  title="Editar variable"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteStateVariable(screen.id, v.id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                  title="Eliminar variable"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
