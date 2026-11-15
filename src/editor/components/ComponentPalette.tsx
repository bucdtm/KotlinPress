import React from 'react';
import { ComponentType } from '../../core/ast/schema.ts';
import { useEditorStore } from '../state/editorStore.ts';
import {
  Columns,
  Rows,
  Square,
  Type,
  MousePointerClick,
  TextCursorInput,
  ToggleLeft,
  List,
  Layers,
  BetweenVerticalEnd,
  Minus,
} from 'lucide-react';

interface ComponentItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
  category: 'Layout' | 'Texto y Contenido' | 'Interacción y Formularios';
}

const PALETTE_ITEMS: ComponentItem[] = [
  { type: 'Column', label: 'Column', icon: Columns, category: 'Layout' },
  { type: 'Row', label: 'Row', icon: Rows, category: 'Layout' },
  { type: 'Card', label: 'Card', icon: Layers, category: 'Layout' },
  { type: 'Box', label: 'Box', icon: Square, category: 'Layout' },
  { type: 'LazyColumn', label: 'LazyColumn', icon: List, category: 'Layout' },

  { type: 'Text', label: 'Text', icon: Type, category: 'Texto y Contenido' },
  { type: 'Spacer', label: 'Spacer', icon: BetweenVerticalEnd, category: 'Texto y Contenido' },
  { type: 'Divider', label: 'Divider', icon: Minus, category: 'Texto y Contenido' },

  { type: 'Button', label: 'Button', icon: MousePointerClick, category: 'Interacción y Formularios' },
  { type: 'OutlinedButton', label: 'OutlinedButton', icon: MousePointerClick, category: 'Interacción y Formularios' },
  { type: 'OutlinedTextField', label: 'TextField', icon: TextCursorInput, category: 'Interacción y Formularios' },
  { type: 'Switch', label: 'Switch', icon: ToggleLeft, category: 'Interacción y Formularios' },
];

export const ComponentPalette: React.FC = () => {
  const { ast, selectedScreenId, selectedComponentId, addComponent } = useEditorStore();

  const currentScreen = ast.screens.find(s => s.id === selectedScreenId);
  const targetParentId = selectedComponentId || currentScreen?.rootComponent.id || '';

  const categories = ['Layout', 'Texto y Contenido', 'Interacción y Formularios'] as const;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] px-1">
        Paleta de Componentes Compose
      </div>

      {categories.map(cat => (
        <div key={cat} className="flex flex-col gap-2">
          <span className="text-[11px] font-medium text-slate-400 px-1">{cat}</span>
          <div className="grid grid-cols-2 gap-2">
            {PALETTE_ITEMS.filter(item => item.category === cat).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addComponent(targetParentId, item.type)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-cyan-500/50 text-slate-200 transition-all text-left shadow-sm hover:scale-[1.02] active:scale-95"
                  title={`Insertar ${item.label} en el contenedor activo`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-900/80 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
