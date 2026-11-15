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
    <div className="flex flex-col h-full bg-[#0d0d10] border-l border-zinc-800 text-xs">
      {/* Barra superior de acciones */}
      <div className="flex items-center justify-between p-2.5 border-b border-zinc-800 bg-[#121215]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-200">Jetpack Compose</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18181c] hover:bg-[#222228] border border-zinc-800 text-zinc-300 transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#7f52ff] hover:bg-[#9068ff] text-white font-medium transition disabled:opacity-50"
            title="Descargar ZIP"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Empaquetando...' : 'Descargar ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Selector de archivos generados con badges sobrios */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-zinc-800 bg-[#0f0f12] overflow-x-auto text-[11px]">
        {transpiled.allFiles.map((file, idx) => {
          const isSelected = idx === selectedFileIndex;
          const fileName = file.path.split('/').pop() || '';

          let badgeText = 'Core';
          let badgeColor = 'bg-zinc-800/80 text-zinc-400';
          if (fileName.includes('UiState')) {
            badgeText = 'State';
            badgeColor = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40';
          } else if (fileName.includes('ViewModel')) {
            badgeText = 'VM';
            badgeColor = 'bg-[#7f52ff]/20 text-[#b299ff] border border-[#7f52ff]/40';
          } else if (fileName.includes('Screen')) {
            badgeText = 'UI';
            badgeColor = 'bg-zinc-800 text-zinc-300';
          }

          return (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
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

      {/* Visor de código técnico */}
      <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed bg-[#0a0a0d] text-zinc-300 select-text">
        <pre className="whitespace-pre">
          <code>{currentFile?.content || '// Sin contenido'}</code>
        </pre>
      </div>
    </div>
  );
};
