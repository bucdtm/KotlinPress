import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { UIComponentNode, LogicAction } from '../../core/ast/schema.ts';
import { Box, Trash2, Plus } from 'lucide-react';

function findNode(root: UIComponentNode, id: string): UIComponentNode | null {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const res = findNode(child, id);
      if (res) return res;
    }
  }
  return null;
}

export const PropertyInspector: React.FC = () => {
  const {
    ast,
    selectedScreenId,
    selectedComponentId,
    updateComponentProps,
    updateComponentModifier,
    deleteComponent,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'props' | 'modifiers' | 'logic'>('props');

  const screen = ast.screens.find(s => s.id === selectedScreenId);
  const selectedNode = screen && selectedComponentId ? findNode(screen.rootComponent, selectedComponentId) : null;

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 text-xs">
        <Box className="w-8 h-8 mb-2 text-slate-600 stroke-1" />
        <p className="font-medium text-slate-400">Ningún componente seleccionado</p>
        <p className="mt-1">Haz clic en cualquier elemento en el simulador o en el árbol de capas para editar sus propiedades y lógica.</p>
      </div>
    );
  }

  const props = selectedNode.props || {};
  const mod = selectedNode.modifier || {};
  const isRoot = screen?.rootComponent.id === selectedNode.id;

  // Acciones para lógica
  const handleAddAction = (action: LogicAction) => {
    const currentActions = selectedNode.events?.onClick ? [...selectedNode.events.onClick] : [];
    currentActions.push(action);
    const updatedEvents = { ...selectedNode.events, onClick: currentActions };
    // Actualizar vía store
    const { ast: currentAst } = useEditorStore.getState();
    const newAst = JSON.parse(JSON.stringify(currentAst));
    const targetScreen = newAst.screens.find((s: any) => s.id === selectedScreenId);
    if (targetScreen) {
      findNode(targetScreen.rootComponent, selectedNode.id)!.events = updatedEvents;
      useEditorStore.setState({ ast: newAst });
    }
  };

  const handleRemoveAction = (index: number) => {
    if (!selectedNode.events?.onClick) return;
    const newActions = [...selectedNode.events.onClick];
    newActions.splice(index, 1);
    const updatedEvents = { ...selectedNode.events, onClick: newActions };
    const { ast: currentAst } = useEditorStore.getState();
    const newAst = JSON.parse(JSON.stringify(currentAst));
    const targetScreen = newAst.screens.find((s: any) => s.id === selectedScreenId);
    if (targetScreen) {
      findNode(targetScreen.rootComponent, selectedNode.id)!.events = updatedEvents;
      useEditorStore.setState({ ast: newAst });
    }
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header del Inspector */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/40">
        <div>
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
            {selectedNode.type}
          </span>
          <h3 className="font-semibold text-slate-200 truncate">{selectedNode.name || selectedNode.type}</h3>
        </div>
        {!isRoot && (
          <button
            onClick={() => deleteComponent(selectedNode.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
            title="Eliminar elemento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-[11px] font-medium bg-slate-900/60">
        <button
          onClick={() => setActiveTab('props')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'props'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Propiedades
        </button>
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'modifiers'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Modifiers
        </button>
        <button
          onClick={() => setActiveTab('logic')}
          className={`flex-1 py-2 text-center transition-colors ${
            activeTab === 'logic'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lógica / Eventos
        </button>
      </div>

      {/* Contenido del Tab */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'props' && (
          <div className="flex flex-col gap-3">
            {/* Texto y bindings */}
            {selectedNode.type === 'Text' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Texto Estático</label>
                  <input
                    type="text"
                    value={props.text || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { text: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vincular a Variable (Binding)</label>
                  <select
                    value={props.textBinding || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { textBinding: e.target.value || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="">(Ninguna - usar texto estático)</option>
                    {screen?.stateVariables.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Tamaño Fuente (sp)</label>
                    <input
                      type="number"
                      value={props.fontSize || 16}
                      onChange={(e) => updateComponentProps(selectedNode.id, { fontSize: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Peso (FontWeight)</label>
                    <select
                      value={props.fontWeight || 'Normal'}
                      onChange={(e) => updateComponentProps(selectedNode.id, { fontWeight: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="Bold">Bold</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Botones */}
            {(selectedNode.type === 'Button' || selectedNode.type === 'OutlinedButton') && (
              <div>
                <label className="block text-slate-400 mb-1">Texto del Botón</label>
                <input
                  type="text"
                  value={props.label || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { label: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* Inputs de texto */}
            {selectedNode.type === 'OutlinedTextField' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Etiqueta (Label)</label>
                  <input
                    type="text"
                    value={props.label || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { label: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Variable de Estado Vinculada</label>
                  <select
                    value={props.valueBinding || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { valueBinding: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="">Selecciona variable...</option>
                    {screen?.stateVariables.filter(v => v.type === 'String').map(v => (
                      <option key={v.id} value={v.name}>{v.name} (String)</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Switch */}
            {selectedNode.type === 'Switch' && (
              <div>
                <label className="block text-slate-400 mb-1">Variable Booleana Vinculada</label>
                <select
                  value={props.checkedBinding || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { checkedBinding: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                >
                  <option value="">Selecciona variable...</option>
                  {screen?.stateVariables.filter(v => v.type === 'Boolean').map(v => (
                    <option key={v.id} value={v.name}>{v.name} (Boolean)</option>
                  ))}
                </select>
              </div>
            )}

            {/* LazyColumn */}
            {selectedNode.type === 'LazyColumn' && (
              <div>
                <label className="block text-slate-400 mb-1">Variable de Lista Vinculada</label>
                <select
                  value={props.itemsBinding || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { itemsBinding: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                >
                  <option value="">Selecciona variable de lista...</option>
                  {screen?.stateVariables.filter(v => v.type.startsWith('List')).map(v => (
                    <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Column Layout */}
            {selectedNode.type === 'Column' && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Alineación Vertical</label>
                  <select
                    value={props.verticalArrangement || 'Top'}
                    onChange={(e) => updateComponentProps(selectedNode.id, { verticalArrangement: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="Top">Top</option>
                    <option value="Center">Center</option>
                    <option value="Bottom">Bottom</option>
                    <option value="SpaceBetween">SpaceBetween</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Alineación Horizontal</label>
                  <select
                    value={props.horizontalAlignment || 'Start'}
                    onChange={(e) => updateComponentProps(selectedNode.id, { horizontalAlignment: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="Start">Start</option>
                    <option value="CenterHorizontally">CenterHorizontally</option>
                    <option value="End">End</option>
                  </select>
                </div>
              </>
            )}

            {/* Spacer */}
            {selectedNode.type === 'Spacer' && (
              <div>
                <label className="block text-slate-400 mb-1">Altura (dp)</label>
                <input
                  type="number"
                  value={props.size || 16}
                  onChange={(e) => updateComponentProps(selectedNode.id, { size: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'modifiers' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(mod.fillMaxSize)}
                  onChange={(e) => updateComponentModifier(selectedNode.id, { fillMaxSize: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300">fillMaxSize()</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(mod.fillMaxWidth)}
                  onChange={(e) => updateComponentModifier(selectedNode.id, { fillMaxWidth: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-slate-300">fillMaxWidth()</span>
              </label>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <label className="block text-slate-400 mb-1">Padding General (dp)</label>
              <input
                type="number"
                value={mod.paddingAll ?? 0}
                onChange={(e) => updateComponentModifier(selectedNode.id, { paddingAll: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Esquinas Redondeadas (dp)</label>
              <input
                type="number"
                value={mod.cornerRadius ?? 0}
                onChange={(e) => updateComponentModifier(selectedNode.id, { cornerRadius: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}

        {activeTab === 'logic' && (
          <div className="flex flex-col gap-3">
            <span className="text-slate-400 font-medium">Acciones al hacer clic (onClick):</span>

            {/* Lista de acciones existentes */}
            <div className="flex flex-col gap-1.5">
              {(selectedNode.events?.onClick || []).length === 0 ? (
                <span className="text-slate-500 text-[11px] italic">No hay acciones asignadas.</span>
              ) : (
                selectedNode.events?.onClick?.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-cyan-400">{act.type}</span>
                      <div className="text-slate-300 text-[10px]">
                        {'targetVar' in act && `Variable: ${act.targetVar} `}
                        {'amount' in act && `(±${act.amount})`}
                        {'destinationRoute' in act && `Ruta: /${act.destinationRoute}`}
                        {'targetListVar' in act && `Lista: ${act.targetListVar}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAction(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Añadir nueva acción rápida */}
            <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
              <span className="text-slate-400 text-[11px] font-medium">Añadir disparador rápido:</span>

              <div className="grid grid-cols-1 gap-1.5">
                {/* Sumar 1 */}
                {screen?.stateVariables.filter(v => v.type === 'Int').map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleAddAction({ type: 'INCREMENT_STATE', targetVar: v.name, amount: 1 })}
                    className="flex items-center gap-1.5 text-left p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Sumar 1 a <b className="text-emerald-300">{v.name}</b></span>
                  </button>
                ))}

                {/* Restar 1 */}
                {screen?.stateVariables.filter(v => v.type === 'Int').map(v => (
                  <button
                    key={`dec-${v.id}`}
                    onClick={() => handleAddAction({ type: 'DECREMENT_STATE', targetVar: v.name, amount: 1 })}
                    className="flex items-center gap-1.5 text-left p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>Restar 1 a <b className="text-amber-300">{v.name}</b></span>
                  </button>
                ))}

                {/* Navegación a otras pantallas */}
                {ast.screens
                  .filter(s => s.id !== selectedScreenId)
                  .map(targetScreen => (
                    <button
                      key={targetScreen.id}
                      onClick={() => handleAddAction({ type: 'NAVIGATE', destinationRoute: targetScreen.route })}
                      className="flex items-center gap-1.5 text-left p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200"
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Navegar a <b className="text-cyan-300">{targetScreen.name}</b></span>
                    </button>
                  ))}

                {/* Volver atrás */}
                <button
                  onClick={() => handleAddAction({ type: 'NAVIGATE_BACK' })}
                  className="flex items-center gap-1.5 text-left p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>Volver a pantalla anterior (popBackStack)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
