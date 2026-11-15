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
  CircleDot,
  ImageIcon,
  List,
  Layers,
  BetweenVerticalEnd,
  Minus,
} from 'lucide-react';

interface ComponentItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
  category: 'Contenedores' | 'Tipografía y Medios' | 'Entradas e Interacción';
}

const PALETTE_ITEMS: ComponentItem[] = [
  { type: 'Column', label: 'Column', icon: Columns, category: 'Contenedores' },
  { type: 'Row', label: 'Row', icon: Rows, category: 'Contenedores' },
  { type: 'Card', label: 'Card', icon: Layers, category: 'Contenedores' },
  { type: 'Box', label: 'Box', icon: Square, category: 'Contenedores' },
  { type: 'LazyColumn', label: 'LazyColumn', icon: List, category: 'Contenedores' },

  { type: 'Text', label: 'Text', icon: Type, category: 'Tipografía y Medios' },
  { type: 'Image', label: 'Image', icon: ImageIcon, category: 'Tipografía y Medios' },
  { type: 'Spacer', label: 'Spacer', icon: BetweenVerticalEnd, category: 'Tipografía y Medios' },
  { type: 'Divider', label: 'Divider', icon: Minus, category: 'Tipografía y Medios' },

  { type: 'Button', label: 'Button', icon: MousePointerClick, category: 'Entradas e Interacción' },
  { type: 'OutlinedButton', label: 'OutlinedButton', icon: MousePointerClick, category: 'Entradas e Interacción' },
  { type: 'OutlinedTextField', label: 'TextField', icon: TextCursorInput, category: 'Entradas e Interacción' },
  { type: 'RadioButton', label: 'RadioButton', icon: CircleDot, category: 'Entradas e Interacción' },
  { type: 'Switch', label: 'Switch', icon: ToggleLeft, category: 'Entradas e Interacción' },
];

export const ComponentPalette: React.FC = () => {
  const { ast, selectedScreenId, selectedComponentId, addComponent } = useEditorStore();

  const currentScreen = ast.screens.find(s => s.id === selectedScreenId);
  const targetParentId = selectedComponentId || currentScreen?.rootComponent.id || '';

  const categories = ['Contenedores', 'Tipografía y Medios', 'Entradas e Interacción'] as const;

  return (
    <div className="flex flex-col gap-4 p-3 text-xs">
      {categories.map(cat => (
        <div key={cat} className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400 px-1">{cat}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {PALETTE_ITEMS.filter(item => item.category === cat).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addComponent(targetParentId, item.type)}
                  className="flex items-center gap-2 p-2 rounded-md bg-[#18181c] hover:bg-[#222228] border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors text-left"
                  title={`Insertar ${item.label} en el diseño`}
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
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
