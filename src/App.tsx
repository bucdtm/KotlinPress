import React, { useState } from 'react';
import { useEditorStore } from './editor/state/editorStore.ts';
import { ComponentPalette } from './editor/components/ComponentPalette.tsx';
import { LayerTree } from './editor/components/LayerTree.tsx';
import { ScreenManager } from './editor/components/ScreenManager.tsx';
import { StateManager } from './editor/components/StateManager.tsx';
import { PropertyInspector } from './editor/components/PropertyInspector.tsx';
import { KotlinViewer } from './editor/codeview/KotlinViewer.tsx';
import { PhoneSimulator } from './runtime/PhoneSimulator.tsx';
import { downloadAndroidProjectZip } from './core/exporter/zipPackager.ts';
import {
  Code2,
  SlidersHorizontal,
  Layers,
  FileJson,
  DownloadCloud,
  RotateCcw,
  Upload,
  Download,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const { ast, loadAST, resetToSample } = useEditorStore();
  const [leftTab, setLeftTab] = useState<'palette' | 'layers' | 'screens'>('palette');
  const [rightTab, setRightTab] = useState<'inspector' | 'code' | 'json'>('inspector');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ast, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${ast.appInfo.appName}_AST.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.screens && parsed.appInfo) {
            loadAST(parsed);
          } else {
            alert('El archivo no parece ser un AST válido de KotlinPress.');
          }
        } catch {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      await downloadAndroidProjectZip(ast);
    } catch (err) {
      console.error(err);
      alert('Error al generar el ZIP de Android Studio.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden select-none">
      {/* Barra superior de herramientas - Estilo IDE Profesional */}
      <header className="h-12 border-b border-zinc-800/80 bg-[#121215] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Identidad de la herramienta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Logo geométrico discreto de KotlinPress */}
            <div className="w-5 h-5 rounded bg-[#7f52ff] flex items-center justify-center text-white text-[10px] font-black tracking-tight">
              K
            </div>
            <h1 className="text-xs font-semibold text-zinc-100 tracking-tight">
              KotlinPress
            </h1>
          </div>

          <div className="h-3.5 w-px bg-zinc-800" />

          {/* Información del proyecto activo */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-zinc-300">{ast.appInfo.appName}</span>
            <span className="text-[11px] text-zinc-500 font-mono">({ast.appInfo.packageName})</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded font-mono">
              Offline
            </span>
          </div>
        </div>

        {/* Acciones de proyecto */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetToSample}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded transition"
            title="Restablecer proyecto a la plantilla demo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded transition"
            title="Exportar AST JSON"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Exportar JSON</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800 mx-1" />

          {/* Acción principal: Descargar Android Studio ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#7f52ff] hover:bg-[#9068ff] active:bg-[#6f42ef] text-white text-xs font-medium transition disabled:opacity-50"
            title="Descargar proyecto completo compilable en Android Studio"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{isExporting ? 'Empaquetando...' : 'Exportar Proyecto Android (.zip)'}</span>
          </button>
        </div>
      </header>

      {/* Workspace de 3 paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo: Estructura, Paleta y Pantallas */}
        <aside className="w-72 border-r border-zinc-800/80 bg-[#121215] flex flex-col shrink-0">
          {/* Segmented Control de pestañas izquierdas */}
          <div className="flex border-b border-zinc-800 text-xs font-medium bg-[#0f0f12]">
            <button
              onClick={() => setLeftTab('palette')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'palette'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Componentes</span>
            </button>
            <button
              onClick={() => setLeftTab('layers')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'layers'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Árbol</span>
            </button>
            <button
              onClick={() => setLeftTab('screens')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'screens'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pantallas</span>
            </button>
          </div>

          {/* Contenido pestaña izquierda */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'palette' && (
              <>
                <ComponentPalette />
                <div className="border-t border-zinc-800">
                  <LayerTree />
                </div>
              </>
            )}
            {leftTab === 'layers' && <LayerTree />}
            {leftTab === 'screens' && (
              <>
                <ScreenManager />
                <StateManager />
              </>
            )}
          </div>
        </aside>

        {/* Panel Central: Lienzo y Simulador Móvil */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden">
          <PhoneSimulator />
        </main>

        {/* Panel Derecho: Inspector de Propiedades, Código Kotlin o AST */}
        <aside className="w-96 border-l border-zinc-800/80 bg-[#121215] flex flex-col shrink-0">
          {/* Segmented Control de pestañas derechas */}
          <div className="flex border-b border-zinc-800 text-xs font-medium bg-[#0f0f12]">
            <button
              onClick={() => setRightTab('inspector')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'inspector'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Propiedades</span>
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'code'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código Kotlin</span>
            </button>
            <button
              onClick={() => setRightTab('json')}
              className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'json'
                  ? 'text-zinc-100 border-b-2 border-[#7f52ff] font-semibold bg-[#15151a]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>AST JSON</span>
            </button>
          </div>

          {/* Contenido pestaña derecha */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === 'inspector' && <PropertyInspector />}
            {rightTab === 'code' && <KotlinViewer />}
            {rightTab === 'json' && (
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed bg-[#0d0d10] text-zinc-300 select-text">
                <pre>{JSON.stringify(ast, null, 2)}</pre>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
