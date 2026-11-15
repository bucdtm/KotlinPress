import React, { useState } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { CustomKotlinFile, CustomFileKind } from '../../core/ast/schema.ts';
import {
  FileCode,
  Plus,
  Trash2,
  Check,
  Save,
  Layers,
  Database,
  Code2,
  Sparkles,
} from 'lucide-react';

interface PresetClass {
  label: string;
  kind: CustomFileKind;
  fileName: string;
  template: string;
}

const CLASS_PRESETS: PresetClass[] = [
  {
    label: 'Data Class (Modelo)',
    kind: 'data_class',
    fileName: 'Alumno.kt',
    template: `data class Alumno(
    val id: Int,
    val nombre: String,
    val curso: String,
    val notaMedia: Double = 0.0
)`,
  },
  {
    label: 'Enum Class (Opciones)',
    kind: 'enum',
    fileName: 'Categoria.kt',
    template: `enum class Categoria {
    GENERAL,
    URGENTE,
    PENDIENTE
}`,
  },
  {
    label: 'Objeto Singleton (Datos)',
    kind: 'util',
    fileName: 'RepositorioDatos.kt',
    template: `object RepositorioDatos {
    val itemsEjemplo = listOf(
        "Aprender Kotlin",
        "Diseñar con Compose",
        "Aprobar DAM"
    )
}`,
  },
  {
    label: 'Clase de Utilidad',
    kind: 'class',
    fileName: 'CalculadoraUtils.kt',
    template: `class CalculadoraUtils {
    fun calcularTotal(precio: Double, iva: Double = 0.21): Double {
        return precio * (1 + iva)
    }
}`,
  },
];

export const ClassManager: React.FC = () => {
  const { ast, addCustomFile, updateCustomFile, deleteCustomFile } = useEditorStore();
  const customFiles = ast.customFiles || [];

  const [selectedFileId, setSelectedFileId] = useState<string | null>(customFiles[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);

  // Formulario de nueva clase
  const [newFileName, setNewFileName] = useState('');
  const [newKind, setNewKind] = useState<CustomFileKind>('data_class');
  const [newContent, setNewContent] = useState('');

  // Edición del archivo activo
  const activeFile = customFiles.find(f => f.id === selectedFileId);
  const [editorContent, setEditorContent] = useState<string>(activeFile?.content || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sincronizar editor si cambia el archivo seleccionado
  React.useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      setSavedSuccess(false);
    }
  }, [activeFile?.id]);

  const handleApplyPreset = (preset: PresetClass) => {
    let finalName = preset.fileName;
    let count = 1;
    while (customFiles.some(f => f.name === finalName)) {
      finalName = finalName.replace('.kt', '') + `_${count++}.kt`;
    }

    setNewFileName(finalName);
    setNewKind(preset.kind);
    setNewContent(preset.template);
    setIsCreating(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const cleanName = newFileName.trim().endsWith('.kt') ? newFileName.trim() : `${newFileName.trim()}.kt`;

    const newFile: CustomKotlinFile = {
      id: `custom-file-${Date.now()}`,
      name: cleanName,
      packageSuffix: 'models',
      kind: newKind,
      content: newContent || `// ${cleanName}\n`,
    };

    addCustomFile(newFile);
    setSelectedFileId(newFile.id);
    setIsCreating(false);
    setNewFileName('');
    setNewContent('');
  };

  const handleSaveActive = () => {
    if (!activeFile) return;
    updateCustomFile(activeFile.id, { content: editorContent });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header del Gestor */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-[#121215]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#7f52ff]" />
          <div>
            <h3 className="font-semibold text-zinc-100 text-xs">Clases y Modelos Kotlin</h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              {customFiles.length} {customFiles.length === 1 ? 'archivo' : 'archivos'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating);
            if (!isCreating) {
              setNewFileName('NuevoModelo.kt');
              setNewKind('data_class');
              setNewContent(CLASS_PRESETS[0].template);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#7f52ff] hover:bg-[#9068ff] text-white rounded text-[11px] font-medium transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Clase</span>
        </button>
      </div>

      {/* Plantillas Rápidas con 1 Clic */}
      {!isCreating && (
        <div className="p-2 border-b border-zinc-800 bg-[#0d0d10] flex flex-col gap-1.5">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-amber-400" /> Plantillas de Clase Rápidas:
          </span>
          <div className="grid grid-cols-2 gap-1">
            {CLASS_PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center gap-1.5 p-1.5 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-[10px] text-zinc-300 hover:text-white transition text-left"
                title={`Crear ${preset.label}`}
              >
                <Code2 className="w-3 h-3 text-[#7f52ff] shrink-0" />
                <span className="truncate">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de Nueva Clase */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-3 border-b border-zinc-800 bg-[#16161c] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-200">Crear Nueva Clase Kotlin</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-0.5">Nombre del Archivo</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="ej: Tarea.kt"
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono outline-none focus:border-[#7f52ff]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-0.5">Tipo de Clase</label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as any)}
                className="w-full bg-[#0f0f12] border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#7f52ff]"
              >
                <option value="data_class">Data Class (Modelo)</option>
                <option value="enum">Enum Class</option>
                <option value="class">Class estándar</option>
                <option value="util">Objeto / Singleton</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-0.5">Código Fuente Kotlin</label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full bg-[#0f0f12] border border-zinc-800 rounded p-2 text-[11px] font-mono text-zinc-200 outline-none focus:border-[#7f52ff] resize-none"
            />
          </div>

          <div className="flex justify-end gap-1.5">
            <button
              type="submit"
              className="px-3 py-1 bg-[#7f52ff] hover:bg-[#9068ff] text-white rounded font-medium text-xs transition"
            >
              Guardar y Crear Archivo
            </button>
          </div>
        </form>
      )}

      {/* Lista de Archivos y Editor de Código */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Selector de Archivos (Pills horizontales) */}
        <div className="flex items-center gap-1 p-2 border-b border-zinc-800 bg-[#0f0f12] overflow-x-auto shrink-0">
          {customFiles.length === 0 ? (
            <span className="text-[11px] text-zinc-500 italic px-1">
              Sin clases personalizadas. Pulsa "Nueva Clase" o importa código.
            </span>
          ) : (
            customFiles.map(file => {
              const isSelected = file.id === selectedFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition text-xs shrink-0 select-none ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-medium border border-[#7f52ff]/40 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#b299ff]" />
                  <span className="font-mono text-[11px]">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomFile(file.id);
                      if (selectedFileId === file.id) {
                        const remaining = customFiles.filter(f => f.id !== file.id);
                        setSelectedFileId(remaining[0]?.id || null);
                      }
                    }}
                    className="p-0.5 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-700/50"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Editor de Código de la Clase Seleccionada */}
        {activeFile ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0d]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 bg-[#111116] text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-zinc-200">{activeFile.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#7f52ff]/20 text-[#b299ff] border border-[#7f52ff]/40 uppercase">
                  {activeFile.kind}
                </span>
              </div>

              <button
                onClick={handleSaveActive}
                className={`flex items-center gap-1 px-2.5 py-0.8 rounded text-xs font-medium transition ${
                  savedSuccess
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-[#7f52ff] hover:bg-[#9068ff] text-white'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Guardado</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="flex-1 p-3 bg-transparent text-zinc-200 font-mono text-[11px] leading-relaxed outline-none resize-none select-text"
              placeholder="// Escribe aquí tu código Kotlin..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <Layers className="w-8 h-8 mb-2 text-zinc-600 stroke-1" />
            <p className="text-zinc-400 font-medium">Ninguna clase seleccionada</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Crea una data class o modelo para tus pantallas o importa código Kotlin existente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
