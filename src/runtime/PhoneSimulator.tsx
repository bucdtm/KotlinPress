import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../editor/state/editorStore.ts';
import { ComponentRenderer } from './ComponentRenderer.tsx';
import { RuntimeState } from './actionExecutor.ts';
import { Play, MousePointer, RotateCcw, Wifi, BatteryCharging } from 'lucide-react';

export const PhoneSimulator: React.FC = () => {
  const { ast, selectedScreenId, selectScreen, interactiveMode, setInteractiveMode } = useEditorStore();

  const currentScreen = ast.screens.find(s => s.id === selectedScreenId) || ast.screens[0];

  const getInitialStateValues = () => {
    const values: Record<string, any> = {};
    if (currentScreen) {
      for (const v of currentScreen.stateVariables) {
        values[v.name] = Array.isArray(v.initialValue) ? [...v.initialValue] : v.initialValue;
      }
    }
    return values;
  };

  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    values: getInitialStateValues(),
    navigationHistory: [],
    currentRoute: currentScreen?.route || 'home',
  });

  useEffect(() => {
    setRuntimeState(prev => ({
      ...prev,
      values: { ...prev.values, ...getInitialStateValues() },
      currentRoute: currentScreen?.route || 'home',
    }));
  }, [selectedScreenId]);

  useEffect(() => {
    if (runtimeState.currentRoute && currentScreen && runtimeState.currentRoute !== currentScreen.route) {
      const targetScreen = ast.screens.find(s => s.route === runtimeState.currentRoute);
      if (targetScreen) {
        selectScreen(targetScreen.id);
      }
    }
  }, [runtimeState.currentRoute]);

  const handleReset = () => {
    setRuntimeState({
      values: getInitialStateValues(),
      navigationHistory: [],
      currentRoute: currentScreen?.route || 'home',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 select-none">
      {/* Barra superior de control del simulador */}
      <div className="flex items-center gap-3 mb-3 bg-[#121215] border border-zinc-800 rounded-md px-3 py-1 shadow-sm">
        <div className="flex items-center gap-1 bg-[#18181c] p-0.5 rounded border border-zinc-800/80">
          <button
            onClick={() => setInteractiveMode(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              !interactiveMode
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Seleccionar y editar componentes"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => setInteractiveMode(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              interactiveMode
                ? 'bg-[#7f52ff] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Probar botones y eventos en vivo"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
        </div>

        <div className="h-3.5 w-px bg-zinc-800" />

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors"
          title="Reiniciar estado de la pantalla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Chasis de Smartphone Android */}
      <div className="relative w-[360px] h-[700px] bg-[#141417] rounded-[38px] p-2.5 border-2 border-zinc-700/60 shadow-2xl flex flex-col overflow-hidden">
        {/* Cámara frontal punch-hole */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-30 border border-zinc-800 flex items-center justify-center">
          <div className="w-1 h-1 bg-zinc-900 rounded-full" />
        </div>

        {/* Pantalla del dispositivo */}
        <div className="relative flex-1 bg-[#101014] rounded-[28px] overflow-hidden flex flex-col border border-zinc-800/60">
          {/* Barra de Estado Android */}
          <div className="h-7 flex items-center justify-between px-5 pt-1 text-[11px] font-medium text-zinc-400 select-none z-20">
            <span className="font-mono">12:30</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <span className="text-[10px]">5G</span>
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Área de renderizado Composable */}
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {currentScreen ? (
              <ComponentRenderer
                node={currentScreen.rootComponent}
                runtimeState={runtimeState}
                setRuntimeState={setRuntimeState}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
                Sin pantalla activa
              </div>
            )}
          </div>

          {/* Barra de navegación gestual de Android */}
          <div className="h-4 flex items-center justify-center pb-0.5">
            <div className="w-24 h-0.5 bg-zinc-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
