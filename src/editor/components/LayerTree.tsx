import React from 'react';
import { UIComponentNode } from '../../core/ast/schema.ts';
import { useEditorStore } from '../state/editorStore.ts';
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
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
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isRoot,
  canMoveUp,
  canMoveDown,
}) => {
  const {
    selectedComponentId,
    selectComponent,
    deleteComponent,
    moveComponent,
    duplicateComponent,
  } = useEditorStore();

  const isSelected = selectedComponentId === node.id;
  const Icon = TYPE_ICONS[node.type] || Square;

  return (
    <div className="flex flex-col">
      <div
        onClick={() => selectComponent(node.id)}
        style={{ paddingLeft: `${level * 14 + 6}px` }}
        className={`group flex items-center justify-between py-1.5 pr-1.5 rounded cursor-pointer text-xs transition-colors ${
          isSelected
            ? 'bg-zinc-800 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate mr-1">
          {node.children && node.children.length > 0 && (
            <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
          )}
          <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{node.name || node.type}</span>
        </div>

        {/* Acciones de reordenación y edición rápida */}
        {!isRoot && (
          <div
            className={`flex items-center gap-0.5 shrink-0 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity`}
          >
            {/* Mover hacia arriba */}
            <button
              disabled={!canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                moveComponent(node.id, 'up');
              }}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-zinc-700/60 transition"
              title="Mover arriba"
            >
              <ChevronUp className="w-3 h-3" />
            </button>

            {/* Mover hacia abajo */}
            <button
              disabled={!canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                moveComponent(node.id, 'down');
              }}
              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-zinc-700/60 transition"
              title="Mover abajo"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Duplicar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateComponent(node.id);
              }}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700/60 transition"
              title="Duplicar elemento"
            >
              <Copy className="w-3 h-3" />
            </button>

            {/* Eliminar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteComponent(node.id);
              }}
              className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-950/40 transition"
              title="Eliminar elemento"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {node.children?.map((child, idx) => (
        <TreeNode
          key={child.id}
          node={child}
          level={level + 1}
          canMoveUp={idx > 0}
          canMoveDown={idx < (node.children?.length ?? 0) - 1}
        />
      ))}
    </div>
  );
};

export const LayerTree: React.FC = () => {
  const {
    ast,
    selectedScreenId,
    selectedComponentId,
    moveComponent,
    duplicateComponent,
    deleteComponent,
  } = useEditorStore();

  const screen = ast.screens.find(s => s.id === selectedScreenId);

  if (!screen) {
    return <div className="p-3 text-xs text-zinc-500">Sin pantalla seleccionada</div>;
  }

  const isRootSelected = selectedComponentId === screen.rootComponent.id;
  const hasSelection = Boolean(selectedComponentId && !isRootSelected);

  return (
    <div className="flex flex-col gap-1.5 p-3 text-xs">
      {/* Barra de título con controles rápidos para el elemento seleccionado */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-zinc-400">
          Jerarquía de Capas
        </span>

        {hasSelection && (
          <div className="flex items-center gap-1 bg-[#18181c] border border-zinc-800 rounded px-1.5 py-0.5">
            <button
              onClick={() => moveComponent(selectedComponentId!, 'up')}
              className="p-0.5 text-zinc-400 hover:text-white rounded transition"
              title="Subir posición"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => moveComponent(selectedComponentId!, 'down')}
              className="p-0.5 text-zinc-400 hover:text-white rounded transition"
              title="Bajar posición"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="w-px h-2.5 bg-zinc-700 mx-0.5" />
            <button
              onClick={() => duplicateComponent(selectedComponentId!)}
              className="p-0.5 text-zinc-400 hover:text-white rounded transition"
              title="Duplicar"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteComponent(selectedComponentId!)}
              className="p-0.5 text-zinc-400 hover:text-rose-400 rounded transition"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col bg-[#0f0f12] border border-zinc-800/80 rounded-md p-1.5 max-h-[380px] overflow-y-auto">
        <TreeNode node={screen.rootComponent} level={0} isRoot />
      </div>
    </div>
  );
};
