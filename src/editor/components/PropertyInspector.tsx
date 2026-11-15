import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { UIComponentNode, LogicAction } from '../../core/ast/schema.ts';
import {
  Box,
  Trash2,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
} from 'lucide-react';

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
          <div className="flex flex-col gap-3">
            {/* COMPONENTE TEXTO: HERRAMIENTAS COMPLETAS DE EDICIÓN Y ALINEACIÓN */}
            {selectedNode.type === 'Text' && (
              <>
                {/* 1. Texto Estático */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Contenido del Texto</label>
                  <textarea
                    rows={2}
                    value={props.text || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { text: e.target.value })}
                    placeholder="Escribe el texto aquí..."
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff] resize-none"
                  />
                </div>

                {/* 2. Enlace a Variable de Estado */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Vincular a Variable de Estado (Binding)</label>
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

                {/* 3. ALINEACIÓN DEL TEXTO (BOTONES DEDICADOS) */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Alineación del Texto</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { textAlign: 'Start' })}
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        (props.textAlign || 'Start') === 'Start'
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Alinear a la Izquierda (Start)"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { textAlign: 'Center' })}
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.textAlign === 'Center'
                          ? 'bg-[#7f52ff] text-white shadow-xs font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Centrar Texto (Center)"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { textAlign: 'End' })}
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.textAlign === 'End'
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Alinear a la Derecha (End)"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { textAlign: 'Justify' })}
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.textAlign === 'Justify'
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Justificar Texto (Justify)"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4. ESTILOS RÁPIDOS: Negrita, Cursiva, Subrayado, Tachado */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Formato de Texto</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() =>
                        updateComponentProps(selectedNode.id, {
                          fontWeight: props.fontWeight === 'Bold' ? 'Normal' : 'Bold',
                        })
                      }
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.fontWeight === 'Bold'
                          ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Negrita"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateComponentProps(selectedNode.id, {
                          fontStyle: props.fontStyle === 'Italic' ? 'Normal' : 'Italic',
                        })
                      }
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.fontStyle === 'Italic'
                          ? 'bg-zinc-800 text-zinc-100 italic border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Cursiva"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateComponentProps(selectedNode.id, {
                          textDecoration: props.textDecoration === 'Underline' ? 'None' : 'Underline',
                        })
                      }
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.textDecoration === 'Underline'
                          ? 'bg-zinc-800 text-zinc-100 underline border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Subrayado"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        updateComponentProps(selectedNode.id, {
                          textDecoration: props.textDecoration === 'LineThrough' ? 'None' : 'LineThrough',
                        })
                      }
                      className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                        props.textDecoration === 'LineThrough'
                          ? 'bg-zinc-800 text-zinc-100 line-through border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Tachado"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 5. TAMAÑO DE FUENTE: Presets Rápidos + Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-400">Tamaño (sp)</label>
                    <span className="text-[10px] text-zinc-500 font-mono">{props.fontSize || 16} sp</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    {[12, 14, 16, 20, 24, 32, 40].map(size => (
                      <button
                        key={size}
                        onClick={() => updateComponentProps(selectedNode.id, { fontSize: size })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          (props.fontSize || 16) === size
                            ? 'bg-[#7f52ff] border-[#7f52ff] text-white font-medium'
                            : 'bg-[#18181c] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={props.fontSize || 16}
                    onChange={(e) => updateComponentProps(selectedNode.id, { fontSize: Number(e.target.value) })}
                    className="w-full accent-[#7f52ff]"
                  />
                </div>

                {/* 6. PESO DE FUENTE (Weight) */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Peso de Fuente (FontWeight)</label>
                  <select
                    value={props.fontWeight || 'Normal'}
                    onChange={(e) => updateComponentProps(selectedNode.id, { fontWeight: e.target.value as any })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="Normal">Normal (400)</option>
                    <option value="Medium">Medium (500)</option>
                    <option value="SemiBold">SemiBold (600)</option>
                    <option value="Bold">Bold (700)</option>
                    <option value="ExtraBold">ExtraBold (800)</option>
                  </select>
                </div>

                {/* 7. COLOR PERSONALIZADO DEL TEXTO */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Color del Texto</label>
                  <div className="flex items-center gap-2 bg-[#0f0f12] border border-zinc-800 rounded p-1.5">
                    <input
                      type="color"
                      value={props.textColor || '#FFFFFF'}
                      onChange={(e) => updateComponentProps(selectedNode.id, { textColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      placeholder="Heredado del tema"
                      value={props.textColor || ''}
                      onChange={(e) => updateComponentProps(selectedNode.id, { textColor: e.target.value || undefined })}
                      className="flex-1 bg-transparent text-[11px] font-mono text-zinc-200 outline-none uppercase"
                    />
                    {props.textColor && (
                      <button
                        onClick={() => updateComponentProps(selectedNode.id, { textColor: undefined })}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1"
                        title="Restablecer al color del tema"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* 8. ESPACIADO E INTERLINEADO (Letter Spacing & Line Height) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Interletrado (sp)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={props.letterSpacing ?? 0}
                      onChange={(e) => updateComponentProps(selectedNode.id, { letterSpacing: Number(e.target.value) || undefined })}
                      placeholder="0"
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Interlineado (sp)</label>
                    <input
                      type="number"
                      value={props.lineHeight ?? ''}
                      onChange={(e) => updateComponentProps(selectedNode.id, { lineHeight: Number(e.target.value) || undefined })}
                      placeholder="Auto"
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* BOTONES */}
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

            {/* INPUTS DE TEXTO */}
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

            {/* SWITCH */}
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

            {/* RADIO BUTTON */}
            {selectedNode.type === 'RadioButton' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Etiqueta del Radio</label>
                  <input
                    type="text"
                    value={props.label || ''}
                    placeholder="ej: Opción A, Masculino..."
                    onChange={(e) => updateComponentProps(selectedNode.id, { label: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Valor de la Opción (radioValue)</label>
                  <input
                    type="text"
                    value={props.radioValue || ''}
                    placeholder="ej: opcion_1, valor_a"
                    onChange={(e) => updateComponentProps(selectedNode.id, { radioValue: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Variable de Selección (selectedBinding)</label>
                  <select
                    value={props.selectedBinding || ''}
                    onChange={(e) => updateComponentProps(selectedNode.id, { selectedBinding: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  >
                    <option value="">Seleccionar variable String...</option>
                    {screen?.stateVariables.filter(v => v.type === 'String').map(v => (
                      <option key={v.id} value={v.name}>{v.name} (String)</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* IMAGEN */}
            {selectedNode.type === 'Image' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Recurso Drawable Android</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-zinc-500 bg-[#0f0f12] px-2 py-1.5 border border-zinc-800 rounded-l">
                      R.drawable.
                    </span>
                    <input
                      type="text"
                      value={props.imageResource || 'sample_image'}
                      onChange={(e) => updateComponentProps(selectedNode.id, { imageResource: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="flex-1 bg-[#0f0f12] border border-zinc-800 rounded-r px-2 py-1.5 text-zinc-100 font-mono text-xs outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Exportado en <code className="text-zinc-400">res/drawable/sample_image.xml</code>. Puedes sustituirlo por cualquier .png/.xml en tu proyecto.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Descripción Accesible (contentDescription)</label>
                  <input
                    type="text"
                    value={props.contentDescription || ''}
                    placeholder="ej: Logotipo de la app"
                    onChange={(e) => updateComponentProps(selectedNode.id, { contentDescription: e.target.value })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">URL de Previsualización Web (Opcional)</label>
                  <input
                    type="url"
                    value={props.imageUrl || ''}
                    placeholder="https://images.unsplash.com/..."
                    onChange={(e) => updateComponentProps(selectedNode.id, { imageUrl: e.target.value || undefined })}
                    className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-[#7f52ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Ancho (dp)</label>
                    <input
                      type="number"
                      value={mod.width || 120}
                      onChange={(e) => updateComponentModifier(selectedNode.id, { width: Number(e.target.value) || undefined })}
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-0.5">Alto (dp)</label>
                    <input
                      type="number"
                      value={mod.height || 120}
                      onChange={(e) => updateComponentModifier(selectedNode.id, { height: Number(e.target.value) || undefined })}
                      className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* BOX LAYOUT */}
            {selectedNode.type === 'Box' && (
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Alineación del Contenido (contentAlignment)</label>
                <div className="grid grid-cols-3 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800 text-[10px]">
                  {[
                    { label: 'TopStart', val: 'TopStart' },
                    { label: 'TopCenter', val: 'TopCenter' },
                    { label: 'Center', val: 'Center' },
                    { label: 'BottomCenter', val: 'BottomCenter' },
                    { label: 'BottomEnd', val: 'BottomEnd' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => updateComponentProps(selectedNode.id, { contentAlignment: opt.val as any })}
                      className={`py-1.5 rounded transition-colors ${
                        (props.contentAlignment || 'Center') === opt.val
                          ? 'bg-[#7f52ff] text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* LAZY COLUMN */}
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

            {/* COLUMN LAYOUT (BOTONES DE ALINEACIÓN VISUAL) */}
            {selectedNode.type === 'Column' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Alineación Horizontal</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalAlignment: 'Start' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        (props.horizontalAlignment || 'Start') === 'Start'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Izquierda
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalAlignment: 'CenterHorizontally' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        props.horizontalAlignment === 'CenterHorizontally'
                          ? 'bg-[#7f52ff] text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalAlignment: 'End' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        props.horizontalAlignment === 'End'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Derecha
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Distribución Vertical</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalArrangement: 'Top' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        (props.verticalArrangement || 'Top') === 'Top'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Arriba
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalArrangement: 'Center' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.verticalArrangement === 'Center'
                          ? 'bg-[#7f52ff] text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalArrangement: 'Bottom' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.verticalArrangement === 'Bottom'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Abajo
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalArrangement: 'SpaceBetween' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.verticalArrangement === 'SpaceBetween'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Separar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ROW LAYOUT (BOTONES DE ALINEACIÓN VISUAL) */}
            {selectedNode.type === 'Row' && (
              <>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Distribución Horizontal</label>
                  <div className="grid grid-cols-4 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalArrangement: 'Start' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        (props.horizontalArrangement || 'Start') === 'Start'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Inicio
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalArrangement: 'Center' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.horizontalArrangement === 'Center'
                          ? 'bg-[#7f52ff] text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalArrangement: 'End' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.horizontalArrangement === 'End'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Fin
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { horizontalArrangement: 'SpaceBetween' })}
                      className={`py-1.5 rounded text-[10px] transition-colors ${
                        props.horizontalArrangement === 'SpaceBetween'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Separar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Alineación Vertical</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#0f0f12] p-1 rounded-md border border-zinc-800">
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalAlignment: 'Top' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        (props.verticalAlignment || 'Top') === 'Top'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Arriba
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalAlignment: 'CenterVertically' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        props.verticalAlignment === 'CenterVertically'
                          ? 'bg-[#7f52ff] text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Centro
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedNode.id, { verticalAlignment: 'Bottom' })}
                      className={`py-1.5 rounded text-[11px] transition-colors ${
                        props.verticalAlignment === 'Bottom'
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Abajo
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* SPACER */}
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

        {/* MODIFIERS TAB */}
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

        {/* LOGIC TAB */}
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
