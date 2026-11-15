import React from 'react';
import { UIComponentNode } from '../../core/ast/schema.ts';
import { useEditorStore } from '../state/editorStore.ts';
import {
  ChevronRight,
  Trash2,
  Columns,
  Rows,
  Layers,
  Square,
  List,
  Type,
  MousePointerClick,
  TextCursorInput,
  ToggleLeft,
  BetweenVerticalEnd,
  Minus,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  Column: Columns,
  Row: Rows,
  Card: Layers,
  Box: Square,
  LazyColumn: List,
  Text: Type,
  Button: MousePointerClick,
  OutlinedButton: MousePointerClick,
  OutlinedTextField: TextCursorInput,
  Switch: ToggleLeft,
  Spacer: BetweenVerticalEnd,
  Divider: Minus,
};

interface TreeNodeProps {
  node: UIComponentNode;
  level: number;
  isRoot?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, isRoot }) => {
  const { selectedComponentId, selectComponent, deleteComponent } = useEditorStore();
  const isSelected = selectedComponentId === node.id;
  const Icon = TYPE_ICONS[node.type] || Square;

  return (
    <div className="flex flex-col">
      <div
        onClick={() => selectComponent(node.id)}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        className={`flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer text-xs transition-colors ${
          isSelected
            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold'
            : 'text-slate-300 hover:bg-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {node.children && node.children.length > 0 && (
            <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
          )}
          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{node.name || node.type}</span>
        </div>

        {!isRoot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteComponent(node.id);
            }}
            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition"
            title="Eliminar componente"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {node.children?.map(child => (
        <TreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
};

export const LayerTree: React.FC = () => {
  const { ast, selectedScreenId } = useEditorStore();
  const screen = ast.screens.find(s => s.id === selectedScreenId);

  if (!screen) {
    return <div className="p-4 text-xs text-slate-500">Sin pantalla seleccionada</div>;
  }

  return (
    <div className="flex flex-col gap-2 p-3 text-xs">
      <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] px-1">
        Árbol de Componentes (Capas)
      </div>
      <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl p-2 max-h-[380px] overflow-y-auto">
        <TreeNode node={screen.rootComponent} level={0} isRoot />
      </div>
    </div>
  );
};
