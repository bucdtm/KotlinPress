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
  Code,
  Sliders,
  Layers,
  FileJson,
  FolderArchive,
  RotateCcw,
  Upload,
  Download,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const { ast, loadAST, resetToSample } = useEditorStore();
  const [leftTab, setLeftTab] = useState<'palette' | 'layers' | 'screens'>('palette');
  const [rightTab, setRightTab] = useState<'inspector' | 'code' | 'json'>('inspector');

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
            alert('El archivo no parece ser un AST válido de Compose Studio.');
          }
        } catch {
          alert('Error al leer el archivo JSON.');
        }
      };
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden select-none">
      {/* Navbar Superior */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0 z-30">
        {/* Logo & Marca */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-900/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                Compose Studio
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded font-mono">
                Jetpack Compose
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                100% Offline
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {ast.appInfo.appName} · {ast.appInfo.packageName}
            </span>
          </div>
        </div>

        {/* Acciones Centrales de Proyecto */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetToSample}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Cargar demo completa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Demo</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg cursor-pointer transition border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Importar JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition border border-slate-700"
            title="Exportar esquema AST en formato JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar JSON</span>
          </button>
        </div>

        {/* Botón de Descarga Android Studio ZIP */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadAndroidProjectZip(ast)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all"
            title="Descargar proyecto completo listo para abrir en Android Studio"
          >
            <FolderArchive className="w-4 h-4" />
            <span>Descargar Proyecto Android (.ZIP)</span>
          </button>
        </div>
      </header>

      {/* Contenedor Principal (3 Columnas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Panel Izquierdo: Paleta, Capas y Pantallas */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
          {/* Tabs del panel izquierdo */}
          <div className="flex border-b border-slate-800 bg-slate-900 text-xs font-medium">
            <button
              onClick={() => setLeftTab('palette')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'palette'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Paleta</span>
            </button>
            <button
              onClick={() => setLeftTab('layers')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'layers'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Capas</span>
            </button>
            <button
              onClick={() => setLeftTab('screens')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                leftTab === 'screens'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pantallas</span>
            </button>
          </div>

          {/* Contenido según tab izquierdo */}
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'palette' && (
              <>
                <ComponentPalette />
                <div className="border-t border-slate-800">
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

        {/* 2. Panel Central: Simulador Móvil Interactivo */}
        <main className="flex-1 flex flex-col items-center justify-center bg-[#070a13] relative overflow-hidden">
          {/* Fondo cuadriculado suave */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <PhoneSimulator />
        </main>

        {/* 3. Panel Derecho: Inspector de Propiedades o Visor Kotlin */}
        <aside className="w-[450px] border-l border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
          {/* Tabs del panel derecho */}
          <div className="flex border-b border-slate-800 bg-slate-900 text-xs font-medium">
            <button
              onClick={() => setRightTab('inspector')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'inspector'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'code'
                  ? 'text-purple-400 border-b-2 border-purple-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Kotlin Compose</span>
            </button>
            <button
              onClick={() => setRightTab('json')}
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1.5 transition ${
                rightTab === 'json'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold bg-slate-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>AST JSON</span>
            </button>
          </div>

          {/* Contenido según tab derecho */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === 'inspector' && <PropertyInspector />}
            {rightTab === 'code' && <KotlinViewer />}
            {rightTab === 'json' && (
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed bg-[#0d1117] text-emerald-400/90 select-text">
                <pre>{JSON.stringify(ast, null, 2)}</pre>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
