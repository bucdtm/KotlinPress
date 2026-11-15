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
        style={{ paddingLeft: `${level * 14 + 6}px` }}
        className={`flex items-center justify-between py-1.5 pr-2 rounded cursor-pointer text-xs transition-colors ${
          isSelected
            ? 'bg-zinc-800 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {node.children && node.children.length > 0 && (
            <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
          )}
          <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{node.name || node.type}</span>
        </div>

        {!isRoot && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteComponent(node.id);
            }}
            className="p-1 text-zinc-500 hover:text-rose-400 rounded transition"
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
    return <div className="p-3 text-xs text-zinc-500">Sin pantalla seleccionada</div>;
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 text-xs">
      <span className="text-[11px] font-medium text-zinc-400 px-1">
        Jerarquía de Capas
      </span>
      <div className="flex flex-col bg-[#0f0f12] border border-zinc-800/80 rounded-md p-1.5 max-h-[360px] overflow-y-auto">
        <TreeNode node={screen.rootComponent} level={0} isRoot />
      </div>
    </div>
  );
};
