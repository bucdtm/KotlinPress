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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500 text-xs">
        <Box className="w-7 h-7 mb-2 text-zinc-600 stroke-1" />
        <p className="font-medium text-zinc-400">Sin componente seleccionado</p>
        <p className="mt-1 text-[11px] text-zinc-500 max-w-[220px]">
          Selecciona un elemento en el móvil o en el árbol de capas para inspeccionar y ajustar sus propiedades.
        </p>
      </div>
    );
  }

  const props = selectedNode.props || {};
  const mod = selectedNode.modifier || {};
  const isRoot = screen?.rootComponent.id === selectedNode.id;

  const handleAddAction = (action: LogicAction) => {
    const currentActions = selectedNode.events?.onClick ? [...selectedNode.events.onClick] : [];
    currentActions.push(action);
    const updatedEvents = { ...selectedNode.events, onClick: currentActions };
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
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-[#121215]">
        <div>
          <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
            {selectedNode.type}
          </span>
          <h3 className="font-medium text-zinc-200 truncate">{selectedNode.name || selectedNode.type}</h3>
        </div>
        {!isRoot && (
          <button
            onClick={() => deleteComponent(selectedNode.id)}
            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition"
            title="Eliminar elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Segmented Control de pestañas */}
      <div className="flex border-b border-zinc-800 text-[11px] font-medium bg-[#0f0f12]">
        <button
          onClick={() => setActiveTab('props')}
          className={`flex-1 py-1.5 text-center transition-colors ${
            activeTab === 'props'
              ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Propiedades
        </button>
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`flex-1 py-1.5 text-center transition-colors ${
            activeTab === 'modifiers'
              ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Modifiers
        </button>
        <button
          onClick={() => setActiveTab('logic')}
          className={`flex-1 py-1.5 text-center transition-colors ${
            activeTab === 'logic'
              ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Lógica
        </button>
      </div>

      {/* Contenido del Tab */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeTab === 'props' && (
          <div className="flex flex-col gap-2.5">
            {selectedNode.type === 'Text' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Texto Estático</label>
                  <input
                    type="text"
                    value={props.text || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { text: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Enlace a Estado (Binding)</label>
                  <select
                    value={props.textBinding || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { textBinding: e.target.value || undefined })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="">(Ninguna - usar texto estático)</option>
                    {screen?.stateVariables.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Tamaño (sp)</label>
                    <input
                      type="number"
                      value={props.fontSize || 16}
                      onChange={(e) => updateComponentProps(selectedNode.id, { fontSize: Number(e.target.value) })}
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Peso (FontWeight)</label>
                    <select
                      value={props.fontWeight || 'Normal'}
                      onChange={(e) => updateComponentProps(selectedNode.id, { fontWeight: e.target.value as any })}
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="Bold">Bold</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {(selectedNode.type === 'Button' || selectedNode.type === 'OutlinedButton') && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Etiqueta del Botón</label>
                <input
                  type="text"
                  value={props.label || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { label: e.target.value })}
                  className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                />
              </div>
            )}

            {selectedNode.type === 'OutlinedTextField' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Etiqueta (Label)</label>
                  <input
                    type="text"
                    value={props.label || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { label: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Variable Vinculada</label>
                  <select
                    value={props.valueBinding || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { valueBinding: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="">Seleccionar variable...</option>
                    {screen?.stateVariables.filter(v => v.type === 'String').map(v => (
                      <option key={v.id} value={v.name}>{v.name} (String)</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'Switch' && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Variable Booleana</label>
                <select
                  value={props.checkedBinding || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { checkedBinding: e.target.value })}
                  className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                >
                  <option value="">Seleccionar variable...</option>
                  {screen?.stateVariables.filter(v => v.type === 'Boolean').map(v => (
                    <option key={v.id} value={v.name}>{v.name} (Boolean)</option>
                  ))}
                </select>
              </div>
            )}

            {selectedNode.type === 'LazyColumn' && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Lista Vinculada</label>
                <select
                  value={props.itemsBinding || ''}
                  onChange={(e) => updateComponentProps(selectedNode.id, { itemsBinding: e.target.value })}
                  className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                >
                  <option value="">Seleccionar lista...</option>
                  {screen?.stateVariables.filter(v => v.type.startsWith('List')).map(v => (
                    <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
                  ))}
                </select>
              </div>
            )}

            {selectedNode.type === 'Column' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Alineación Vertical</label>
                  <select
                    value={props.verticalArrangement || 'Top'}
                    onChange={(e) => updateComponentProps(selectedNode.id, { verticalArrangement: e.target.value as any })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="Top">Top</option>
                    <option value="Center">Center</option>
                    <option value="Bottom">Bottom</option>
                    <option value="SpaceBetween">SpaceBetween</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Alineación Horizontal</label>
                  <select
                    value={props.horizontalAlignment || 'Start'}
                    onChange={(e) => updateComponentProps(selectedNode.id, { horizontalAlignment: e.target.value as any })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="Start">Start</option>
                    <option value="CenterHorizontally">CenterHorizontally</option>
                    <option value="End">End</option>
                  </select>
                </div>
              </>
            )}

            {selectedNode.type === 'Spacer' && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Espaciado (dp)</label>
                <input
                  type="number"
                  value={props.size || 16}
                  onChange={(e) => updateComponentProps(selectedNode.id, { size: Number(e.target.value) })}
                  className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'modifiers' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(mod.fillMaxSize)}
                  onChange={(e) => updateComponentModifier(selectedNode.id, { fillMaxSize: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#7f52ff] focus:ring-0"
                />
                <span className="text-zinc-300">fillMaxSize()</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(mod.fillMaxWidth)}
                  onChange={(e) => updateComponentModifier(selectedNode.id, { fillMaxWidth: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#7f52ff] focus:ring-0"
                />
                <span className="text-zinc-300">fillMaxWidth()</span>
              </label>
            </div>

            <div className="border-t border-zinc-800 pt-2.5">
              <label className="block text-[11px] text-zinc-400 mb-1">Padding General (dp)</label>
              <input
                type="number"
                value={mod.paddingAll ?? 0}
                onChange={(e) => updateComponentModifier(selectedNode.id, { paddingAll: Number(e.target.value) })}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Radio de Esquinas (dp)</label>
              <input
                type="number"
                value={mod.cornerRadius ?? 0}
                onChange={(e) => updateComponentModifier(selectedNode.id, { cornerRadius: Number(e.target.value) })}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
              />
            </div>
          </div>
        )}

        {activeTab === 'logic' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] font-medium text-zinc-400">Acciones al pulsar (onClick):</span>

            <div className="flex flex-col gap-1.5">
              {(selectedNode.events?.onClick || []).length === 0 ? (
                <span className="text-zinc-500 text-[11px] italic">Sin acciones configuradas.</span>
              ) : (
                selectedNode.events?.onClick?.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[#18181c] border border-zinc-800 text-[11px]"
                  >
                    <div>
                      <span className="font-mono text-[#b299ff]">{act.type}</span>
                      <div className="text-zinc-400 text-[10px]">
                        {'targetVar' in act && `Variable: ${act.targetVar} `}
                        {'amount' in act && `(±${act.amount})`}
                        {'destinationRoute' in act && `Ruta: /${act.destinationRoute}`}
                        {'targetListVar' in act && `Lista: ${act.targetListVar}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAction(idx)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-800 pt-2.5 flex flex-col gap-1.5">
              <span className="text-zinc-400 text-[11px] font-medium">Añadir acción predefinida:</span>

              <div className="grid grid-cols-1 gap-1">
                {screen?.stateVariables.filter(v => v.type === 'Int').map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleAddAction({ type: 'INCREMENT_STATE', targetVar: v.name, amount: 1 })}
                    className="flex items-center gap-1.5 text-left p-1.5 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-zinc-300 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#7f52ff]" />
                    <span>Sumar 1 a <b className="text-zinc-100 font-medium">{v.name}</b></span>
                  </button>
                ))}

                {screen?.stateVariables.filter(v => v.type === 'Int').map(v => (
                  <button
                    key={`dec-${v.id}`}
                    onClick={() => handleAddAction({ type: 'DECREMENT_STATE', targetVar: v.name, amount: 1 })}
                    className="flex items-center gap-1.5 text-left p-1.5 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-zinc-300 transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#7f52ff]" />
                    <span>Restar 1 a <b className="text-zinc-100 font-medium">{v.name}</b></span>
                  </button>
                ))}

                {ast.screens
                  .filter(s => s.id !== selectedScreenId)
                  .map(targetScreen => (
                    <button
                      key={targetScreen.id}
                      onClick={() => handleAddAction({ type: 'NAVIGATE', destinationRoute: targetScreen.route })}
                      className="flex items-center gap-1.5 text-left p-1.5 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-zinc-300 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-[#7f52ff]" />
                      <span>Navegar a <b className="text-zinc-100 font-medium">{targetScreen.name}</b></span>
                    </button>
                  ))}

                <button
                  onClick={() => handleAddAction({ type: 'NAVIGATE_BACK' })}
                  className="flex items-center gap-1.5 text-left p-1.5 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-zinc-300 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#7f52ff]" />
                  <span>Volver atrás (popBackStack)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
