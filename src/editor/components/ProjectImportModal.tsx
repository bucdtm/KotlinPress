import React, { useState, useRef } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import {
  parseAndroidProjectZip,
  parseAndroidProjectFiles,
  ProjectImportResult,
  ProjectFileInput,
} from '../../core/parser/projectParser.ts';
import {
  FolderArchive,
  Upload,
  FolderInput,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Variable,
  Package,
  Globe,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (appName: string) => void;
}

export const ProjectImportModal: React.FC<ProjectImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { loadAST, selectScreen } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'zip' | 'folder'>('zip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProjectImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'screens' | 'classes' | 'strings'>('screens');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleZipFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await parseAndroidProjectZip(file);
      if (res.success && res.ast) {
        setResult(res);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar el archivo ZIP.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFolderFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const inputs: ProjectFileInput[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const lower = f.name.toLowerCase();
        if (
          lower.endsWith('.kt') ||
          lower.endsWith('.kts') ||
          lower.endsWith('.xml') ||
          lower.endsWith('.json') ||
          lower.endsWith('.properties') ||
          lower.endsWith('.gradle')
        ) {
          const content = await f.text();
          const relativePath = (f as any).webkitRelativePath || f.name;
          inputs.push({
            path: relativePath.replace(/\\/g, '/'),
            content,
          });
        }
      }

      if (inputs.length === 0) {
        setErrorMsg('La carpeta seleccionada no contiene archivos de código Kotlin o configuración válidos.');
        setIsProcessing(false);
        return;
      }

      const res = parseAndroidProjectFiles(inputs);
      if (res.success && res.ast) {
        setResult(res);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al leer los archivos de la carpeta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const first = droppedFiles[0];
    if (first.name.toLowerCase().endsWith('.zip')) {
      setActiveTab('zip');
      await handleZipFile(first);
    } else if (droppedFiles.length > 1 || (first as any).webkitRelativePath) {
      setActiveTab('folder');
      await handleFolderFiles(droppedFiles);
    } else {
      setErrorMsg('Por favor arrastra un archivo comprimido .ZIP de Android Studio.');
    }
  };

  const handleApplyImport = () => {
    if (!result?.ast) return;

    loadAST(result.ast);
    const startId = result.ast.startScreenId || result.ast.screens[0]?.id;
    if (startId) {
      selectScreen(startId);
    }

    if (onSuccess) {
      onSuccess(result.ast.appInfo.appName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#15151a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#7f52ff]/20 border border-[#7f52ff]/40 flex items-center justify-center text-[#a78bfa]">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Importar Proyecto Completo de Android Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Compose & Architecture
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Carga un proyecto existente empaquetado en <code className="text-[#a78bfa]">.ZIP</code> o selecciona una carpeta con código Jetpack Compose.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de modo de carga */}
        <div className="px-5 py-2.5 border-b border-zinc-800/80 bg-[#101014] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('zip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'zip'
                  ? 'bg-[#7f52ff]/20 text-[#bba2ff] border border-[#7f52ff]/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Archivo ZIP (.zip)</span>
            </button>
            <button
              onClick={() => setActiveTab('folder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'folder'
                  ? 'bg-[#7f52ff]/20 text-[#bba2ff] border border-[#7f52ff]/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Carpeta de Proyecto</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Compatible con Android Studio Ladybug/Koala, KotlinPress y proyectos Compose</span>
          </div>
        </div>

        {/* Zona de Arrastrar y Soltar / Selección */}
        {!result && (
          <div className="p-6 flex flex-col items-center justify-center">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                isDragging
                  ? 'border-[#7f52ff] bg-[#7f52ff]/10 scale-[1.01]'
                  : 'border-zinc-700/80 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-900/70'
              }`}
              onClick={() => {
                if (activeTab === 'zip') fileInputRef.current?.click();
                else folderInputRef.current?.click();
              }}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center py-6 gap-3">
                  <Loader2 className="w-10 h-10 text-[#7f52ff] animate-spin" />
                  <p className="text-zinc-200 font-medium text-sm">Descomprimiendo y analizando proyecto...</p>
                  <p className="text-zinc-500 text-xs">
                    Extrayendo pantallas Composable, modelos de datos, strings.xml y estructura de navegación.
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#7f52ff]/10 border border-[#7f52ff]/30 flex items-center justify-center text-[#a78bfa] mb-3.5 shadow-inner">
                    {activeTab === 'zip' ? (
                      <Upload className="w-7 h-7" />
                    ) : (
                      <FolderInput className="w-7 h-7" />
                    )}
                  </div>

                  <p className="text-zinc-200 font-semibold text-sm mb-1">
                    {activeTab === 'zip'
                      ? 'Arrastra aquí tu archivo .ZIP o haz clic para buscarlo'
                      : 'Haz clic para seleccionar la carpeta raíz del proyecto'}
                  </p>
                  <p className="text-zinc-400 text-xs max-w-md mb-4 leading-relaxed">
                    Detectaremos automáticamente el nombre del paquete, recursos <code className="text-zinc-300">strings.xml</code>, pantallas <code className="text-zinc-300">@Composable</code> y clases de modelo.
                  </p>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition"
                  >
                    {activeTab === 'zip' ? 'Seleccionar archivo .zip' : 'Seleccionar Carpeta...'}
                  </button>
                </>
              )}
            </div>

            {/* Inputs ocultos */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleZipFile(f);
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory es soportado por navegadores modernos
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFolderFiles(e.target.files);
                }
              }}
            />

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg border border-rose-800/60 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2 max-w-2xl w-full">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Vista previa del proyecto analizado */}
        {result && (
          <div className="flex-1 overflow-hidden flex flex-col p-5 gap-4">
            {/* Tarjeta de Resumen del Proyecto */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#16161c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#7f52ff]/20 border border-[#7f52ff]/40 flex items-center justify-center text-[#a78bfa] font-bold text-base">
                  {result.summary.appName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-100 text-sm">{result.summary.appName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                      Válido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400 font-mono">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{result.summary.packageName}</span>
                  </div>
                </div>
              </div>

              {/* Métricas destacadas */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col items-center">
                  <span className="text-[10px] text-zinc-400 font-medium">Pantallas</span>
                  <span className="text-sm font-bold text-purple-300">{result.summary.screensCount}</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col items-center">
                  <span className="text-[10px] text-zinc-400 font-medium">Modelos / Clases</span>
                  <span className="text-sm font-bold text-cyan-300">{result.summary.classesCount}</span>
                </div>
                <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col items-center">
                  <span className="text-[10px] text-zinc-400 font-medium">Strings XML</span>
                  <span className="text-sm font-bold text-amber-300">{result.summary.stringsCount}</span>
                </div>
              </div>
            </div>

            {/* Pestañas de desglose */}
            <div className="flex border-b border-zinc-800 text-xs font-medium">
              <button
                onClick={() => setPreviewTab('screens')}
                className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${
                  previewTab === 'screens'
                    ? 'border-[#7f52ff] text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pantallas Compose ({result.summary.screensCount})</span>
              </button>
              <button
                onClick={() => setPreviewTab('classes')}
                className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${
                  previewTab === 'classes'
                    ? 'border-[#7f52ff] text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Clases y Modelos ({result.summary.classesCount})</span>
              </button>
              <button
                onClick={() => setPreviewTab('strings')}
                className={`px-4 py-2 flex items-center gap-2 border-b-2 transition ${
                  previewTab === 'strings'
                    ? 'border-[#7f52ff] text-zinc-100 font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Textos strings.xml ({result.summary.stringsCount})</span>
              </button>
            </div>

            {/* Contenido de desglose scrollable */}
            <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-2.5">
              {previewTab === 'screens' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.summary.screens.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-purple-800/40 bg-purple-950/20 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-100 text-xs truncate">{sc.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          route: {sc.route}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400" />
                          {sc.nodeCount} componentes
                        </span>
                        <span className="flex items-center gap-1">
                          <Variable className="w-3 h-3 text-blue-400" />
                          {sc.variableCount} estados
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {previewTab === 'classes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.summary.classes.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-zinc-500 text-xs">
                      No se detectaron clases de datos o modelos adicionales en el proyecto.
                    </div>
                  ) : (
                    result.summary.classes.map((cls, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-cyan-800/40 bg-cyan-950/20 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-100 text-xs truncate">{cls.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
                            {cls.kind}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {cls.packageSuffix ? `models/${cls.name}` : cls.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {previewTab === 'strings' && (
                <div className="rounded-lg border border-zinc-800 bg-[#0d0d10] overflow-hidden">
                  <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {Object.entries(result.summary.strings).length === 0 ? (
                      <div className="p-4 text-center text-zinc-500">
                        No se encontraron entradas en strings.xml
                      </div>
                    ) : (
                      Object.entries(result.summary.strings).map(([k, v]) => (
                        <div key={k} className="p-2 px-3 flex items-center justify-between gap-4">
                          <span className="text-zinc-400 truncate">{k}</span>
                          <span className="text-zinc-200 font-sans truncate text-right">{v}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-800/50 bg-amber-950/25 flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> Notas de importación:
                  </span>
                  <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pie de modal */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#15151a] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            {result ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Listo para cargar en el IDE y previsualizar en el simulador móvil
              </span>
            ) : (
              <span>Los archivos importados reemplazarán el diseño actual en el editor.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {result ? (
              <>
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                >
                  Cargar otro archivo
                </button>
                <button
                  onClick={handleApplyImport}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#7f52ff] hover:bg-[#9068ff] active:bg-[#6f42ef] text-white text-xs font-semibold transition shadow-md cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Cargar Proyecto en KotlinPress</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
