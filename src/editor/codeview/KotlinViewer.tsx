import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { transpileAppToKotlin, GeneratedFile } from '../../core/transpiler/kotlinGenerator.ts';
import { downloadAndroidProjectZip } from '../../core/exporter/zipPackager.ts';
import { Copy, Check, FileCode, FolderArchive } from 'lucide-react';

export const KotlinViewer: React.FC = () => {
  const { ast } = useEditorStore();
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const transpiled = useMemo(() => {
    return transpileAppToKotlin(ast);
  }, [ast]);

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const currentFile: GeneratedFile = transpiled.allFiles[selectedFileIndex] || transpiled.allFiles[0];

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      await downloadAndroidProjectZip(ast);
    } catch (err) {
      console.error('Error generando zip:', err);
      alert('Error al generar el ZIP de Android Studio');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 text-xs">
      {/* Barra superior de acciones */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-slate-200">Código Kotlin (Jetpack Compose)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copiar código al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-md transition disabled:opacity-50"
            title="Descargar proyecto completo de Android Studio en formato ZIP"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Empaquetando...' : 'Descargar .ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Selector de archivos generados con badges de arquitectura */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800 bg-slate-900/40 overflow-x-auto text-[11px]">
        {transpiled.allFiles.map((file, idx) => {
          const isSelected = idx === selectedFileIndex;
          const fileName = file.path.split('/').pop() || '';

          let badgeText = 'Core';
          let badgeColor = 'bg-slate-800 text-slate-300';
          if (fileName.includes('UiState')) {
            badgeText = 'UiState';
            badgeColor = 'bg-emerald-950 text-emerald-300 border border-emerald-800';
          } else if (fileName.includes('ViewModel')) {
            badgeText = 'VM';
            badgeColor = 'bg-indigo-950 text-indigo-300 border border-indigo-800';
          } else if (fileName.includes('Screen')) {
            badgeText = 'Screen';
            badgeColor = 'bg-cyan-950 text-cyan-300 border border-cyan-800';
          }

          return (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-purple-900/60 text-purple-200 font-semibold border border-purple-700/60 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${badgeColor}`}>
                {badgeText}
              </span>
              <span>{fileName}</span>
            </button>
          );
        })}
      </div>

      {/* Visor de código con numeración de líneas */}
      <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed bg-[#0d1117] text-slate-200 select-text">
        <pre className="whitespace-pre">
          <code>{currentFile?.content || '// Sin contenido'}</code>
        </pre>
      </div>
    </div>
  );
};
