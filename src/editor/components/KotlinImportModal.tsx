import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../state/editorStore.ts';
import { parseKotlinCode, ImportResult } from '../../core/parser/kotlinParser.ts';
import {
  FileCode,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Variable,
  FileType,
  Sparkles,
} from 'lucide-react';

interface KotlinImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (result: { type: 'screen' | 'class'; name: string }) => void;
}

const SAMPLE_SCREEN = `package com.example.app

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun TaskDetailScreen() {
    var taskTitle by remember { mutableStateOf("Comprar pan") }
    var isDone by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp)
    ) {
        Text(
            text = "Detalle de Tarea",
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = taskTitle,
            onValueChange = { taskTitle = it },
            label = { Text("Título de la tarea") }
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = { /* Acción */ }
        ) {
            Text("Marcar como completada")
        }
    }
}`;

const SAMPLE_DATA_CLASS = `package com.example.app.models

data class TaskItem(
    val id: String,
    val title: String,
    val description: String = "",
    val isCompleted: Boolean = false,
    val priority: Int = 1
)`;

const SAMPLE_ENUM = `package com.example.app.models

enum class TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}`;

export const KotlinImportModal: React.FC<KotlinImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { importKotlin } = useEditorStore();
  const [code, setCode] = useState<string>(SAMPLE_SCREEN);
  const [analysis, setAnalysis] = useState<ImportResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Analizar automáticamente cuando el código cambia
  useEffect(() => {
    if (!code.trim()) {
      setAnalysis(null);
      return;
    }
    try {
      const parsed = parseKotlinCode(code);
      setAnalysis(parsed);
      setStatusMsg(null);
    } catch {
      setAnalysis(null);
    }
  }, [code]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!code.trim()) return;

    const result = importKotlin(code);
    if (!result.success) {
      setStatusMsg({
        type: 'error',
        message: result.message,
      });
      return;
    }

    setStatusMsg({
      type: 'success',
      message: result.message,
    });

    if (onImportSuccess) {
      if (result.screen) {
        onImportSuccess({
          type: 'screen',
          name: result.screen.name,
        });
      } else if (result.customFile) {
        onImportSuccess({
          type: 'class',
          name: result.customFile.name,
        });
      }
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const countNodes = (node: { children?: unknown[] }): number => {
    let count = 1;
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countNodes(child as { children?: unknown[] });
      }
    }
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-[#121215] border border-zinc-700/80 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#15151a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7f52ff]/20 border border-[#7f52ff]/40 flex items-center justify-center text-[#9f7dff]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Importar Código Kotlin
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Compose AST & Models
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Pega o sube un archivo <code className="text-[#9f7dff]">.kt</code> con pantallas <code className="text-[#9f7dff]">@Composable</code> o clases Kotlin (<code className="text-[#9f7dff]">data class</code>, <code className="text-[#9f7dff]">enum</code>, etc.)
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

        {/* Acciones rápidas / Snippets de ejemplo */}
        <div className="px-4 py-2 border-b border-zinc-800/80 bg-[#101014] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Probar plantillas:</span>
            <button
              onClick={() => setCode(SAMPLE_SCREEN)}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Pantalla Composable
            </button>
            <button
              onClick={() => setCode(SAMPLE_DATA_CLASS)}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Data Class
            </button>
            <button
              onClick={() => setCode(SAMPLE_ENUM)}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Enum Class
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-800/90 hover:bg-zinc-700/80 rounded cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cargar archivo .kt</span>
            <input type="file" accept=".kt,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Cuerpo: Editor de código y Panel de Análisis en 2 partes */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Editor de código Kotlin */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800/80 bg-[#0d0d10]">
            <div className="px-3 py-1.5 bg-[#121217] border-b border-zinc-800/70 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>Kotlin Source</span>
              <span>{code.split('\n').length} líneas</span>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="// Pega aquí tu código Kotlin (@Composable fun MyScreen() { ... } o data class MyModel(...))"
              spellCheck={false}
              className="flex-1 p-3.5 bg-transparent font-mono text-xs text-zinc-200 resize-none focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto selection:bg-[#7f52ff]/40"
            />
          </div>

          {/* Panel de Análisis en vivo de lo detectado */}
          <div className="w-full md:w-72 bg-[#121215] flex flex-col p-4 overflow-y-auto gap-3 text-xs">
            <span className="font-semibold text-zinc-200 text-xs tracking-tight uppercase text-[10px] text-zinc-400">
              Análisis del Código
            </span>

            {analysis && (analysis.screen || analysis.customFile) ? (
              <div className="flex flex-col gap-3">
                {/* Pantalla Compose detectada */}
                {analysis.screen && (
                  <div className="p-3 rounded-lg border border-purple-800/50 bg-purple-950/20 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#7f52ff]/30 text-[#bba2ff] border border-[#7f52ff]/40">
                        @Composable
                      </span>
                      <span className="font-semibold text-zinc-100 text-xs truncate">
                        {analysis.screen.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-300">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        {countNodes(analysis.screen.rootComponent)} nodos
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Variable className="w-3.5 h-3.5 text-blue-400" />
                        {analysis.screen.stateVariables.length} estados
                      </span>
                    </div>

                    {analysis.screen.stateVariables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.screen.stateVariables.map(sv => (
                          <span
                            key={sv.id}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300"
                          >
                            {sv.name}: {sv.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Clase Kotlin detectada */}
                {analysis.customFile && (
                  <div className="p-3 rounded-lg border border-cyan-800/50 bg-cyan-950/20 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
                        {analysis.customFile.kind}
                      </span>
                      <span className="font-semibold text-zinc-100 text-xs truncate">
                        {analysis.customFile.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                      {analysis.customFile.packageSuffix ? `package ...${analysis.customFile.packageSuffix}` : 'models'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Se exportará a <code className="text-zinc-400">models/{analysis.customFile.name}.kt</code>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 flex flex-col items-center text-center py-6">
                <AlertTriangle className="w-6 h-6 text-amber-400/80 mb-2" />
                <p className="text-zinc-300 font-medium text-xs">Sin elementos detectados</p>
                <p className="text-zinc-500 text-[11px] mt-1">
                  Pega una función con anotación <code className="text-zinc-400">@Composable</code> o una declaración <code className="text-zinc-400">data class / enum class</code>.
                </p>
              </div>
            )}

            {/* Mensajes de aviso / estado */}
            {statusMsg && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMsg.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-[#15151a] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Los elementos importados se adaptarán automáticamente a la paleta, árbol de capas y simulador.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={!analysis || (!analysis.screen && !analysis.customFile)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#7f52ff] hover:bg-[#9068ff] active:bg-[#6f42ef] text-white text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <FileType className="w-3.5 h-3.5" />
              <span>Importar al Proyecto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
